const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const translate = require('@vitalets/google-translate-api');
const ISO6391 = require('iso-639-1');
const fetch = require('node-fetch');
const redis = require('redis');

const router = express.Router();

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

const filterDuplicatesCallback = (v, i, a) => v && i === a.indexOf(v);

const languagesWithCodes = [
	{ code: 'be', name: 'Беларуская мова' },
	{ code: 'en', name: 'English' },
	{ code: 'ru', name: 'Русский' },
];

const buildLanguageCodeReplyOptions = (excludedLanguageCode) => {
	return {
		reply_markup: {
			inline_keyboard: [
				languagesWithCodes
					.filter((l) => l.code !== excludedLanguageCode)
					.map((l) => ({
						text: l.name,
						callback_data: JSON.stringify({ targetLanguageCode: l.code }),
					})),
			],
		},
	};
};

const redisClient = redis.createClient({
	url: process.env.REDIS_URL,
	password: process.env.REDIS_PASSWORD,
});
redisClient.on('error', (err) => console.log('Redis redisClient Error', err));
redisClient.connect();

router.get('/test-redis', async (req, res) => {
	await redisClient.set('key2', 'value2');
	const value = await redisClient.get('key2');
	console.log(value);

	res.json({
		"fulfillmentMessages": [
			{
				"text": {
					"text": [
						// value
					]
				}
			}
		],
	});
});

router.get('/test', async (req, res) => {
	let codes = ISO6391.getAllCodes();
	let langs = ISO6391.getLanguages(codes);
	let mapped = [];
	for (let lang of [langs[0], langs[1], langs[2], langs[3]]) {
		let translations = [];
		for (let code of codes) {

			try {
				translations.push(
					(await translate(
						lang.name,
						{ to: lang.code }
					)).text
				);
			} catch (error) {
				// if lang.code is not supported
				continue;
			}

			try {
				translations.push(
					(await translate(
						lang.name,
						{ to: code }
					)).text
				);
			} catch (error) {

			}
		}
		mapped.push([
			lang.code,
			lang.name,
			lang.nativeName,
			...translations
		]);
	}
	console.log(mapped);

	res.json(mapped);
});

router.post('/', async (req, res) => {
	bot.processUpdate(req.body);
	res.sendStatus(200);
});

router.get('/setWebhook', async (req, res) => {
	const url = 'https://api.telegram.org/bot' + process.env.TOKEN + '/setWebhook?url=' + process.env.WEBAPP_URL;
	const response = await fetch(url);

	res.json(response);
});

router.get('/setMyCommands', async (req, res) => {
	const url = 'https://api.telegram.org/bot' + process.env.TOKEN + '/setMyCommands?commands=' + JSON.stringify([{
		'command': 'set_language', 'description': 'Set target language',
	}]);
	const response = await fetch(url);
	console.log(response);

	res.json(response);
});

bot.onText(/\/set_language/, (message, match) => {
	bot.sendMessage(message.chat.id, 'Choose target language:', buildLanguageCodeReplyOptions());
});

bot.on('callback_query', async (callback) => {
	if (!callback.data || !callback.message) {
		return;
	}

	const data = JSON.parse(callback.data);

	// Target language selected callback
	if (data.targetLanguageCode) {
		const chatSettings = await redisClient.hGetAll(`${callback.message.chat.id}`);
		let lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');
		lastUsedLanguageCodes.unshift(data.targetLanguageCode);
		lastUsedLanguageCodes = lastUsedLanguageCodes.filter(filterDuplicatesCallback);

		await redisClient.hSet(`${callback.message.chat.id}`, 'lastUsedLanguageCodes', JSON.stringify(lastUsedLanguageCodes));

		return bot.editMessageText(
			`Target language: ${data.targetLanguageCode}. Send a text to translate it to ${data.targetLanguageCode}.`,
			{
				chat_id: callback.message.chat.id,
				message_id: callback.message.message_id,
			}
		);
	}

	// TODO: more translations selected callback
});

bot.onText(/\/set_language (.+)/, (message, match) => {
	console.log('\/set_language smth');
	console.log(match);

	const chatId = message.chat.id;
	const targetLanguage = match[1];

	// await redisClient.set(`${chatId}`, targetLanguage);
	// await redisClient.hSet(`${chatId}`, 'field', Buffer.from('value'));

	bot.sendMessage(chatId, targetLanguage);
});

bot.on('message', async (message) => {
	if (message.text.match(/\/set_language/)) {
		return;
	}
	// redisClient.flushAll();
	// let langTo = ISO6391.getAllCodes().includes(req.body.queryResult.parameters.language)
	// 	? req.body.queryResult.parameters.language : null;

	const requestTargetLanguage = (text, excludedLanguageCode) => {

		bot.sendMessage(message.chat.id, text, buildLanguageCodeReplyOptions(excludedLanguageCode));
	};

	const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
	let lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');

	if (lastUsedLanguageCodes.length === 0) {
		requestTargetLanguage('Choose the target language:');
		return;
	}

	try {
		let targetLanguage = lastUsedLanguageCodes[0];
		let result = await translate(
			message.text,
			{ to: targetLanguage },
		);
		// TODO: use alternative translations

		if (result.from.language.iso === lastUsedLanguageCodes[0]) {
			if (lastUsedLanguageCodes.length === 1) {
				// TODO: exclude the source text language.
				requestTargetLanguage(
					'Your text is in the same language as the target language. Choose another target language:',
					result.from.language.iso,
				);
				return;
			} else {
				targetLanguage = lastUsedLanguageCodes[1];
				result = await translate(
					message.text,
					{ to: targetLanguage },
				);
			}
		}

		lastUsedLanguageCodes.unshift(targetLanguage, result.from.language.iso);
		lastUsedLanguageCodes = lastUsedLanguageCodes.filter(filterDuplicatesCallback);
		await redisClient.hSet(`${message.chat.id}`, 'lastUsedLanguageCodes', JSON.stringify(lastUsedLanguageCodes));
		bot.sendMessage(message.chat.id, result.text);
	} catch (err) {
		// Process error in case target language is not supported
		console.error(err);
	}
});

module.exports = router;