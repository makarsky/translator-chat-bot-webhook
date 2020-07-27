const express = require('express');

const router = express.Router();

router.post('/', (req, res) => {
	console.log(req);
	
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