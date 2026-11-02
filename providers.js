// Image providers (primary + backup) and the prompt improver.

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

// ----- Provider 1: Pollinations (free, no key) -----
async function pollinations({ prompt, negative, width, height }) {
  const model = process.env.POLLINATIONS_MODEL || "flux";
  const seed = Math.floor(Math.random() * 1000000);
  const url =
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(prompt) +
    `?model=${model}&width=${width}&height=${height}&nologo=true&safe=true&seed=${seed}` +
    `&negative_prompt=${encodeURIComponent(negative)}`;

  const res = await fetchWithTimeout(url, {}, 60000);
  if (!res.ok) throw new Error("Pollinations status " + res.status);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error("Pollinations did not return an image");
  return Buffer.from(await res.arrayBuffer());
}

// ----- Provider 2: Hugging Face (needs free HF_TOKEN) -----
let hfClient = null;
async function huggingface({ prompt, width, height }) {
  const mod = require("@huggingface/inference");
  const Client = mod.InferenceClient || mod.HfInference;
  if (!hfClient) hfClient = new Client(process.env.HF_TOKEN);

  const result = await hfClient.textToImage({
    provider: "auto",
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
    parameters: { width, height, num_inference_steps: 4 },
  });
  return Buffer.from(await result.arrayBuffer());
}

async function generate(opts) {
  const chain = [["pollinations", pollinations]];
  if (process.env.HF_TOKEN) chain.push(["huggingface", huggingface]);

  let lastError = new Error("No provider available");
  for (const [name, fn] of chain) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await fn(opts);
      } catch (err) {
        lastError = err;
        console.warn(`${name} attempt ${attempt} failed: ${err.message}`);
        await sleep(1500);
      }
    }
  }
  throw lastError;
}

// ----- Prompt improver (free text model, falls back to the original prompt) -----
async function improvePrompt(prompt) {
  try {
    const instruction =
      "Rewrite the idea below as one detailed, natural description of a real photograph " +
      "(subject, setting, lighting, camera angle, mood). Keep the original meaning. " +
      "Maximum 60 words. Output only the description.\n\nIdea: " +
      prompt;
    const url =
      "https://text.pollinations.ai/" + encodeURIComponent(instruction) + "?model=openai&private=true";
    const res = await fetchWithTimeout(url, {}, 15000);
    if (!res.ok) return prompt;
    const text = (await res.text()).trim();
    if (text.length < 10 || text.length > 600) return prompt;
    return text;
  } catch (err) {
    return prompt;
  }
}

module.exports = { generate, improvePrompt };
