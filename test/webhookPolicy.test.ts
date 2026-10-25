import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTelegramUpdate,
  verifyWebhookSecret,
} from '../src/api/webhookPolicy.js';

test('verifyWebhookSecret accepts matching secrets and rejects missing or mismatched values', () => {
  assert.equal(verifyWebhookSecret('abc', 'abc'), true);
  assert.equal(verifyWebhookSecret('abc', 'abd'), false);
  assert.equal(verifyWebhookSecret(undefined, 'abc'), false);
});

test('isValidTelegramUpdate accepts safe update payloads and rejects malformed ones', () => {
  assert.equal(
    isValidTelegramUpdate({
      update_id: 1,
      message: {
        chat: { id: 2 },
        from: { id: 3 },
        text: 'hello',
      },
    }),
    true,
  );
  assert.equal(isValidTelegramUpdate({ update_id: 1 }), true);
  assert.equal(isValidTelegramUpdate(null), false);
  assert.equal(isValidTelegramUpdate([]), false);
  assert.equal(isValidTelegramUpdate({}), false);
  assert.equal(isValidTelegramUpdate({ update_id: '1' }), false);
});
