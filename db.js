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
