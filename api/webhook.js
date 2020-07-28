const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
	console.log(req.body);

	res.json({
		"fulfillmentMessages": [
			{
				"text": {
					"text": [
						"Text response from webhook"
					]
				}
			}
		],
		body: req.body
	});
});

module.exports = router;