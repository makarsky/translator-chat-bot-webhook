const express = require('express');

const router = express.Router();

router.post('/', (req,res) => {
	res.json({
		"fulfillmentMessages": [
			{
				"text": {
					"text": [
						"Text response from webhook"
					]
				}
			}
		]
	});
});

module.exports = router;