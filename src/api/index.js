const express = require('express');
const crypto = require('crypto');
const Sentry = require('@sentry/node');
const telegramBot = require('./bot/telegram/bot');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.post('/webhook', async (req, res) => {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = req.get('x-telegram-bot-api-secret-token') || '';

  if (!expectedSecret) {
    res.status(500).json({ error: 'Webhook secret is not configured' });
    return;
  }

  const expectedBuffer = Buffer.from(expectedSecret);
  const receivedBuffer = Buffer.from(receivedSecret);
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    res.sendStatus(401);
    return;
  }

  if (
    !req.body ||
    typeof req.body !== 'object' ||
    Array.isArray(req.body) ||
    !Number.isSafeInteger(req.body.update_id)
  ) {
    res.status(400).json({ error: 'Invalid Telegram update' });
    return;
  }

  try {
    await telegramBot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook update failed', error);
    Sentry.captureException(error);
    res
      .status(error instanceof SyntaxError ? 400 : 500)
      .json({ error: 'Telegram update processing failed' });
  }
});

module.exports = router;
