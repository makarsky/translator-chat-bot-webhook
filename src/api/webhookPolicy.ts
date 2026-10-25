import * as crypto from 'node:crypto';

export const verifyWebhookSecret = (
  expectedSecret: string | undefined,
  receivedSecret: string,
): boolean => {
  if (!expectedSecret) {
    return false;
  }

  const expectedBuffer = Buffer.from(expectedSecret);
  const receivedBuffer = Buffer.from(receivedSecret);

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    expectedBuffer.length === 0
  ) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

export const isValidTelegramUpdate = (update: unknown): boolean => {
  if (
    !update ||
    typeof update !== 'object' ||
    Array.isArray(update) ||
    !('update_id' in update) ||
    !Number.isSafeInteger((update as { update_id: unknown }).update_id)
  ) {
    return false;
  }

  return true;
};
