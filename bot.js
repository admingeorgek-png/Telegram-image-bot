// Telegram image bot: everything in ONE file.
// Needs package.json with: grammy, mongodb, @huggingface/inference. Start with: node bot.js

const __src = {};
const __cache = {};
function __load(name) {
  if (!__cache[name]) {
    const m = { exports: {} };
    __cache[name] = m;
    __src[name](m, m.exports, __require);
  }
  return __cache[name].exports;
}
function __require(name) {
  return name in __src ? __load(name) : require(name);
}

// ===================== safety.js =====================
__src["./safety"] = function (module, exports, require) {
// Basic prompt safety filter. This is a first line of defense only.
// Keyword filters can be bypassed, so the providers' own safe modes stay on too.

const BLOCKED = [
  /\b(nude|nudes|naked|nsfw|porn|porno|pornographic|sex|sexual|erotic|hentai|topless|nipples?|genitals?|boobs?|fetish|xxx|blowjob|orgasm|masturbat\w*|lingerie)\b/i,
  /\b(gore|gory|dismember\w*|decapitat\w*|mutilat\w*|beheading|bloodbath)\b/i,
  /\b(swastika|nazi)\b/i,
  /\b(child abuse|rape|raping)\b/i,
];

const MINOR = /\b(child|children|kid|kids|boy|girl|minor|underage|teen|teens|teenager|toddler|baby|loli|shota|schoolgirl|schoolboy|preteen)\b/i;
const SUGGESTIVE = /\b(sexy|seductive|bikini|swimsuit|underwear|panties|bra|undress\w*|cleavage|thong|provocative|revealing|sensual|flirty)\b/i;

// Photo edits are stricter: nobody should be undressed or sexualized in an edited photo,
// whatever the age, because the bot cannot see who is in the picture.
const EDIT_BLOCKED =
  /\b(undress\w*|take\s+off|remove\s+(?:her|his|their|the|my)?\s*(?:clothes|clothing|shirt|top|dress|pants|bra|underwear)|see[- ]through|transparent\s+(?:clothes|clothing|dress)|bikini|swimsuit|swimwear|underwear|panties|bra|cleavage|breasts?|sexy|seductive|sensual|topless|strip(?:ped|ping)?\s+(?:her|his|their|him|them|off|naked|down))\b/i;

function checkPrompt(text) {
  const t = String(text || "");
  for (const re of BLOCKED) {
    if (re.test(t)) return { ok: false };
  }
  if (MINOR.test(t) && SUGGESTIVE.test(t)) return { ok: false };
  return { ok: true };
}

function checkEditInstruction(text) {
  const t = String(text || "");
  if (!checkPrompt(t).ok) return { ok: false };
  if (EDIT_BLOCKED.test(t)) return { ok: false };
  return { ok: true };
}

module.exports = { checkPrompt, checkEditInstruction };

};

// ===================== styles.js =====================
__src["./styles"] = function (module, exports, require) {
// Style presets. "art" styles are not photos, so the realism boost and negative prompt are skipped.
const STYLES = {
  portrait: {
    label: "Portrait photo",
    suffix:
      "professional portrait photograph, 85mm lens, shallow depth of field, soft natural window light, realistic skin texture",
    art: false,
  },
  street: {
    label: "Street photo",
    suffix: "candid street photography, 35mm lens, natural daylight, documentary style, authentic atmosphere",
    art: false,
  },
  product: {
    label: "Product shot",
    suffix: "professional product photography, clean studio lighting, soft shadows, sharp focus, high detail",
    art: false,
  },
  food: {
    label: "Food photo",
    suffix: "professional food photography, natural window light, shallow depth of field, appetizing, high detail",
    art: false,
  },
  landscape: {
    label: "Landscape",
    suffix: "landscape photography, golden hour light, wide angle lens, rich natural colors, sharp detail",
    art: false,
  },
  anime: {
    label: "Anime",
    suffix: "anime style illustration, detailed, vibrant colors, clean line art",
    art: true,
  },
  logo: {
    label: "Logo",
    suffix: "minimalist vector logo design, flat colors, clean simple shapes, white background",
    art: true,
  },
  art: {
    label: "Digital art",
    suffix: "detailed digital painting, rich colors, dramatic lighting, concept art",
    art: true,
  },
};

module.exports = { STYLES };

};

// ===================== content.js =====================
__src["./content"] = function (module, exports, require) {
// Text content: daily ideas, examples, terms and privacy.

const IDEAS = [
  "An elderly fisherman mending nets on a wooden boat at sunrise, calm sea, golden light",
  "A busy street market in Lagos at midday, colorful fabrics, vendors and shoppers, candid moment",
  "A steaming cup of coffee on a wooden table beside a rainy window, cozy morning mood",
  "A young woman reading a book in a sunlit library, dust floating in the light",
  "A street musician playing guitar in a train station while commuters pass by",
  "A mountain village at dawn with mist in the valley and smoke rising from the rooftops",
  "A chef plating a colorful dish in a busy restaurant kitchen, steam rising",
  "Children playing football on a dusty field at sunset, joyful and energetic",
  "A vintage car parked on a quiet cobblestone street in the evening, warm streetlights",
  "A farmer holding freshly harvested tomatoes in a green field, morning light",
  "A cozy bookshop interior with tall shelves and a cat sleeping on the counter",
  "A cyclist crossing a bridge in the fog at early morning",
  "A rooftop view of a modern city at blue hour with glowing windows",
  "A baker pulling fresh bread from a wood oven in a small village bakery",
  "A red umbrella on a rainy city street, reflections on the wet pavement",
  "A traveler with a backpack looking over a desert canyon at golden hour",
  "A grandmother laughing while cooking with her grandchildren in a bright kitchen",
  "A calm lake with a wooden dock and a canoe at sunrise, soft mist",
  "A tailor measuring fabric in a small workshop full of colorful cloth",
  "A lighthouse on a rocky coast under a dramatic stormy sky",
  "A student studying late at night with a desk lamp and city lights behind the window",
  "A fresh fruit stall at a morning market, mangoes, pineapples and oranges in neat piles",
  "A runner on an empty beach at dawn, wet sand reflecting the sky",
  "A potter shaping clay on a wheel, hands covered in wet clay, warm studio light",
  "A snowy cabin in a pine forest with warm light in the windows",
  "A group of friends laughing around a table at an outdoor cafe in the evening",
  "A close up of a honeybee on a sunflower, sharp detail, soft background",
  "A busy train platform at rush hour with motion blur and one person standing still",
  "A wooden table with fresh herbs, olive oil and bread, natural window light",
  "A tall ship sailing at sunset with orange clouds and calm water",
];

const EXAMPLES = [
  "A woman in her 30s laughing at a market in Lagos, afternoon light",
  "A steaming bowl of jollof rice on a wooden table, natural window light",
  "An old man playing chess in a park, soft morning light",
  "A modern living room with a large window and green plants",
  "A football stadium at night under bright floodlights, crowd cheering",
  "A fresh loaf of bread on a kitchen counter, warm light",
];

function ideaOfTheDay() {
  const dayNumber = Math.floor(Date.now() / 86400000);
  return IDEAS[dayNumber % IDEAS.length];
}

function termsText(support) {
  return (
    "Terms of use\n\n" +
    "1. This bot creates AI images from text you send. Results can be wrong or unexpected.\n" +
    "2. Do not request sexual content, content involving minors, extreme violence, hateful content, or anything illegal. " +
    "Users who break these rules may be blocked.\n" +
    "3. You are responsible for how you use the images. Do not present AI images as real photos to mislead people.\n" +
    "   Only edit photos you have the right to use. Do not use edits to deceive, harass or harm anyone, or to make sexual or abusive images of real people.\n" +
    "4. Free images are limited per day. Bought credits do not expire. For a payment problem or a refund request, contact " +
    support +
    ".\n" +
    "5. The service is provided as is and may change or stop at any time."
  );
}

function privacyText(support) {
  return (
    "Privacy\n\n" +
    "What we store: your Telegram user ID, how many images you made, your credits, referrals, your settings, and payment records for Telegram Stars purchases.\n\n" +
    "What we send to other services: your text description goes to the image and text services that create, translate or improve your image (Pollinations, and Hugging Face or Google if enabled). Do not put private information in your descriptions.\n\n" +
    "Photos you send for editing: the photo is downloaded to our server, sent to the editing service that does the edit (Google, Pollinations or Hugging Face, depending on setup) and then discarded. We do not keep your photos. For some editing services the photo is available through a private random link for a few minutes while the edit runs.\n\n" +
    "Reports: if you tap Report under an image, we keep the description and review the image.\n\n" +
    "We do not store the images we generate. Telegram keeps your chat history.\n\n" +
    "To ask for your data to be deleted, contact " +
    support +
    "."
  );
}

module.exports = { IDEAS, EXAMPLES, ideaOfTheDay, termsText, privacyText };

};

