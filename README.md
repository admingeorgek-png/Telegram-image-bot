# Image Bot

Telegram bot that makes realistic AI images from text.

## Environment variables

| Name | Required | What it is |
|------|----------|------------|
| BOT_TOKEN | Yes | Token from @BotFather |
| MONGODB_URI | Strongly recommended | MongoDB Atlas free connection string. Without it, limits, credits and codes reset on every restart |
| ADMIN_ID | Recommended | Your Telegram user ID (from @userinfobot). Enables admin commands and alerts |
| POLLINATIONS_API_KEY | Recommended | Free key from auth.pollinations.ai. Removes the watermark and the one-image-per-15-seconds limit |
| HF_TOKEN | Optional | Free Hugging Face token, backup image provider |
| GEMINI_API_KEY | Optional | Google AI Studio key, extra image provider |
| GEMINI_IMAGE_MODEL | Optional | Gemini image model name (default gemini-2.5-flash-image). Change it if Google renames the model |
| GEMINI_EDIT_MODEL | Optional | Model used for photo editing (defaults to GEMINI_IMAGE_MODEL) |
| HF_EDIT_MODEL | Optional | Hugging Face model for photo editing (default black-forest-labs/FLUX.1-Kontext-dev) |
| PROVIDER_ORDER | Optional | For example `gemini,pollinations,huggingface`. Used for both creating and editing |
| REQUIRED_CHANNEL | Optional | Channel users must join, like `@mychannel`. Add the bot as an admin of that channel |
| DAILY_LIMIT | Optional | Free images per user per day (default 5) |
| DAILY_HOUR | Optional | UTC hour for the daily idea message (default 9) |
| SUPPORT_CONTACT | Optional | Your @username, shown in /paysupport, /terms and /privacy |
| USE_WEBHOOK | Optional | Set to `false` to use polling instead of a webhook |

Never put these values in your code or in GitHub. Add them in Render under Environment.

## Photo editing

Users send a photo (with a caption, or send it and then describe the change). Quick buttons offer change background, remove background, black and white, enhance quality and cartoon style. Every image the bot makes also has an Edit button.

Editing needs at least one of these:

- GEMINI_API_KEY (the photo is sent directly to Google)
- POLLINATIONS_API_KEY (the bot hosts the photo on a private random link for a few minutes; this needs the Render public address, which Render provides automatically)
- HF_TOKEN (Hugging Face, depends on their free credits)

Without any of them, the bot says photo editing is not switched on.

## User commands

/image, /cancel, /style, /examples, /idea, /daily, /limit, /improve, /invite, /buy, /redeem, /terms, /privacy, /paysupport, /help

## Admin commands (only for ADMIN_ID)

- `/stats` shows users, images, payments and reports
- `/ban <id>` and `/unban <id>` block or unblock a user
- `/forget <id>` deletes a user's stored data
- `/newcode CODE CREDITS MAXUSES` creates a promo code, for example `/newcode WELCOME10 10 50`
- `/broadcast text` shows a preview, then `/sendbroadcast` sends it to all users

## Run locally

    npm install
    BOT_TOKEN=your_token node bot.js

## Deploy on Render

1. Push these files to GitHub (not node_modules).
2. Create a Web Service from the repo.
3. Build command: `npm install`  Start command: `npm start`
4. Add the environment variables above.
5. On Render the bot uses a webhook automatically. After you change code on GitHub, open the service and tap Manual Deploy.
6. Free web services sleep when idle. A free monitor (for example UptimeRobot) pinging the service URL every 5 minutes keeps it awake.
