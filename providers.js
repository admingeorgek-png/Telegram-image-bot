// Image providers (Pollinations, Gemini, Hugging Face), photo editing, translation, prompt improver.

const crypto = require("crypto");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url, options = {}, ms = 45000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ----- Pollinations queue -----
// Without a key, Pollinations allows about one image every 15 seconds and adds a watermark.
// A free key from https://auth.pollinations.ai (set as POLLINATIONS_API_KEY) removes both.
const KEY = process.env.POLLINATIONS_API_KEY || "";
const MIN_GAP_MS = KEY ? 0 : 16000;
const MAX_QUEUE = 6;
const PUBLIC_BASE = (process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL || "").replace(/\/$/, "");

let chain = Promise.resolve();
let lastStart = 0;
let pending = 0;

function queueInfo() {
  return { ahead: pending, waitSec: Math.ceil((pending * MIN_GAP_MS) / 1000) };
}

function queued(task) {
  if (pending >= MAX_QUEUE) {
    const err = new Error("queue full");
    err.busy = true;
    return Promise.reject(err);
  }
  pending++;
  const run = chain.then(async () => {
    try {
      const wait = lastStart + MIN_GAP_MS - Date.now();
      if (wait > 0) await sleep(wait);
      lastStart = Date.now();
      return await task();
    } finally {
      pending--;
    }
  });
  chain = run.catch(() => {});
  return run;
}

async function requestImage(url, headers) {
  const res = await fetchWithTimeout(url, { headers }, 70000);
  if (res.status === 429) {
    const err = new Error("Pollinations rate limit (429)");
    err.rateLimited = true;
    throw err;
  }
  if (!res.ok) throw new Error("Pollinations status " + res.status);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error("Pollinations did not return an image");
  return Buffer.from(await res.arrayBuffer());
}

// ----- Temporary private links (used so Pollinations can read a photo that is being edited) -----
const tempImages = new Map();
function hostTemp(buffer, mime) {
  const now = Date.now();
  for (const [id, v] of tempImages) if (v.exp < now) tempImages.delete(id);
  const id = crypto.randomBytes(16).toString("hex");
  tempImages.set(id, { buffer, mime, exp: now + 5 * 60 * 1000 });
  return id;
}
function getTemp(id) {
  const v = tempImages.get(id);
  if (!v || v.exp < Date.now()) return null;
  return v;
}
function dropTemp(id) {
  tempImages.delete(id);
}

// ----- Provider: Pollinations -----
async function pollinationsOnce({ prompt, negative, width, height }) {
  const model = process.env.POLLINATIONS_MODEL || "flux";
  const seed = Math.floor(Math.random() * 1000000);
  let params = `model=${model}&width=${width}&height=${height}&nologo=true&safe=true&seed=${seed}`;
  if (negative) params += `&negative_prompt=${encodeURIComponent(negative)}`;
  const encoded = encodeURIComponent(prompt);

  if (KEY) {
    try {
      return await requestImage(`https://gen.pollinations.ai/image/${encoded}?${params}`, {
        Authorization: `Bearer ${KEY}`,
      });
    } catch (err) {
      if (err.rateLimited) throw err;
      console.warn("Keyed Pollinations endpoint failed, trying legacy endpoint:", err.message);
      return await requestImage(
        `https://image.pollinations.ai/prompt/${encoded}?${params}&token=${encodeURIComponent(KEY)}`,
        {}
      );
    }
  }
  return await requestImage(`https://image.pollinations.ai/prompt/${encoded}?${params}`, {});
}

function pollinations(opts) {
  return queued(() => pollinationsOnce(opts));
}

// ----- Provider: Google Gemini (needs GEMINI_API_KEY) -----
function parseGeminiImage(data) {
  const parts =
    (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  for (const p of parts) {
    const inline = p.inlineData || p.inline_data;
    if (inline && inline.data) return Buffer.from(inline.data, "base64");
  }
  throw new Error("Gemini returned no image");
}

async function geminiRequest(model, parts) {
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({ contents: [{ parts }] }),
    },
    70000
  );
  if (res.status === 429) {
    const err = new Error("Gemini rate limit (429)");
    err.rateLimited = true;
    throw err;
  }
  if (!res.ok) throw new Error("Gemini status " + res.status);
  return parseGeminiImage(await res.json());
}

async function gemini({ prompt, width, height }) {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const shape = height > width ? "tall portrait orientation" : width > height ? "wide landscape orientation" : "square";
  return geminiRequest(model, [{ text: `Generate an image, ${shape}. ${prompt}` }]);
}

async function geminiEdit({ buffer, mime, instruction }) {
  const model = process.env.GEMINI_EDIT_MODEL || process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  return geminiRequest(model, [
    { text: instruction },
    { inline_data: { mime_type: mime || "image/jpeg", data: buffer.toString("base64") } },
  ]);
}

// ----- Provider: Hugging Face (needs free HF_TOKEN) -----
let hfClient = null;
function getHf() {
  const mod = require("@huggingface/inference");
  const Client = mod.InferenceClient || mod.HfInference;
  if (!hfClient) hfClient = new Client(process.env.HF_TOKEN);
  return hfClient;
}

async function huggingface({ prompt, width, height }) {
  const result = await getHf().textToImage({
    provider: "auto",
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
    parameters: { width, height, num_inference_steps: 4 },
  });
  return Buffer.from(await result.arrayBuffer());
}

