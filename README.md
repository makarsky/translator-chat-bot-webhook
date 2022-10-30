# Translator Chat Bot for Telegram 

[How to use / features](https://translator-chat-bot-webhook.herokuapp.com/?start=github)

[Try it yourself](https://t.me/ProTranslatorBot?start=github)

<img src="https://dl.dropboxusercontent.com/s/w678m7husoevwt8/1.png">

Tech stack:
- node.js
- Express
- JavaScript
- Telegram API
- Unofficial Google Translate API
- Unofficial Google Text-To-Speech API

## Setup

### Prerequisites
- node.js >= 14
- Create a Telegram bot using @BotFather and copy its token.
- ngrok
- a redislabs database with a redisJSON module

### Installation
1. clone the project
1. npm i
1. ngrok http http://127.0.0.1:3000 --authtoken=<your_token>
1. create a copy of `.env.example` file, name it `.env` and set actual values (token, ngrok secure url, redis, etc)
1. npm run dev

## Run in Docker
1. docker build -t user/translator-chat-bot-webhook:v1.0.0 .
1. docker run -d -p 3000:3000 user/translator-chat-bot-webhook:v1.0.0
1. docker push user/translator-chat-bot-webhook:v1.0.0

## Hosting options
1. koyeb.com
1. ~~heroku.com~~ - no longer free
1. redislabs.com for redis

To retrive release version from heroku, run this and trigger a deploy:  
```heroku labs:enable runtime-dyno-metadata -a translator-chat-bot-webhook```

~~cron-job.org~~ - no longer needed

To update packages:  
npx npm-check -u

## Become a contributor by adding a new interface language
Edit this [localization file](https://github.com/makarsky/translator-chat-bot-webhook/blob/master/src/localization/i18n.js) and submit a pull request to add a new interface language.

## Useful links

[Free 50MB Redis storage](https://app.redislabs.com)

[Host and Use Redis for Free](https://dev.to/ramko9999/host-and-use-redis-for-free-51if)

[Redis node.js usage](https://www.youtube.com/watch?v=DOIWQddRD5M)

[Serverless Data for Redis](https://upstash.com/#section-pricing)

[Telegram bot analytics setup example](https://habr.com/ru/post/442610/)  
[How to add new Google Analytics project](https://support.google.com/analytics/answer/6132368)  
[Univarsal analytics setup](https://support.google.com/analytics/answer/10269537?hl=en)  
[Possible alternative 1?](https://getanalytics.io/)  
[Possible alternative 2?](https://cloud.google.com/appengine/docs/flexible/nodejs/integrating-with-analytics)

Dialogflow links:  
https://dialogflow.cloud.google.com/#/getStarted  
https://cloud.google.com/dialogflow/es/docs/fulfillment-webhook#webhook_response  
Dialogflow webhook service requirements:  
https://cloud.google.com/dialogflow/docs/fulfillment-webhook

[109 languages in google](https://cloud.google.com/translate/docs/languages)

[Telegram package examples](https://github.com/yagop/node-telegram-bot-api/blob/master/doc/tutorials.md)

[Another library (not maintained?)](https://github.com/arcturial/telegrambot)






[How To Build a Node.js Application with Docker](https://www.digitalocean.com/community/tutorials/how-to-build-a-node-js-application-with-docker-quickstart)

[Express.js + docker](https://nodejs.org/de/docs/guides/nodejs-docker-webapp/)

[Hide API Keys with a Node.js API Proxy + Caching, Rate Limiting and Slow Downs](https://www.youtube.com/watch?v=nCWE6eonL7k)

https://levelup.gitconnected.com/six-easy-steps-to-create-a-telegram-bot-from-a-google-spreadsheet-b62008d2b81f

Proxy app example:
https://github.com/CodingGarden/mars-weather-api/blob/master/src/api/mars-weather.js



Translation package alternatives:  
https://www.npmjs.com/package/google-translate-open-api  
https://github.com/wilsonwu/translation-google

Build a Chatbot from Scratch - Dialogflow on Node.js  
https://www.youtube.com/watch?v=0NXqwT3Y09E

Redis resources:  
https://developer.redis.com/develop/node/gettingstarted/

Redislabs alternative:  
https://scalingo.com
