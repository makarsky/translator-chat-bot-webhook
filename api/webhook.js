const express = require('express');
const translate = require('@vitalets/google-translate-api');

const router = express.Router();

router.post('/', async (req, res) => {
	console.log(req.body);
	console.log(req.body.queryResult.queryText);
	let result = {};

	try {
		result = await translate(req.body.queryResult.queryText, {to: 'en'});
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