const http = require("http");
const { Bot, InputFile, InlineKeyboard } = require("grammy");
const db = require("./db");
const { checkPrompt } = require("./safety");
const { generate, improvePrompt } = require("./providers");

// ---------- Settings ----------
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN environment variable.");
  process.exit(1);
}
const ADMIN_ID = Number(process.env.ADMIN_ID || 0);
const DAILY_LIMIT = Number(process.env.DAILY_LIMIT || 5);
const SUPPORT_CONTACT = process.env.SUPPORT_CONTACT || "the bot owner";

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

const REALISM =
  "ultra realistic photograph, shot on 35mm lens DSLR, natural lighting, " +
  "realistic skin texture, true to life colors, sharp focus, candid, high detail";
const REALISM_PLUS =
  "raw unedited photo, shot on iPhone, natural available light, visible skin pores, " +
  "slight film grain, natural imperfections, no retouching, no filters, true to life, candid";
const NEGATIVE =
  "cartoon, illustration, painting, 3d render, cgi, plastic skin, airbrushed, " +
  "oversaturated, deformed hands, extra fingers, distorted face, watermark, text";
const STYLE_WORDS = /cartoon|anime|illustration|painting|drawing|sketch|3d|pixel|watercolor|comic/i;
// -------------------------------

const bot = new Bot(BOT_TOKEN);
const busy = new Set(); // users with a generation in progress
const sessions = new Map(); // "chatId:messageId" -> job (for the buttons)

function remember(chatId, messageId, job) {
  sessions.set(`${chatId}:${messageId}`, job);
  if (sessions.size > 1000) sessions.delete(sessions.keys().next().value);
}

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

function resultKeyboard() {
  return new InlineKeyboard()
    .text("🔄 Regenerate", "regen")
    .text("📷 More realistic", "real")
    .row()
    .text("Portrait", "ar:portrait")
    .text("Square", "ar:square")
    .text("Wide", "ar:wide");
}

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
          "Get more with /buy or invite friends with /invite."
      );
      return;
    }
    await db.saveUser(user);

    waiting = await ctx.reply("Generating... this can take up to a minute.");

    const styled = STYLE_WORDS.test(job.prompt);
    let base = job.prompt;
    if (!styled && user.improve !== false) {
      const improved = await improvePrompt(job.prompt);
      if (checkPrompt(improved).ok) base = improved;
    }
    const finalPrompt = styled ? base : `${base}, ${job.level >= 2 ? REALISM_PLUS : REALISM}`;
    const size = SIZES[job.ratio] || SIZES.square;

    const buffer = await generate({
      prompt: finalPrompt,
      negative: NEGATIVE,
      width: size.width,
      height: size.height,
    });

    const sent = await ctx.replyWithPhoto(new InputFile(buffer, "image.jpg"), {
      caption: job.prompt.slice(0, 200),
      reply_markup: resultKeyboard(),
    });
    remember(sent.chat.id, sent.message_id, job);

    user.total++;
    user.lastGen = db.today();
    await db.saveUser(user);
  } catch (err) {
    console.error("Generation failed:", err);
    if (user && kind) {
      refund(user, kind);
      await db.saveUser(user).catch(() => {});
    }
    await ctx.reply("Sorry, generation failed. You were not charged. Please try again.").catch(() => {});
  } finally {
    busy.delete(userId);
    if (waiting) await ctx.api.deleteMessage(waiting.chat.id, waiting.message_id).catch(() => {});
  }
}

async function handlePrompt(ctx, text) {
  const prompt = text.trim();
  if (!prompt) {
    return ctx.reply("Add a description, e.g. an old man fishing at sunrise");
  }
  if (prompt.length > 500) return ctx.reply("Description too long (max 500 characters).");
  if (!checkPrompt(prompt).ok) {
    return ctx.reply("I can't create that. Please try a different description.");
  }
  await runGeneration(ctx, ctx.from.id, { prompt, ratio: "square", level: 1 });
}

// ---------- Commands ----------
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

  await ctx.reply(
    "Hi! I create realistic AI photos from your description.\n\n" +
      "Just type what you want to see, for example:\n" +
      "a woman drinking coffee at a street cafe in the morning\n\n" +
      `You get ${DAILY_LIMIT} free images per day. Send /help to see all commands.`
  );
});

bot.command("help", (ctx) =>
  ctx.reply(
    "Type any description to get an image.\n\n" +
      "/image <text> - generate an image\n" +
      "/limit - see how many images you have left\n" +
      "/improve on|off - turn the prompt improver on or off\n" +
      "/invite - get your invite link (earn extra images)\n" +
      "/buy - buy extra images with Telegram Stars\n" +
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

bot.command("invite", async (ctx) => {
  const user = await db.getUser(ctx.from.id);
  const link = `https://t.me/${ctx.me.username}?start=ref_${ctx.from.id}`;
  await ctx.reply(
    `Share your link. For every new friend who joins you get ${REFERRAL_BONUS} extra images, ` +
      `and they get ${WELCOME_BONUS}.\n\n${link}\n\nFriends invited so far: ${user.referrals}`
  );
});

// ---------- Payments (Telegram Stars) ----------
bot.command("buy", (ctx) => {
  const kb = new InlineKeyboard();
  for (const p of PACKS) kb.text(`${p.images} images - ${p.stars} ⭐`, `buy:${p.id}`).row();
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

// ---------- Admin ----------
bot.command("stats", async (ctx) => {
  if (!ADMIN_ID || ctx.from.id !== ADMIN_ID) return;
  const s = await db.stats();
  await ctx.reply(
    `Storage: ${s.storage}\n` +
      `Users: ${s.users}\n` +
      `Active today: ${s.activeToday}\n` +
      `Images made: ${s.images}\n` +
      `Payments: ${s.payments} (${s.stars} Stars)`
  );
});

// ---------- Buttons under images ----------
bot.callbackQuery(/^(regen|real|ar:(portrait|square|wide))$/, async (ctx) => {
  const msg = ctx.callbackQuery.message;
  const job = msg && sessions.get(`${msg.chat.id}:${msg.message_id}`);
  if (!job) {
    return ctx.answerCallbackQuery({
      text: "This button has expired. Please send your description again.",
      show_alert: true,
    });
  }
  await ctx.answerCallbackQuery();
  const data = ctx.callbackQuery.data;
  const next = { ...job };
  if (data === "real") next.level = 2;
  if (data.startsWith("ar:")) next.ratio = data.slice(3);
  await runGeneration(ctx, ctx.from.id, next);
});

// ---------- Plain text prompts (private chats only) ----------
bot.on("message:text", async (ctx) => {
  if (ctx.message.text.startsWith("/")) return;
  if (ctx.chat.type !== "private") return;
  await handlePrompt(ctx, ctx.message.text);
});

bot.catch((err) => console.error("Bot error:", err.error || err));

// ---------- Start ----------
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running");
  })
  .listen(PORT, () => console.log("Web server on port " + PORT));

(async () => {
  await db.init();
  await bot.api.setMyCommands([
    { command: "image", description: "Generate an image" },
    { command: "limit", description: "See your remaining images" },
    { command: "improve", description: "Prompt improver on/off" },
    { command: "invite", description: "Invite friends, earn images" },
    { command: "buy", description: "Buy extra images" },
    { command: "help", description: "Help" },
  ]);
  bot.start({ onStart: (me) => console.log(`Bot @${me.username} is running`) });
})();