// ===================== db.js =====================
__src["./db"] = function (module, exports, require) {
// Storage layer. Uses MongoDB if MONGODB_URI is set, otherwise memory only.
// Memory-only data is lost on every restart, so set up MongoDB before sharing the bot.

let users = null;
let payments = null;
let promos = null;
let reports = null;
let meta = null;

const memUsers = new Map();
const memPayments = [];
const memPromos = new Map();
const memReports = [];
const memMeta = new Map();

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newUser(id) {
  return {
    _id: id,
    day: today(),
    used: 0, // free images used today
    credits: 0, // extra images (bought, earned or redeemed)
    total: 0, // all-time images
    referrals: 0,
    improve: true, // prompt improver on by default
    style: null, // default style preset
    daily: false, // opted in to the daily idea message
    banned: false,
    lastGen: null, // day of last generation
    joined: new Date().toISOString(),
  };
}

async function init() {
  if (!process.env.MONGODB_URI) {
    console.warn("MONGODB_URI not set: using memory storage (data is lost on restart).");
    return;
  }
  const { MongoClient } = require("mongodb");
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const d = client.db(process.env.MONGODB_DB || "imagebot");
  users = d.collection("users");
  payments = d.collection("payments");
  promos = d.collection("promos");
  reports = d.collection("reports");
  meta = d.collection("meta");
  console.log("Connected to MongoDB.");
}

// ----- Users -----
async function findUser(id) {
  if (users) return await users.findOne({ _id: id });
  const u = memUsers.get(id);
  return u ? { ...u } : null;
}

async function saveUser(user) {
  const { isNew, ...doc } = user;
  if (users) await users.replaceOne({ _id: doc._id }, doc, { upsert: true });
  else memUsers.set(doc._id, { ...doc });
}

async function getUser(id) {
  const found = await findUser(id);
  if (found) return found;
  const u = newUser(id);
  await saveUser(u);
  return { ...u, isNew: true };
}

async function deleteUser(id) {
  if (users) {
    const r = await users.deleteOne({ _id: id });
    return r.deletedCount > 0;
  }
  return memUsers.delete(id);
}

async function listUserIds(opts = {}) {
  if (users) {
    const filter = { banned: { $ne: true } };
    if (opts.dailyOnly) filter.daily = true;
    const docs = await users.find(filter, { projection: { _id: 1 } }).toArray();
    return docs.map((d) => d._id);
  }
  return [...memUsers.values()]
    .filter((u) => !u.banned && (!opts.dailyOnly || u.daily))
    .map((u) => u._id);
}

async function listBanned() {
  if (users) {
    const docs = await users.find({ banned: true }, { projection: { _id: 1 } }).toArray();
    return docs.map((d) => d._id);
  }
  return [...memUsers.values()].filter((u) => u.banned).map((u) => u._id);
}

// ----- Payments and reports -----
async function recordPayment(p) {
  if (payments) await payments.insertOne(p);
  else memPayments.push(p);
}

async function recordReport(r) {
  if (reports) await reports.insertOne(r);
  else memReports.push(r);
}

// ----- Promo codes -----
async function createPromo({ code, credits, maxUses }) {
  const doc = {
    _id: String(code).toUpperCase(),
    credits,
    maxUses,
    used: 0,
    usedBy: [],
    active: true,
    created: new Date().toISOString(),
  };
  if (promos) {
    try {
      await promos.insertOne(doc);
      return true;
    } catch (err) {
      if (err && err.code === 11000) return false;
      throw err;
    }
  }
  if (memPromos.has(doc._id)) return false;
  memPromos.set(doc._id, doc);
  return true;
}

async function redeemPromo(code, userId) {
  const c = String(code).trim().toUpperCase();
  if (promos) {
    const res = await promos.findOneAndUpdate(
      { _id: c, active: true, usedBy: { $ne: userId }, $expr: { $lt: ["$used", "$maxUses"] } },
      { $inc: { used: 1 }, $addToSet: { usedBy: userId } },
      { returnDocument: "after" }
    );
    const doc = res && res.value !== undefined ? res.value : res;
    if (doc) return { ok: true, credits: doc.credits };
    const existing = await promos.findOne({ _id: c });
    if (!existing || !existing.active) return { ok: false, reason: "invalid" };
    if (existing.usedBy.includes(userId)) return { ok: false, reason: "used" };
    return { ok: false, reason: "exhausted" };
  }
  const p = memPromos.get(c);
  if (!p || !p.active) return { ok: false, reason: "invalid" };
  if (p.usedBy.includes(userId)) return { ok: false, reason: "used" };
  if (p.used >= p.maxUses) return { ok: false, reason: "exhausted" };
  p.used++;
  p.usedBy.push(userId);
  return { ok: true, credits: p.credits };
}

// ----- Small key/value store -----
async function getMeta(key) {
  if (meta) {
    const d = await meta.findOne({ _id: key });
    return d ? d.value : null;
  }
  return memMeta.has(key) ? memMeta.get(key) : null;
}

async function setMeta(key, value) {
  if (meta) await meta.replaceOne({ _id: key }, { _id: key, value }, { upsert: true });
  else memMeta.set(key, value);
}

// ----- Admin stats -----
async function stats() {
  const t = today();
  if (users) {
    const total = await users.countDocuments();
    const activeToday = await users.countDocuments({ lastGen: t });
    const bannedCount = await users.countDocuments({ banned: true });
    const img = await users.aggregate([{ $group: { _id: null, n: { $sum: "$total" } } }]).toArray();
    const pay = await payments
      .aggregate([{ $group: { _id: null, stars: { $sum: "$stars" }, n: { $sum: 1 } } }])
      .toArray();
    const reportCount = await reports.countDocuments();
    return {
      storage: "MongoDB",
      users: total,
      activeToday,
      banned: bannedCount,
      images: img[0] ? img[0].n : 0,
      stars: pay[0] ? pay[0].stars : 0,
      payments: pay[0] ? pay[0].n : 0,
      reports: reportCount,
    };
  }
  let images = 0;
  let activeToday = 0;
  let bannedCount = 0;
  for (const u of memUsers.values()) {
    images += u.total || 0;
    if (u.lastGen === t) activeToday++;
    if (u.banned) bannedCount++;
  }
  return {
    storage: "memory (not saved)",
    users: memUsers.size,
    activeToday,
    banned: bannedCount,
    images,
    stars: memPayments.reduce((s, p) => s + p.stars, 0),
    payments: memPayments.length,
    reports: memReports.length,
  };
}

module.exports = {
  init,
  findUser,
  getUser,
  saveUser,
  deleteUser,
  listUserIds,
  listBanned,
  recordPayment,
  recordReport,
  createPromo,
  redeemPromo,
  getMeta,
  setMeta,
  stats,
  today,
};

};

