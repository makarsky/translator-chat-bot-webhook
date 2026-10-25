import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAnalyticsRequest,
  isAnalyticsEnabled,
  actions,
} from '../src/analytics/googleGa4Policy.js';

test('isAnalyticsEnabled only passes when all GA4 credentials are present and enabled', () => {
  assert.equal(
    isAnalyticsEnabled({ GA4_ENABLED: 'true', GA4_MEASUREMENT_ID: 'G-TEST', GA4_API_SECRET: 'secret' }),
    true,
  );
  assert.equal(
    isAnalyticsEnabled({ GA4_ENABLED: 'false', GA4_MEASUREMENT_ID: 'G-TEST', GA4_API_SECRET: 'secret' }),
    false,
  );
  assert.equal(
    isAnalyticsEnabled({ GA4_ENABLED: 'true', GA4_MEASUREMENT_ID: '', GA4_API_SECRET: 'secret' }),
    false,
  );
});

test('buildAnalyticsRequest maps actions to GA4 names and labels', () => {
  assert.deepEqual(buildAnalyticsRequest(123, actions.start, 'organic'), {
    client_id: '123',
    events: [{ name: 'translator_start', params: { start_source: 'organic' } }],
  });

  assert.deepEqual(buildAnalyticsRequest(456, actions.targetLanguageSelected, 'fr'), {
    client_id: '456',
    events: [{ name: 'translator_target_language_selected', params: { target_language: 'fr' } }],
  });

  assert.deepEqual(buildAnalyticsRequest(789, actions.listen), {
    client_id: '789',
    events: [{ name: 'translator_listen', params: {} }],
  });
});
