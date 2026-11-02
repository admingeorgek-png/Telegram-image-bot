// Storage layer. Uses MongoDB if MONGODB_URI is set, otherwise memory only.
// Memory-only data is lost on every restart, so set up MongoDB before sharing the bot.

let users = null;
let payments = null;
const memUsers = new Map();
const memPayments = [];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function newUser(id) {
  return {
    _id: id,
    day: today(),
    used: 0, // free images used today
    credits: 0, // extra images (bought or earned)
    total: 0, // all-time images
    referrals: 0,
    improve: true, // prompt improver on by default
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
  console.log("Connected to MongoDB.");
}

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

async function recordPayment(p) {
  if (payments) await payments.insertOne(p);
  else memPayments.push(p);
}

async function stats() {
  const t = today();
  if (users) {
    const total = await users.countDocuments();
    const activeToday = await users.countDocuments({ lastGen: t });
    const img = await users.aggregate([{ $group: { _id: null, n: { $sum: "$total" } } }]).toArray();
    const pay = await payments
      .aggregate([{ $group: { _id: null, stars: { $sum: "$stars" }, n: { $sum: 1 } } }])
      .toArray();
    return {
      storage: "MongoDB",
      users: total,
      activeToday,
      images: img[0] ? img[0].n : 0,
      stars: pay[0] ? pay[0].stars : 0,
      payments: pay[0] ? pay[0].n : 0,
    };
  }
  let images = 0;
  let activeToday = 0;
  for (const u of memUsers.values()) {
    images += u.total || 0;
    if (u.lastGen === t) activeToday++;
  }
  return {
    storage: "memory (not saved)",
    users: memUsers.size,
    activeToday,
    images,
    stars: memPayments.reduce((s, p) => s + p.stars, 0),
    payments: memPayments.length,
  };
}

module.exports = { init, findUser, getUser, saveUser, recordPayment, stats, today };