// ===================== providers.js =====================
__src["./providers"] = function (module, exports, require) {
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

};

// ===================== bot.js =====================
__src["./bot"] = function (module, exports, require) {
const http = require("http");
const crypto = require("crypto");
const { Bot, InputFile, InlineKeyboard, webhookCallback } = require("grammy");
const db = require("./db");
const { checkPrompt, checkEditInstruction } = require("./safety");
const { generate, editImage, canEdit, improvePrompt, translateToEnglish, queueInfo, getTemp } = require("./providers");
const { STYLES } = require("./styles");
const content = require("./content");

// ---------- Settings ----------
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN environment variable.");
  process.exit(1);
}
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 5);
const SUPPORT_CONTACT = process.env.SUPPORT_CONTACT || "the bot owner";
const DAILY_HOUR = Number(process.env.DAILY_HOUR || 9); // UTC hour for the daily idea message

let REQUIRED_CHANNEL = (process.env.REQUIRED_CHANNEL || "").trim();
if (REQUIRED_CHANNEL && !REQUIRED_CHANNEL.startsWith("@")) REQUIRED_CHANNEL = "@" + REQUIRED_CHANNEL;

const WEBHOOK_BASE = (process.env.WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL || "").replace(/\/$/, "");
const USE_WEBHOOK = process.env.USE_WEBHOOK !== "false" && !!WEBHOOK_BASE;
const WEBHOOK_SECRET = crypto.createHash("sha256").update(BOT_TOKEN).digest("hex").slice(0, 32);

const REFERRAL_BONUS = 3; // credits the inviter gets
const WELCOME_BONUS = 2; // credits a new user gets when joining by invite

// Credit packs sold with Telegram Stars (change the numbers any time)
const PACKS = [
  { id: "p20", images: 20, stars: 50 },
  { id: "p60", images: 60, stars: 130 },
  { id: "p150", images: 150, stars: 300 },
];

const SIZES = {
  square: { width: 1024, height: 1024 },
  portrait: { width: 768, height: 1024 },
  wide: { width: 1024, height: 576 },
};
const SIZES_HD = {
  square: { width: 1536, height: 1536 },
  portrait: { width: 1152, height: 1536 },
  wide: { width: 1536, height: 864 },
};

const REALISM =
  "ultra realistic photograph, shot on 35mm lens DSLR, natural lighting, " +
  "realistic skin texture, true to life colors, sharp focus, candid, high detail";
const REALISM_PLUS =
  "raw unedited photo, shot on iPhone, natural available light, visible skin pores, " +
  "slight film grain, natural imperfections, no retouching, no filters, true to life, candid";
const NEGATIVE =
  "cartoon, 3d render, plastic skin, deformed hands, extra fingers, distorted face, watermark";

// Requests for graphics or art styles skip the "real photo" boost
const STYLE_WORDS =
  /cartoon|anime|illustration|painting|drawing|sketch|3d|pixel|watercolor|comic|banner|logo|poster|flyer|wallpaper|icon|infographic|certificate|sticker|template|vector|flat design|graphic design|thumbnail|cover|invitation|mockup|pattern|tattoo|emoji|meme|diagram/i;
// Prompts that already describe a photo in detail are sent mostly as written
const PHOTO_HINT = /photo|realistic|shot on|lens|dslr|\d+\s?mm|cinematic|portrait|film grain/i;
// -------------------------------

const bot = new Bot(BOT_TOKEN);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const busy = new Set(); // users with a generation in progress
const sessions = new Map(); // "chatId:messageId" -> job (for the buttons)
const banned = new Set();
const reported = new Set();
const memberCache = new Map(); // userId -> expiry time (channel membership)
let failStreak = 0;
let pendingBroadcast = null;

function remember(chatId, messageId, job) {
  sessions.set(`${chatId}:${messageId}`, job);
  if (sessions.size > 1000) sessions.delete(sessions.keys().next().value);
}

// ---------- Admin alerts (at most one per kind every 30 minutes) ----------
const alertTimes = new Map();
async function alertAdmin(key, text) {
  if (!ADMIN_ID) return;
  const last = alertTimes.get(key) || 0;
  if (Date.now() - last < 30 * 60 * 1000) return;
  alertTimes.set(key, Date.now());
  await bot.api.sendMessage(ADMIN_ID, "Alert: " + text).catch(() => {});
}

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
  alertAdmin("unhandled", "Unhandled error: " + String((err && err.message) || err).slice(0, 300));
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  alertAdmin("uncaught", "Uncaught error: " + String((err && err.message) || err).slice(0, 300));
});

// ---------- Limits ----------
function consume(user) {
  const t = db.today();
  if (user.day !== t) {
    user.day = t;
    user.used = 0;
  }
  if (user.used < DAILY_LIMIT) {
    user.used++;
    return "daily";
  }
  if (user.credits > 0) {
    user.credits--;
    return "credit";
  }
  return null;
}

function refund(user, kind) {
  if (kind === "daily" && user.used > 0) user.used--;
  if (kind === "credit") user.credits++;
}

// ---------- Keyboards ----------
function resultKeyboard() {
  return new InlineKeyboard()
    .text("🔄 Regenerate", "regen")
    .text("📷 More realistic", "real")
    .row()
    .text("Portrait", "ar:portrait")
    .text("Square", "ar:square")
    .text("Wide", "ar:wide")
    .row()
    .text("🎨 Style", "styles")
    .text("⬆️ HD", "hd")
    .text("✏️ Edit", "edit")
    .row()
    .text("⚠️ Report", "report");
}

