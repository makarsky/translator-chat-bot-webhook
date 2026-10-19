import express, { type Request, type Response } from 'express';
import * as crypto from 'node:crypto';
import * as Sentry from '@sentry/node';

const telegramBot = require('./bot/telegram/bot');
const router = express.Router();

interface TelegramUpdate {
  update_id: number;
  [key: string]: unknown;
}

router.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
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

  const update = req.body as Partial<TelegramUpdate> | null;
  if (
    !update ||
    typeof update !== 'object' ||
    Array.isArray(update) ||
    !Number.isSafeInteger(update.update_id)
  ) {
    res.status(400).json({ error: 'Invalid Telegram update' });
    return;
  }

  try {
    await telegramBot.processUpdate(update);
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
