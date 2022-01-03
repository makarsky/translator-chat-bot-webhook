const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const translate = require('@vitalets/google-translate-api');
const ISO6391 = require('iso-639-1');
const fetch = require('node-fetch');
const redis = require('redis');
const availableLanguages = require('./availableLanguages');
const googleTextToSpeechLanguages = require('./googleTextToSpeechLanguages');
const codeLanguageMap = require('@vitalets/google-translate-api/languages');
const googleTTS = require('google-tts-api');

const router = express.Router();

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

const redisClient = redis.createClient({
	url: process.env.REDIS_URL,
	password: process.env.REDIS_PASSWORD,
});
redisClient.on('error', (err) => console.log('Redis redisClient Error', err));
redisClient.connect();

const maxNumberOfInlineButtons = 8;
const maxTextToSpeechLength = 200;
const translationActionListen = 'listen';

const filterDuplicatesCallback = (v, i, a) => v && i === a.indexOf(v);

const buildLanguageCodeReplyOptions = (lastUsedLanguageCodes) => {
	const buttons = (lastUsedLanguageCodes || availableLanguages.map((l) => l.code))
		.slice(0, maxNumberOfInlineButtons - (lastUsedLanguageCodes ? 1 : 2))
		.map((code) => ({
			text: code,
			callback_data: JSON.stringify({ targetLanguageCode: code }),
		}));

	buttons.push({
		text: '➡️',
		callback_data: JSON.stringify({ page: lastUsedLanguageCodes ? 0 : 1 }),
	});

	return {
		reply_markup: {
			inline_keyboard: [buttons],
		},
	};
};

const ChooseTheTargetLanguageText = 'Choose the target language:';

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

// TODO: replace with a server command
router.get('/setWebhook', async (req, res) => {
	const url = 'https://api.telegram.org/bot' + process.env.TOKEN + '/setWebhook?url=' + process.env.WEBAPP_URL;
	const response = await fetch(url);

	res.json(response);
});

// TODO: replace with a server command
router.get('/setMyCommands', async (req, res) => {
	const url = 'https://api.telegram.org/bot' + process.env.TOKEN + '/setMyCommands?commands=' + JSON.stringify([{
		'command': 'set_language', 'description': 'Set target language',
	}]);
	const response = await fetch(url);

	res.json(response);
});

bot.onText(/\/set_language/, async (message, match) => {
	const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
	let lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');
	bot.sendMessage(message.chat.id, ChooseTheTargetLanguageText, buildLanguageCodeReplyOptions(lastUsedLanguageCodes.length > 0 ? lastUsedLanguageCodes : undefined));
});