function editKeyboard() {
  return new InlineKeyboard()
    .text("✏️ Edit again", "edit")
    .text("↩️ Edit original", "eo")
    .row()
    .text("⚠️ Report", "report");
}

function quickEditKeyboard() {
  return new InlineKeyboard()
    .text("Change background", "qe:bg")
    .text("Remove background", "qe:rmbg")
    .row()
    .text("Black and white", "qe:bw")
    .text("Enhance quality", "qe:enh")
    .row()
    .text("Cartoon style", "qe:cartoon")
    .text("Cancel", "qe:cancel");
}

// prefix "rs" re-styles an image, prefix "ds" sets the default style
function styleKeyboard(prefix, isDefaultPicker) {
  const kb = new InlineKeyboard();
  const ids = Object.keys(STYLES);
  ids.forEach((id, i) => {
    kb.text(STYLES[id].label, `${prefix}:${id}`);
    if (i % 2 === 1 && i < ids.length - 1) kb.row();
  });
  kb.row();
  if (isDefaultPicker) kb.text("Auto (no preset)", `${prefix}:auto`);
  else kb.text("Back", "back");
  return kb;
}

// ---------- Required channel ----------
async function isAllowedByChannel(ctx) {
  if (!REQUIRED_CHANNEL || ctx.from.id === ADMIN_ID) return true;
  const exp = memberCache.get(ctx.from.id);
  if (exp && exp > Date.now()) return true;
  try {
    const m = await ctx.api.getChatMember(REQUIRED_CHANNEL, ctx.from.id);
    const ok =
      ["member", "administrator", "creator"].includes(m.status) || (m.status === "restricted" && m.is_member);
    if (ok) memberCache.set(ctx.from.id, Date.now() + 10 * 60 * 1000);
    return ok;
  } catch (err) {
    console.error("Channel check failed:", err.message);
    alertAdmin(
      "channel",
      `The channel check is failing, so it is being skipped. Is the bot an admin of ${REQUIRED_CHANNEL}? ${err.message}`
    );
    return true; // fail open so users are not locked out by a setup problem
  }
}

async function requireChannel(ctx) {
  if (await isAllowedByChannel(ctx)) return true;
  const kb = new InlineKeyboard()
    .url("Join channel", `https://t.me/${REQUIRED_CHANNEL.replace(/^@/, "")}`)
    .row()
    .text("I have joined", "joined");
  await ctx.reply("To use this bot, please join our channel first, then tap the button below.", {
    reply_markup: kb,
  });
  return false;
}

// ---------- Generation ----------
async function runGeneration(ctx, userId, job) {
  if (busy.has(userId)) {
    return ctx.reply("Please wait, your last image is still generating.");
  }
  busy.add(userId);

  let waiting = null;
  let user = null;
  let kind = null;
  try {
    user = await db.getUser(userId);
    kind = consume(user);
    if (!kind) {
      await ctx.reply(
        `You have used your ${DAILY_LIMIT} free images today (they reset at midnight UTC).\n\n` +
          "Get more with /buy or /invite, or enter a promo code with /redeem."
      );
      return;
    }
    await db.saveUser(user);

    waiting = await ctx.reply("Generating... this can take up to a minute.");

    const q = queueInfo();
    if (q.ahead > 0 && q.waitSec > 0) {
      await ctx.api
        .editMessageText(
          waiting.chat.id,
          waiting.message_id,
          `You are number ${q.ahead + 1} in line. Estimated wait: about ${q.waitSec + 20} seconds.`
        )
        .catch(() => {});
    }

    // Understand non-English descriptions
    const text = await translateToEnglish(job.prompt);
    if (text !== job.prompt && !checkPrompt(text).ok) {
      refund(user, kind);
      await db.saveUser(user);
      kind = null;
      await ctx.reply("I can't create that. Please try a different description.");
      return;
    }

    const style = STYLES[job.style] || null;
    const styled = !style && STYLE_WORDS.test(text);
    const detailed = text.length > 150 || PHOTO_HINT.test(text);

    let base = text;
    const wantsImprove = !(style && style.art);
    if (wantsImprove && !detailed && user.improve !== false) {
      const improved = await improvePrompt(text);
      if (checkPrompt(improved).ok) base = improved;
    }

    let finalPrompt;
    if (style) {
      finalPrompt = `${base}, ${style.suffix}`;
      if (job.level >= 2 && !style.art) finalPrompt += `, ${REALISM_PLUS}`;
    } else if (styled) {
      finalPrompt = base;
    } else if (detailed) {
      finalPrompt =
        job.level >= 2 ? `${base}, ${REALISM_PLUS}` : `${base}, natural lighting, true to life colors`;
    } else {
      finalPrompt = `${base}, ${job.level >= 2 ? REALISM_PLUS : REALISM}`;
    }
    finalPrompt = finalPrompt.slice(0, 900);

    const isArt = style ? style.art : styled;
    const sizes = job.hd ? SIZES_HD : SIZES;
    const size = sizes[job.ratio] || sizes.square;

    const buffer = await generate({
      prompt: finalPrompt,
      negative: isArt ? "" : NEGATIVE,
      width: size.width,
      height: size.height,
    });

    const sent = await ctx.replyWithPhoto(new InputFile(buffer, "image.jpg"), {
      caption: job.prompt.slice(0, 200),
      reply_markup: resultKeyboard(),
    });
    remember(sent.chat.id, sent.message_id, job);

    if (job.hd) {
      // Also send the original file so Telegram does not compress it
      await ctx.replyWithDocument(new InputFile(buffer, "image-hd.jpg")).catch(() => {});
    }

    failStreak = 0;
    user.total++;
    user.lastGen = db.today();
    await db.saveUser(user);
  } catch (err) {
    console.error("Generation failed:", err);
    failStreak++;
    if (failStreak >= 3) {
      alertAdmin("genfail", `Image generation has failed ${failStreak} times in a row. Last error: ${err.message}`);
    }
    if (user && kind) {
      refund(user, kind);
      await db.saveUser(user).catch(() => {});
    }
    await ctx
      .reply(
        "The image service is busy or slow right now. You were not charged. " +
          "Please try again in about 30 seconds."
      )
      .catch(() => {});
  } finally {
    busy.delete(userId);
    if (waiting) await ctx.api.deleteMessage(waiting.chat.id, waiting.message_id).catch(() => {});
  }
}

// Start a generation without making Telegram wait for it
function launch(ctx, userId, job) {
  runGeneration(ctx, userId, job).catch((err) => console.error("runGeneration crashed:", err));
}

async function handlePrompt(ctx, text) {
  const prompt = (text || "").trim();
  if (!prompt) return ctx.reply("Add a description, e.g. an old man fishing at sunrise");
  if (prompt.length > 500) return ctx.reply("Description too long (max 500 characters).");
  if (!checkPrompt(prompt).ok) {
    return ctx.reply("I can't create that. Please try a different description.");
  }
  if (!(await requireChannel(ctx))) return;
  const user = await db.getUser(ctx.from.id);
  launch(ctx, ctx.from.id, { prompt, ratio: "square", level: 1, style: user.style || null });
}

