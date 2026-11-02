# Image Bot

Telegram bot that makes realistic AI images from text.

## Environment variables

| Name | Required | What it is |
|------|----------|------------|
| BOT_TOKEN | Yes | Token from @BotFather |
| MONGODB_URI | Strongly recommended | MongoDB Atlas free connection string. Without it, limits and credits reset on every restart |
| ADMIN_ID | Optional | Your Telegram user ID (get it from @userinfobot). Enables /stats |
| HF_TOKEN | Optional | Free Hugging Face token, used as the backup image provider |
| DAILY_LIMIT | Optional | Free images per user per day (default 5) |
| SUPPORT_CONTACT | Optional | Your @username, shown by /paysupport |

Never put these values in your code or in GitHub. Add them in Render under Environment.

## Run locally

    npm install
    BOT_TOKEN=your_token node bot.js

## Deploy on Render

1. Push these files to GitHub (not node_modules).
2. Create a Web Service from the repo.
3. Build command: `npm install`  Start command: `npm start`
4. Add the environment variables above.
5. Free web services can sleep when idle. Ping the service URL every 5 minutes with a free monitor (for example UptimeRobot) to keep the bot awake.

## MongoDB Atlas (free)

1. Create a free account and a free M0 cluster.
2. Create a database user and allow network access from anywhere (0.0.0.0/0).
3. Copy the connection string, put your password in it, and set it as MONGODB_URI.
