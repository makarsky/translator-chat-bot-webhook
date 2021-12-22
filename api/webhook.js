const express = require('express');
const translate = require('@vitalets/google-translate-api');
const ISO6391 = require('iso-639-1');
const fetch = require('node-fetch');

const router = express.Router();

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
	console.log(req.body);

	let result = {};
	// let langTo = ISO6391.getAllCodes().includes(req.body.queryResult.parameters.language)
	// 	? req.body.queryResult.parameters.language : null;

	try {
		result = await translate(
			req.body.message.text,
			{ to: req.body.message.from.language_code === 'en' ? 'ru' : 'en' } // TODO: language_code can't be trusted
		);
		console.log('result');
		console.log(result);
	} catch (err) {
		// Process error in case target language is not supported
		console.error(err);
	}

	const url = encodeURI('https://api.telegram.org/bot' + process.env.TOKEN + '/sendMessage?chat_id=' + req.body.message.chat.id + '&text=' + result.text);
	const response = await fetch(url);
	console.log(response);

	res.json({
		"fulfillmentMessages": [
			{
				"text": {
					"text": [
						'result.text'
					]
				}
			}
		],
	});
});

router.get('/set', async (req, res) => {
	const url = 'https://api.telegram.org/bot' + process.env.TOKEN + '/setWebhook?url=' + process.env.WEBAPP_URL;
	const response = await fetch(url);

	res.json(response);
});

module.exports = router;