// ---------- Photo editing ----------
const pendingEdit = new Map(); // userId -> { fileId, mime, at, prefix }
const EDIT_WAIT_MS = 15 * 60 * 1000;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
let editFailStreak = 0;

const QUICK_EDITS = {
  rmbg: "Remove the background and replace it with a plain clean white background",
  bw: "Convert this photo to black and white",
  enh: "Enhance this photo: sharper details, better lighting and colors, natural look",
  cartoon: "Turn this photo into a cartoon illustration with the same composition",
};

async function downloadTelegramFile(ctx, fileId) {
  const file = await ctx.api.getFile(fileId);
  if (!file || !file.file_path) throw new Error("Telegram did not return a file path");
  if (file.file_size && file.file_size > MAX_PHOTO_BYTES) {
    const err = new Error("image too big");
    err.tooBig = true;
    throw err;
  }
  let res;
  try {
    // The bot token is part of this address. Never log it or send it to any other service.
    res = await fetch(`https://api.telegram.org/file/bot${BOT_TOKEN}/${file.file_path}`);
  } catch (e) {
    throw new Error("Could not download the image from Telegram");
  }
  if (!res.ok) throw new Error("Telegram download failed with status " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = String(file.file_path).split(".").pop().toLowerCase();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return { buf, mime };
}

async function runEdit(ctx, userId, job) {
  if (busy.has(userId)) {
    return ctx.reply("Please wait, your last image is still being made.");
  }
  if (!canEdit()) {
    alertAdmin("noedit", "A user tried photo editing, but no editing provider is set. Add GEMINI_API_KEY (or POLLINATIONS_API_KEY).");
    return ctx.reply("Photo editing is not switched on yet. Please try again later.");
  }
  busy.add(userId);

  let waiting = null;
  let user = null;
  let kind = null;
  try {
    user = await db.getUser(userId);
    kind = consume(user);
    if (!kind) {
      await ctx.reply(
        `You have used your ${DAILY_LIMIT} free images today (they reset at midnight UTC).\n\n` +
          "Get more with /buy or /invite, or enter a promo code with /redeem."
      );
      return;
    }
    await db.saveUser(user);

    waiting = await ctx.reply("Editing your photo... this can take up to a minute.");

    const translated = (await translateToEnglish(job.instruction)).replace(/[.\s]+$/, "");
    if (translated !== job.instruction && !checkEditInstruction(translated).ok) {
      refund(user, kind);
      await db.saveUser(user);
      kind = null;
      await ctx.reply("I can't make that edit. Please try a different instruction.");
      return;
    }

    const src = await downloadTelegramFile(ctx, job.fileId);
    const keepRest = STYLE_WORDS.test(translated) || /black and white|grayscale|filter/i.test(translated);
    const full = keepRest
      ? translated
      : `${translated}. Change only what is asked and keep everything else as it is, including faces and composition.`;

    const out = await editImage({ buffer: src.buf, mime: src.mime || job.mime, instruction: full });

    const sent = await ctx.replyWithPhoto(new InputFile(out, "edited.jpg"), {
      caption: job.instruction.slice(0, 200),
      reply_markup: editKeyboard(),
    });
    remember(sent.chat.id, sent.message_id, { type: "edit", prompt: job.instruction, origFileId: job.origFileId || job.fileId });

    editFailStreak = 0;
    user.total++;
    user.lastGen = db.today();
    await db.saveUser(user);
  } catch (err) {
    console.error("Edit failed:", err.message);
    editFailStreak++;
    if (editFailStreak >= 3) {
      alertAdmin("editfail", `Photo editing has failed ${editFailStreak} times in a row. Last error: ${err.message}`);
    }
    if (user && kind) {
      refund(user, kind);
      await db.saveUser(user).catch(() => {});
    }
    const msg = err.tooBig
      ? "That image is too big. Please send one under 10 MB."
      : "The photo editor is busy or could not do that edit. You were not charged. Please try again in a moment.";
    await ctx.reply(msg).catch(() => {});
  } finally {
    busy.delete(userId);
    if (waiting) await ctx.api.deleteMessage(waiting.chat.id, waiting.message_id).catch(() => {});
  }
}

function launchEdit(ctx, userId, job) {
  runEdit(ctx, userId, job).catch((err) => console.error("runEdit crashed:", err.message));
}

async function startEdit(ctx, source, instruction) {
  const text = (instruction || "").trim();
  if (!text) return ctx.reply("Tell me what to change, for example: change the background to a beach.");
  if (text.length > 300) return ctx.reply("That instruction is too long (max 300 characters).");
  if (!checkEditInstruction(text).ok) return ctx.reply("I can't make that edit. Please try a different instruction.");
  launchEdit(ctx, ctx.from.id, { fileId: source.fileId, mime: source.mime, instruction: text, origFileId: source.origFileId });
}

async function onImageReceived(ctx, fileId, mime, caption) {
  const cap = (caption || "").trim();
  if (cap) return startEdit(ctx, { fileId, mime, origFileId: fileId }, cap);
  pendingEdit.set(ctx.from.id, { fileId, mime, at: Date.now(), prefix: "" });
  await ctx.reply(
    "Got your photo! Tell me what to change, for example: change the background to a beach at sunset.\n" +
      "Or tap an option below. Send /cancel to go back to creating images.",
    { reply_markup: quickEditKeyboard() }
  );
}

// ---------- Ban check for every update ----------
bot.use(async (ctx, next) => {
  if (ctx.from && banned.has(ctx.from.id)) return;
  await next();
});

// ---------- User commands ----------
bot.command("start", async (ctx) => {
  const user = await db.getUser(ctx.from.id);
  const payload = (ctx.match || "").trim();

  if (user.isNew && payload.startsWith("ref_")) {
    const inviterId = Number(payload.slice(4));
    if (inviterId && inviterId !== ctx.from.id) {
      const inviter = await db.findUser(inviterId);
      if (inviter) {
        inviter.credits += REFERRAL_BONUS;
        inviter.referrals++;
        await db.saveUser(inviter);
        user.credits += WELCOME_BONUS;
        await db.saveUser(user);
        ctx.api
          .sendMessage(inviterId, `A friend joined with your link. You earned ${REFERRAL_BONUS} extra images!`)
          .catch(() => {});
      }
    }
  }

  if (!(await requireChannel(ctx))) return;

  await ctx.reply(
    "Hi! I create realistic AI photos from your description. You can write in your own language.\n\n" +
      "Just type what you want to see, for example:\n" +
      "a woman drinking coffee at a street cafe in the morning\n\n" +
      "You can also send me a photo and tell me what to change (new background, remove background, and more).\n\n" +
      `You get ${DAILY_LIMIT} free images per day. Try /examples for ideas, or /help for all commands.`
  );
});

bot.command("help", (ctx) =>
  ctx.reply(
    "Type any description to get an image.\n\n" +
      "/image <text> - generate an image\n" +
      "Send a photo with a caption (or send it, then tell me) to edit it\n" +
      "/cancel - stop an edit and go back to creating images\n" +
      "/style - choose a default style (portrait, product, anime, logo...)\n" +
      "/examples - tap an example to try it\n" +
      "/idea - today's idea\n" +
      "/daily on|off - get the idea every day\n" +
      "/limit - see how many images you have left\n" +
      "/improve on|off - prompt improver\n" +
      "/invite - invite friends, earn images\n" +
      "/buy - buy extra images with Telegram Stars\n" +
      "/redeem <code> - use a promo code\n" +
      "/terms and /privacy - our rules\n" +
      "/paysupport - help with payments\n\n" +
      "Tip: be specific. 'A woman in her 30s laughing at a market, afternoon light' works better than 'a happy woman'."
  )
);

bot.command("image", (ctx) => handlePrompt(ctx, ctx.match || ""));

bot.command("limit", async (ctx) => {
  const user = await db.getUser(ctx.from.id);
  if (user.day !== db.today()) {
    user.day = db.today();
    user.used = 0;
    await db.saveUser(user);
  }
  await ctx.reply(
    `Free images left today: ${Math.max(0, DAILY_LIMIT - user.used)} of ${DAILY_LIMIT}\n` +
      `Extra credits: ${user.credits}\n` +
      `Images made so far: ${user.total}`
  );
});

bot.command("improve", async (ctx) => {
  const arg = (ctx.match || "").trim().toLowerCase();
  const user = await db.getUser(ctx.from.id);
  if (arg === "on" || arg === "off") {
    user.improve = arg === "on";
    await db.saveUser(user);
  }
  await ctx.reply(
    `Prompt improver is ${user.improve !== false ? "ON" : "OFF"}.\n` +
      "When on, short descriptions are expanded into detailed photo descriptions for more natural results.\n" +
      "Use /improve on or /improve off to change it."
  );
});

bot.command("style", async (ctx) => {
  const user = await db.getUser(ctx.from.id);
  const current = STYLES[user.style] ? STYLES[user.style].label : "Auto (no preset)";
  await ctx.reply(`Your default style: ${current}\n\nPick a new default:`, {
    reply_markup: styleKeyboard("ds", true),
  });
});

bot.command("examples", (ctx) => {
  const kb = new InlineKeyboard();
  content.EXAMPLES.forEach((e, i) => {
    if (i > 0) kb.row();
    kb.text(e.length > 45 ? e.slice(0, 42) + "..." : e, `ex:${i}`);
  });
  return ctx.reply("Tap an example to try it:", { reply_markup: kb });
});

bot.command("idea", (ctx) =>
  ctx.reply(`Idea of the day:\n\n${content.ideaOfTheDay()}`, {
    reply_markup: new InlineKeyboard().text("Try it", "idea"),
  })
);

bot.command("daily", async (ctx) => {
  const arg = (ctx.match || "").trim().toLowerCase();
  const user = await db.getUser(ctx.from.id);
  if (arg === "on" || arg === "off") {
    user.daily = arg === "on";
    await db.saveUser(user);
  }
  await ctx.reply(
    `Daily idea message is ${user.daily ? "ON" : "OFF"}.\nUse /daily on or /daily off to change it.`
  );
});

bot.command("invite", async (ctx) => {
  const user = await db.getUser(ctx.from.id);
  const link = `https://t.me/${ctx.me.username}?start=ref_${ctx.from.id}`;
  await ctx.reply(
    `Share your link. For every new friend who joins you get ${REFERRAL_BONUS} extra images, ` +
      `and they get ${WELCOME_BONUS}.\n\n${link}\n\nFriends invited so far: ${user.referrals}`
  );
});

bot.command("redeem", async (ctx) => {
  const code = (ctx.match || "").trim();
  if (!code) return ctx.reply("Send your code like this: /redeem YOURCODE");
  const res = await db.redeemPromo(code, ctx.from.id);
  if (!res.ok) {
    const reasons = {
      invalid: "That code is not valid.",
      used: "You have already used this code.",
      exhausted: "This code has reached its limit.",
    };
    return ctx.reply(reasons[res.reason] || "That code could not be used.");
  }
  const user = await db.getUser(ctx.from.id);
  user.credits += res.credits;
  await db.saveUser(user);
  await ctx.reply(`Code accepted! ${res.credits} images added. You now have ${user.credits} extra credits.`);
});

bot.command("terms", (ctx) => ctx.reply(content.termsText(SUPPORT_CONTACT)));
bot.command("privacy", (ctx) => ctx.reply(content.privacyText(SUPPORT_CONTACT)));

// ---------- Payments (Telegram Stars) ----------
bot.command("buy", (ctx) => {
  const kb = new InlineKeyboard();
  PACKS.forEach((p, i) => {
    if (i > 0) kb.row();
    kb.text(`${p.images} images - ${p.stars} ⭐`, `buy:${p.id}`);
  });
  return ctx.reply("Buy extra images. They never expire and are used after your free daily images.", {
    reply_markup: kb,
  });
});

bot.callbackQuery(/^buy:(\w+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const pack = PACKS.find((p) => p.id === ctx.match[1]);
  if (!pack) return;
  await ctx.replyWithInvoice(
    `${pack.images} image credits`,
    `Adds ${pack.images} extra images to your account. Credits never expire.`,
    `credits:${pack.id}`,
    "XTR",
    [{ label: `${pack.images} images`, amount: pack.stars }]
  );
});

bot.on("pre_checkout_query", async (ctx) => {
  const payload = ctx.preCheckoutQuery.invoice_payload;
  const ok = PACKS.some((p) => `credits:${p.id}` === payload);
  await ctx.answerPreCheckoutQuery(ok, ok ? undefined : "This item is no longer available.");
});

bot.on("message:successful_payment", async (ctx) => {
  const pay = ctx.message.successful_payment;
  const pack = PACKS.find((p) => `credits:${p.id}` === pay.invoice_payload);
  if (!pack) {
    console.error("Unknown payment payload:", pay.invoice_payload);
    return;
  }
  const user = await db.getUser(ctx.from.id);
  user.credits += pack.images;
  await db.saveUser(user);
  await db.recordPayment({
    userId: ctx.from.id,
    packId: pack.id,
    stars: pay.total_amount,
    chargeId: pay.telegram_payment_charge_id,
    at: new Date().toISOString(),
  });
  await ctx.reply(`Thank you! ${pack.images} images added. You now have ${user.credits} extra credits.`);
});

bot.command("paysupport", (ctx) =>
  ctx.reply(`For payment problems or refund requests, contact ${SUPPORT_CONTACT} and include your payment details.`)
);

// ---------- Admin commands ----------
function isAdmin(ctx) {
  return ADMIN_ID && ctx.from && ctx.from.id === ADMIN_ID;
}

bot.command("stats", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const s = await db.stats();
  await ctx.reply(
    `Storage: ${s.storage}\n` +
      `Users: ${s.users}\n` +
      `Active today: ${s.activeToday}\n` +
      `Banned: ${s.banned}\n` +
      `Images made: ${s.images}\n` +
      `Reports: ${s.reports}\n` +
      `Payments: ${s.payments} (${s.stars} Stars)`
  );
});