bot.on('callback_query', async (callback) => {
	if (!callback.data || !callback.message) {
		return;
	}

	const data = JSON.parse(callback.data);

	// Target language selected callback
	if (data.targetLanguageCode !== undefined) {
		const chatSettings = await redisClient.hGetAll(`${callback.message.chat.id}`);
		let lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');
		lastUsedLanguageCodes.unshift(data.targetLanguageCode);
		lastUsedLanguageCodes = lastUsedLanguageCodes.filter(filterDuplicatesCallback);

		await redisClient.hSet(`${callback.message.chat.id}`, 'lastUsedLanguageCodes', JSON.stringify(lastUsedLanguageCodes));

		const targetLanguage = codeLanguageMap[data.targetLanguageCode];

		return bot.editMessageText(
			`Target language: ${targetLanguage} (${data.targetLanguageCode}). Send a text to translate.`,
			{
				chat_id: callback.message.chat.id,
				message_id: callback.message.message_id,
			}
		);
	}

	if (data.page !== undefined) {
		const itemsPerPage = maxNumberOfInlineButtons - 2;
		const pageCount = Math.ceil(availableLanguages.length / itemsPerPage);
		const offset = data.page * itemsPerPage;
		let buttons = availableLanguages
			.slice(offset, offset + itemsPerPage)
			.map((l) => ({
				text: l.code,
				callback_data: JSON.stringify({ targetLanguageCode: l.code }),
			}));

		const nextButton = {
			text: '➡️',
			callback_data: JSON.stringify({ page: data.page + 1 }),
		};

		const previousButton = {
			text: '⬅️',
			callback_data: JSON.stringify({ page: data.page - 1 }),
		};

		const chatSettings = await redisClient.hGetAll(`${callback.message.chat.id}`);
		const lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');

		if (data.page === -1) {
			const options = buildLanguageCodeReplyOptions(lastUsedLanguageCodes.length > 0 ? lastUsedLanguageCodes : undefined);
			buttons = [...options.reply_markup.inline_keyboard[0]];
		} else if (data.page === 0) {
			buttons.push(nextButton);

			if (lastUsedLanguageCodes.length > 0) {
				buttons.unshift(previousButton);
			}
		} else if (data.page + 1 === pageCount) {
			buttons.unshift(previousButton);
		} else {
			buttons.push(nextButton);
			buttons.unshift(previousButton);
		}

		return bot.editMessageText(
			ChooseTheTargetLanguageText,
			{
				chat_id: callback.message.chat.id,
				message_id: callback.message.message_id,
				reply_markup: {
					inline_keyboard: [buttons],
				},
			}
		);
	}

	if (data.translationAction !== undefined) {
		if (data.translationAction === translationActionListen) {
			const chatSettings = await redisClient.hGetAll(`${callback.message.chat.id}`);
			const lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');
			let audioUrl = '';

			try {
				audioUrl = googleTTS.getAudioUrl(callback.message.text, {
					lang: googleTextToSpeechLanguages.findByCode(lastUsedLanguageCodes[0]),
					slow: false,
					host: 'https://translate.google.com',
				});

				await bot.sendAudio(callback.message.chat.id, audioUrl, { caption: callback.message.text });

				return bot.editMessageText(
					callback.message.text,
					{
						chat_id: callback.message.chat.id,
						message_id: callback.message.message_id,
					},
				);
			} catch (e) {
				console.log('audioUrl error', callback.message.text, audioUrl, lastUsedLanguageCodes);
			}
		}

		// TODO: add more actions?
	}
});

bot.on('message', async (message) => {
	if (message.text.match(/\/set_language/)) {
		return;
	}
	// redisClient.flushAll();

	const requestTargetLanguage = (text) => {
		bot.sendMessage(message.chat.id, text, buildLanguageCodeReplyOptions());
	};

	const chatSettings = await redisClient.hGetAll(`${message.chat.id}`);
	let lastUsedLanguageCodes = JSON.parse(chatSettings.lastUsedLanguageCodes || '[]');

	if (lastUsedLanguageCodes.length === 0) {
		requestTargetLanguage(ChooseTheTargetLanguageText);
		return;
	}

	try {
		let targetLanguage = lastUsedLanguageCodes[0];
		let translation = await translate(
			message.text,
			{ to: targetLanguage },
		);

		if (translation.from.language.iso === lastUsedLanguageCodes[0]) {
			if (lastUsedLanguageCodes.length === 1) {
				requestTargetLanguage(
					'Your text is in the same language as the target language. Choose another target language:',
				);
				return;
			} else {
				targetLanguage = lastUsedLanguageCodes[1];
				translation = await translate(
					message.text,
					{ to: targetLanguage },
				);
			}
		}

		lastUsedLanguageCodes.unshift(targetLanguage, translation.from.language.iso);
		lastUsedLanguageCodes = lastUsedLanguageCodes.filter(filterDuplicatesCallback);
		await redisClient.hSet(`${message.chat.id}`, 'lastUsedLanguageCodes', JSON.stringify(lastUsedLanguageCodes));

		const actionButtons = [];

		if (
			translation.text.length < maxTextToSpeechLength
			&& googleTextToSpeechLanguages.findByCode(targetLanguage)
		) {
			actionButtons.push({
				text: '🔊 listen',
				callback_data: JSON.stringify({ translationAction: translationActionListen }),
			});
		}

		await bot.sendMessage(
			message.chat.id,
			`${translation.from.text.didYouMean ? translation.from.text.value + '\n' : ''}${translation.text}`,
			actionButtons.length > 0
				? {
					reply_markup: {
						inline_keyboard: [actionButtons],
					},
				}
				: {},
		);
	} catch (err) {
		// Process error in case target language is not supported
		console.error(err);
	}
});

module.exports = router;