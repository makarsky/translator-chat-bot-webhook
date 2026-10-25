# Translator Chat Bot for Telegram

<img src="https://dl.dropboxusercontent.com/s/w678m7husoevwt8/1.png">

Tech stack:

- node.js
- Express
- Turso (libSQL)
- TypeScript (server)
- JavaScript (frontend)
- Telegram API
- Unofficial Google Translate API
- Unofficial Google Text-To-Speech API

## Setup

### Prerequisites

- Node.js 24.21.0 (use `.nvmrc`)
- Create a Telegram bot using @BotFather and copy its token.
- A Turso database and database auth token.
- ngrok only if you want to test Telegram webhooks locally.

### Installation

1. clone the project
1. `npm ci`
1. Copy `.env.example` to `.env` and set the Telegram bot token, Turso URL/auth token, webhook secret, and webhook URL.
1. Run `npm run migrate:turso` to apply pending database migrations.
1. To undo the last migration, run `npm run migrate:turso -- down`. The initial migration's `down` drops `chat_settings` and deletes its data; use it only when that is intentional. Inspect status with `npm run migrate:turso -- pending` or `npm run migrate:turso -- executed`.
1. Run `npm run build` to compile the server and build the frontend, then `npm start` to serve them locally. Use `npm run dev` to run the TypeScript server directly during development.
1. To test the Vite frontend dev server, run `npm run dev:frontend` in another terminal while the Express server is running.

### Test Telegram webhooks locally

1. Create a dedicated test bot with @BotFather and set its token as `TELEGRAM_BOT_TOKEN` in `.env`. Do not use the production bot token; webhook setup changes that bot's registered webhook.
1. Set `NGROK_AUTH_TOKEN` and `NGROK_DOMAIN` in `.env` using the token and the domain from your ngrok dashboard.
1. Run `npm run dev:telegram`. This starts the Express watcher and an HTTPS ngrok tunnel to the configured `PORT` (default `3000`); copy the printed URL.
1. Set `WEBAPP_URL` in `.env` to the printed URL followed by `/api/v1/webhook`, then run `npm run setup:telegram` to register it explicitly with the test bot.
1. Send a message to the test bot and confirm it reaches the local app.

While the tunnel is active, the local app's other routes are publicly reachable too; the Telegram webhook secret does not make those routes private. `npm run dev:telegram` never registers a webhook.

## Deploy to Vercel

Connect the repository to Vercel and configure the required environment variables. Vercel serves the frontend from `public/` and runs the Express API from the TypeScript server entry point.

## Useful links

[Telegram bot analytics setup example](https://habr.com/ru/post/442610/)  
[How to add new Google Analytics project](https://support.google.com/analytics/answer/6132368)  
[GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

To enable bot event collection, create a GA4 web data stream and Measurement Protocol API secret, then set `GA4_ENABLED=true`, `GA4_MEASUREMENT_ID`, and `GA4_API_SECRET` in `.env` and the deployment environment. Collection is disabled by default and requires both credentials.

Dialogflow links:  
https://dialogflow.cloud.google.com/#/getStarted  
https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook#webhook_response  
Dialogflow webhook service requirements:  
https://cloud.google.com/dialogflow/docs/fulfillment-webhook

[109 languages in google](https://cloud.google.com/translate/docs/languages)

[grammY documentation](https://grammy.dev/)

[Another library (not maintained?)](https://github.com/arcturial/telegrambot)

[Hide API Keys with a Node.js API Proxy + Caching, Rate Limiting and Slow Downs](https://www.youtube.com/watch?v=nCWE6eonL7k)

https://levelup.gitconnected.com/six-easy-steps-to-create-a-telegram-bot-from-a-google-spreadsheet-b62008d2b81f

Proxy app example:
https://github.com/CodingGarden/mars-weather-api/blob/master/src/api/mars-weather.js

Translation package alternatives:  
https://www.npmjs.com/package/google-translate-open-api  
https://github.com/wilsonwu/translation-google

Build a Chatbot from Scratch - Dialogflow on Node.js  
https://www.youtube.com/watch?v=0NXqwT3Y09E