bot.command("ban", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = Number((ctx.match || "").trim());
  if (!id || id === ADMIN_ID) return ctx.reply("Usage: /ban <user id>");
  const user = await db.getUser(id);
  user.banned = true;
  await db.saveUser(user);
  banned.add(id);
  await ctx.reply(`User ${id} is banned.`);
});

bot.command("unban", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = Number((ctx.match || "").trim());
  if (!id) return ctx.reply("Usage: /unban <user id>");
  const user = await db.findUser(id);
  if (user) {
    user.banned = false;
    await db.saveUser(user);
  }
  banned.delete(id);
  await ctx.reply(`User ${id} is unbanned.`);
});

bot.command("forget", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = Number((ctx.match || "").trim());
  if (!id) return ctx.reply("Usage: /forget <user id> (deletes that user's data)");
  const ok = await db.deleteUser(id);
  banned.delete(id);
  await ctx.reply(ok ? `Data for user ${id} deleted.` : "No data found for that user.");
});

bot.command("newcode", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const [code, credits, maxUses] = (ctx.match || "").trim().split(/\s+/);
  const c = Number(credits);
  const m = Number(maxUses);
  if (!code || !c || !m) return ctx.reply("Usage: /newcode CODE CREDITS MAXUSES\nExample: /newcode WELCOME10 10 50");
  const ok = await db.createPromo({ code, credits: c, maxUses: m });
  await ctx.reply(
    ok ? `Code ${code.toUpperCase()} created: ${c} images, up to ${m} users.` : "That code already exists."
  );
});

