const express = require('express');

const webhook = require('./webhook');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏'
  });
});

router.use('/webhook', webhook);

module.exports = router;