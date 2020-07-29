const express = require('express');
const translate = require('@vitalets/google-translate-api');
const ISO6391 = require('iso-639-1');

const router = express.Router();

router.post('/', async (req, res) => {

	console.log(req.body);
	let result = {};
	let langTo = ISO6391.getAllCodes().includes(req.body.queryResult.parameters.language)
		? req.body.queryResult.parameters.language : null;

	try {
		result = await translate(
			req.body.queryResult.parameters.text,
			{to: langTo}
		);
	    console.log('result');
	    console.log(result);
	} catch(err) {
	    console.error(err);
	}

	res.json({
		"fulfillmentMessages": [
			{
				"text": {
					"text": [
						result.text
					]
				}
			}
		],
	});
});

module.exports = router;