bot.command("broadcast", async (ctx) => {
  if (!isAdmin(ctx)) return;
  const text = (ctx.match || "").trim();
  if (!text) return ctx.reply("Usage: /broadcast your message");
  const ids = await db.listUserIds();
  pendingBroadcast = { text, at: Date.now() };
  await ctx.reply(
    `Preview:\n\n${text}\n\nThis will be sent to ${ids.length} users. ` +
      "Send /sendbroadcast within 10 minutes to confirm."
  );
});

bot.command("sendbroadcast", async (ctx) => {
  if (!isAdmin(ctx)) return;
  if (!pendingBroadcast || Date.now() - pendingBroadcast.at > 10 * 60 * 1000) {
    pendingBroadcast = null;
    return ctx.reply("Nothing to send. Start with /broadcast your message");
  }
  const { text } = pendingBroadcast;
  pendingBroadcast = null;
  const ids = await db.listUserIds();
  await ctx.reply(`Sending to ${ids.length} users...`);
  let ok = 0;
  let failed = 0;
  for (const id of ids) {
    try {
      await ctx.api.sendMessage(id, text);
      ok++;
    } catch (err) {
      failed++;
    }
    await sleep(60);
  }
  await ctx.reply(`Broadcast finished. Sent: ${ok}. Failed: ${failed} (users who blocked the bot).`);
});

// ---------- Buttons ----------
bot.callbackQuery("joined", async (ctx) => {
  memberCache.delete(ctx.from.id);
  if (await isAllowedByChannel(ctx)) {
    return ctx.answerCallbackQuery({ text: "Thanks! You can use the bot now. Send a description.", show_alert: true });
  }
  return ctx.answerCallbackQuery({ text: "I can't see you in the channel yet. Join it and try again.", show_alert: true });
});

bot.callbackQuery("idea", async (ctx) => {
  await ctx.answerCallbackQuery();
  await handlePrompt(ctx, content.ideaOfTheDay());
});

bot.callbackQuery(/^ex:(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const p = content.EXAMPLES[Number(ctx.match[1])];
  if (p) await handlePrompt(ctx, p);
});

bot.callbackQuery(/^ds:(\w+)$/, async (ctx) => {
  const id = ctx.match[1];
  const user = await db.getUser(ctx.from.id);
  if (id === "auto") user.style = null;
  else if (STYLES[id]) user.style = id;
  else return ctx.answerCallbackQuery();
  await db.saveUser(user);
  await ctx.answerCallbackQuery({
    text: user.style ? `Default style: ${STYLES[user.style].label}` : "Default style: Auto",
  });
});

function sessionFor(ctx) {
  const msg = ctx.callbackQuery.message;
  return msg ? sessions.get(`${msg.chat.id}:${msg.message_id}`) : null;
}

const EXPIRED = {
  text: "This button has expired. Please send your description again.",
  show_alert: true,
};

bot.callbackQuery("styles", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup({ reply_markup: styleKeyboard("rs", false) }).catch(() => {});
});

bot.callbackQuery("back", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup({ reply_markup: resultKeyboard() }).catch(() => {});
});

bot.callbackQuery(/^rs:(\w+)$/, async (ctx) => {
  const job = sessionFor(ctx);
  if (!job) return ctx.answerCallbackQuery(EXPIRED);
  const id = ctx.match[1];
  if (!STYLES[id]) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery();
  await ctx.editMessageReplyMarkup({ reply_markup: resultKeyboard() }).catch(() => {});
  launch(ctx, ctx.from.id, { ...job, style: id, hd: false, level: 1 });
});

bot.callbackQuery(/^(regen|real|hd|ar:(portrait|square|wide))$/, async (ctx) => {
  const job = sessionFor(ctx);
  if (!job) return ctx.answerCallbackQuery(EXPIRED);
  await ctx.answerCallbackQuery();
  const data = ctx.callbackQuery.data;
  const next = { ...job, hd: false };
  if (data === "real") next.level = 2;
  if (data === "hd") next.hd = true;
  if (data.startsWith("ar:")) next.ratio = data.slice(3);
  launch(ctx, ctx.from.id, next);
});

bot.callbackQuery("report", async (ctx) => {
  const msg = ctx.callbackQuery.message;
  if (!msg) return ctx.answerCallbackQuery();
  const key = `${msg.chat.id}:${msg.message_id}`;
  if (reported.has(key)) return ctx.answerCallbackQuery({ text: "Already reported. Thank you." });
  reported.add(key);
  if (reported.size > 5000) reported.clear();

  const job = sessions.get(key);
  const prompt = job ? job.prompt : "(unknown)";
  await db.recordReport({ userId: ctx.from.id, prompt, at: new Date().toISOString() });
  await ctx.answerCallbackQuery({ text: "Thanks, we will review this image." });

  if (ADMIN_ID) {
    await ctx.api.forwardMessage(ADMIN_ID, msg.chat.id, msg.message_id).catch(() => {});
    await ctx.api
      .sendMessage(ADMIN_ID, `Report from user ${ctx.from.id}\nPrompt: ${prompt}\nTo block this user: /ban ${ctx.from.id}`)
      .catch(() => {});
  }
});

