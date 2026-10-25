import express, { type Request, type Response } from 'express';
import * as Sentry from '@sentry/node';
import telegramBot from './bot/telegram/bot.js';
import { isValidTelegramUpdate, verifyWebhookSecret } from './webhookPolicy.js';

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
  const expectedSecret = process.env.WEBHOOK_SECRET;
  const receivedSecret = req.get('x-telegram-bot-api-secret-token') || '';

  if (!expectedSecret) {
    res.status(500).json({ error: 'Webhook secret is not configured' });
    return;
  }

  if (!verifyWebhookSecret(expectedSecret, receivedSecret)) {
    res.sendStatus(401);
    return;
  }

  const update = req.body as Partial<TelegramUpdate> | null;

  if (!isValidTelegramUpdate(update)) {
    res.status(400).json({ error: 'Invalid Telegram update' });
    return;
  }

  try {
    await telegramBot.processUpdate(update as TelegramUpdate);
    res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook update failed', error);
    Sentry.captureException(error);
    res
      .status(error instanceof SyntaxError ? 400 : 500)
      .json({ error: 'Telegram update processing failed' });
  }
});

export default router;