async function huggingfaceEdit({ buffer, mime, instruction }) {
  const result = await getHf().imageToImage({
    provider: "auto",
    model: process.env.HF_EDIT_MODEL || "black-forest-labs/FLUX.1-Kontext-dev",
    inputs: new Blob([buffer], { type: mime || "image/jpeg" }),
    parameters: { prompt: instruction },
  });
  return Buffer.from(await result.arrayBuffer());
}

// ----- Photo editing: Pollinations "kontext" (needs a key and this server's public address) -----
async function pollinationsEdit({ buffer, mime, instruction }) {
  const id = hostTemp(buffer, mime);
  try {
    const imageUrl = `${PUBLIC_BASE}/tmp/${id}`;
    const seed = Math.floor(Math.random() * 1000000);
    const params = `model=kontext&image=${encodeURIComponent(imageUrl)}&nologo=true&private=true&seed=${seed}`;
    const encoded = encodeURIComponent(instruction);
    return await queued(async () => {
      try {
        return await requestImage(`https://gen.pollinations.ai/image/${encoded}?${params}`, {
          Authorization: `Bearer ${KEY}`,
        });
      } catch (err) {
        if (err.rateLimited) throw err;
        return await requestImage(
          `https://image.pollinations.ai/prompt/${encoded}?${params}&token=${encodeURIComponent(KEY)}`,
          {}
        );
      }
    });
  } finally {
    dropTemp(id);
  }
}

// ----- Provider lists -----
// Order can be changed with PROVIDER_ORDER, for example "gemini,pollinations,huggingface"
function orderedNames(defaults) {
  return (process.env.PROVIDER_ORDER || defaults)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function activeProviders() {
  const all = {
    pollinations: { fn: pollinations, ready: true },
    gemini: { fn: gemini, ready: !!process.env.GEMINI_API_KEY },
    huggingface: { fn: huggingface, ready: !!process.env.HF_TOKEN },
  };
  const list = orderedNames("pollinations,gemini,huggingface")
    .filter((n) => all[n] && all[n].ready)
    .map((n) => [n, all[n].fn]);
  return list.length ? list : [["pollinations", pollinations]];
}

function editProviders() {
  const all = {
    gemini: { fn: geminiEdit, ready: !!process.env.GEMINI_API_KEY },
    pollinations: { fn: pollinationsEdit, ready: !!KEY && !!PUBLIC_BASE },
    huggingface: { fn: huggingfaceEdit, ready: !!process.env.HF_TOKEN },
  };
  // For editing, Gemini goes first by default because it accepts the photo directly
  return orderedNames("gemini,pollinations,huggingface")
    .filter((n) => all[n] && all[n].ready)
    .map((n) => [n, all[n].fn]);
}

function canEdit() {
  return editProviders().length > 0;
}

async function runChain(list, opts) {
  let lastError = new Error("No provider available");
  for (const [name, fn] of list) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await fn(opts);
      } catch (err) {
        lastError = err;
        console.warn(`${name} attempt ${attempt} failed: ${err.message}`);
        if (err.busy) break; // queue is full, go straight to the next provider
        await sleep(err.rateLimited && name === "pollinations" ? 17000 : 1500);
      }
    }
  }
  throw lastError;
}

function generate(opts) {
  return runChain(activeProviders(), opts);
}

async function editImage(opts) {
  const list = editProviders();
  if (!list.length) {
    const err = new Error("no editing provider is set up");
    err.noEditProvider = true;
    throw err;
  }
  return runChain(list, opts);
}

// ----- Text helpers (free text model, always fall back to the original text) -----
async function askText(instruction, timeoutMs) {
  const url = "https://text.pollinations.ai/" + encodeURIComponent(instruction) + "?model=openai&private=true";
  const res = await fetchWithTimeout(url, {}, timeoutMs);
  if (!res.ok) throw new Error("text status " + res.status);
  return (await res.text()).trim();
}

const NON_ENGLISH =
  /[^\x00-\x7F]|\b(un|une|le|la|les|des|du|el|los|las|una|um|uma|der|die|das|und|mit|kuma|yana|wani|ati|ninu)\b/i;

async function translateToEnglish(prompt) {
  if (!NON_ENGLISH.test(prompt)) return prompt;
  try {
    const text = await askText(
      "Translate the text below to English. If it is already English, return it unchanged. " +
        "Output only the translation, nothing else.\n\nText: " +
        prompt,
      12000
    );
    if (text.length < 2 || text.length > 600) return prompt;
    return text;
  } catch (err) {
    return prompt;
  }
}

async function improvePrompt(prompt) {
  try {
    const text = await askText(
      "Turn the idea below into one detailed image prompt, maximum 50 words. " +
        "Keep every detail of the idea and add nothing that changes its meaning. " +
        "If the idea asks for a specific style or medium (cartoon, logo, poster, painting, 3D and so on), keep that style. " +
        "If it asks for text to appear in the image, keep that text exactly. " +
        "If no style is requested, describe a realistic photograph (subject, setting, lighting, camera angle, mood). " +
        "Output only the prompt.\n\nIdea: " +
        prompt,
      12000
    );
    if (text.length < 10 || text.length > 500) return prompt;
    return text;
  } catch (err) {
    return prompt;
  }
}

module.exports = { generate, editImage, canEdit, improvePrompt, translateToEnglish, queueInfo, getTemp };