// ---------- Photo editing handlers ----------
bot.command("cancel", async (ctx) => {
  const had = pendingEdit.delete(ctx.from.id);
  await ctx.reply(had ? "Cancelled. Send a description to create an image." : "Nothing to cancel.");
});

bot.on("message:photo", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  if (!(await requireChannel(ctx))) return;
  const photos = ctx.message.photo;
  await onImageReceived(ctx, photos[photos.length - 1].file_id, "image/jpeg", ctx.message.caption);
});

bot.on("message:document", async (ctx) => {
  if (ctx.chat.type !== "private") return;
  const d = ctx.message.document;
  if (!d.mime_type || !d.mime_type.startsWith("image/")) {
    return ctx.reply("Please send an image (JPG or PNG) if you want to edit it.");
  }
  if (d.file_size && d.file_size > MAX_PHOTO_BYTES) {
    return ctx.reply("That image is too big. Please send one under 10 MB.");
  }
  if (!(await requireChannel(ctx))) return;
  await onImageReceived(ctx, d.file_id, d.mime_type, ctx.message.caption);
});

bot.callbackQuery("edit", async (ctx) => {
  const msg = ctx.callbackQuery.message;
  const photos = msg && msg.photo;
  if (!photos || !photos.length) {
    return ctx.answerCallbackQuery({ text: "I can't find the image. Please send it again.", show_alert: true });
  }
  await ctx.answerCallbackQuery();
  const fileId = photos[photos.length - 1].file_id;
  const job = sessionFor(ctx);
  pendingEdit.set(ctx.from.id, {
    fileId,
    mime: "image/jpeg",
    at: Date.now(),
    prefix: "",
    origFileId: job && job.origFileId ? job.origFileId : fileId,
  });
  await ctx.reply("What should I change? Describe it, or tap an option. Send /cancel to stop.", {
    reply_markup: quickEditKeyboard(),
  });
});

bot.callbackQuery("eo", async (ctx) => {
  const job = sessionFor(ctx);
  if (!job || !job.origFileId) return ctx.answerCallbackQuery(EXPIRED);
  await ctx.answerCallbackQuery();
  pendingEdit.set(ctx.from.id, { fileId: job.origFileId, mime: "image/jpeg", at: Date.now(), prefix: "", origFileId: job.origFileId });
  await ctx.reply("OK, I'll work from your original photo. What should I change?", {
    reply_markup: quickEditKeyboard(),
  });
});

bot.callbackQuery(/^qe:(\w+)$/, async (ctx) => {
  const choice = ctx.match[1];
  if (choice === "cancel") {
    pendingEdit.delete(ctx.from.id);
    return ctx.answerCallbackQuery({ text: "Cancelled." });
  }
  const pending = pendingEdit.get(ctx.from.id);
  if (!pending || Date.now() - pending.at > EDIT_WAIT_MS) {
    return ctx.answerCallbackQuery({ text: "Please send the photo again.", show_alert: true });
  }
  await ctx.answerCallbackQuery();
  if (choice === "bg") {
    pending.prefix = "Change the background to: ";
    pending.at = Date.now();
    return ctx.reply("Describe the new background, for example: a beach at sunset.");
  }
  const instruction = QUICK_EDITS[choice];
  if (!instruction) return;
  pendingEdit.delete(ctx.from.id);
  launchEdit(ctx, ctx.from.id, { fileId: pending.fileId, mime: pending.mime, instruction, origFileId: pending.origFileId || pending.fileId });
});

// ---------- Plain text prompts (private chats only) ----------
bot.on("message:text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return;
  if (ctx.chat.type !== "private") return;
  const pending = pendingEdit.get(ctx.from.id);
  if (pending && Date.now() - pending.at < EDIT_WAIT_MS) {
    pendingEdit.delete(ctx.from.id);
    return startEdit(ctx, pending, (pending.prefix || "") + ctx.message.text);
  }
  await handlePrompt(ctx, ctx.message.text);
});

bot.catch((err) => {
  console.error("Bot error:", err.error || err);
  alertAdmin("botcatch", "Bot error: " + String((err.error && err.error.message) || err.message || err).slice(0, 300));
});

// ---------- Daily idea message ----------
async function dailyTick() {
  if (new Date().getUTCHours() !== DAILY_HOUR) return;
  const day = db.today();
  if ((await db.getMeta("lastDaily")) === day) return;
  await db.setMeta("lastDaily", day);
  const ids = await db.listUserIds({ dailyOnly: true });
  const kb = new InlineKeyboard().text("Try it", "idea");
  const idea = content.ideaOfTheDay();
  for (const id of ids) {
    await bot.api.sendMessage(id, `Idea of the day:\n\n${idea}`, { reply_markup: kb }).catch(() => {});
    await sleep(60);
  }
}

// ---------- Web server and start ----------
const PORT = process.env.PORT || 3000;
let handleUpdate = null;

http
  .createServer((req, res) => {
    if (handleUpdate && req.method === "POST" && req.url === "/webhook") {
      return handleUpdate(req, res);
    }
    const tmp = req.method === "GET" && /^\/tmp\/([a-f0-9]{32})$/.exec(req.url || "");
    if (tmp) {
      const item = getTemp(tmp[1]);
      if (!item) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { "Content-Type": item.mime || "image/jpeg", "Cache-Control": "no-store" });
      return res.end(item.buffer);
    }
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running");
  })
  .listen(PORT, () => console.log("Web server on port " + PORT));

(async () => {
  await db.init();
  for (const id of await db.listBanned()) banned.add(id);

  await bot.api.setMyCommands([
    { command: "image", description: "Generate an image" },
    { command: "style", description: "Choose a default style" },
    { command: "cancel", description: "Stop a photo edit" },
    { command: "examples", description: "Tap an example to try" },
    { command: "idea", description: "Idea of the day" },
    { command: "limit", description: "See your remaining images" },
    { command: "invite", description: "Invite friends, earn images" },
    { command: "buy", description: "Buy extra images" },
    { command: "redeem", description: "Use a promo code" },
    { command: "daily", description: "Daily idea on/off" },
    { command: "improve", description: "Prompt improver on/off" },
    { command: "help", description: "Help" },
    { command: "terms", description: "Terms of use" },
    { command: "privacy", description: "Privacy" },
  ]);

  if (USE_WEBHOOK) {
    await bot.init();
    handleUpdate = webhookCallback(bot, "http", { secretToken: WEBHOOK_SECRET });
    await bot.api.setWebhook(`${WEBHOOK_BASE}/webhook`, {
      secret_token: WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query", "pre_checkout_query"],
    });
    console.log(`Webhook mode: ${WEBHOOK_BASE}/webhook (bot @${bot.botInfo.username})`);
  } else {
    await bot.api.deleteWebhook().catch(() => {});
    bot.start({ onStart: (me) => console.log(`Polling mode: bot @${me.username} is running`) });
  }

  setInterval(() => dailyTick().catch((e) => console.error("dailyTick failed:", e)), 10 * 60 * 1000);
})().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});

};

__load("./bot");
