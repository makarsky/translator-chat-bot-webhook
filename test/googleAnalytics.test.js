const test = require('node:test');
const assert = require('node:assert/strict');
const googleAnalytics = require('../src/analytics/google-ga4');

const originalMeasurementId = process.env.GA4_MEASUREMENT_ID;
const originalApiSecret = process.env.GA4_API_SECRET;
const originalEnabled = process.env.GA4_ENABLED;
const originalFetch = global.fetch;
const originalConsoleError = console.error;
const originalAbortSignalTimeout = AbortSignal.timeout;
let timeoutMs;

test.afterEach(() => {
  if (originalMeasurementId === undefined) {
    delete process.env.GA4_MEASUREMENT_ID;
  } else {
    process.env.GA4_MEASUREMENT_ID = originalMeasurementId;
  }

  if (originalApiSecret === undefined) {
    delete process.env.GA4_API_SECRET;
  } else {
    process.env.GA4_API_SECRET = originalApiSecret;
  }

  if (originalEnabled === undefined) {
    delete process.env.GA4_ENABLED;
  } else {
    process.env.GA4_ENABLED = originalEnabled;
  }

  global.fetch = originalFetch;
  console.error = originalConsoleError;
  AbortSignal.timeout = originalAbortSignalTimeout;
  timeoutMs = undefined;
});

test('does not send events when disabled or GA4 credentials are incomplete', async () => {
  process.env.GA4_ENABLED = 'false';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST';
  process.env.GA4_API_SECRET = 'secret';
  let requestCount = 0;
  global.fetch = async () => {
    requestCount += 1;
  };

  await googleAnalytics.event(123, googleAnalytics.actions.start, 'organic');

  process.env.GA4_ENABLED = 'true';
  delete process.env.GA4_MEASUREMENT_ID;
  await googleAnalytics.event(123, googleAnalytics.actions.start, 'organic');

  process.env.GA4_MEASUREMENT_ID = 'G-TEST';
  delete process.env.GA4_API_SECRET;
  await googleAnalytics.event(123, googleAnalytics.actions.start, 'organic');

  assert.equal(requestCount, 0);
});

test('sends mapped GA4 event names, labels, and string client IDs', async () => {
  process.env.GA4_ENABLED = 'true';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST';
  process.env.GA4_API_SECRET = 'test secret';
  const requests = [];
  AbortSignal.timeout = (milliseconds) => {
    timeoutMs = milliseconds;
    return originalAbortSignalTimeout(milliseconds);
  };
  global.fetch = async (...args) => {
    requests.push(args);
    return { ok: true };
  };

  await googleAnalytics.event(123, googleAnalytics.actions.start, 'organic');
  await googleAnalytics.event(
    456,
    googleAnalytics.actions.targetLanguageSelected,
    'fr',
  );
  await googleAnalytics.event(789, googleAnalytics.actions.translate, 'de');
  await googleAnalytics.event(654, googleAnalytics.actions.setTargetLanguage);
  await googleAnalytics.event(987, googleAnalytics.actions.listen);
  await googleAnalytics.event(321, googleAnalytics.actions.about);

  assert.match(requests[0][0], /measurement_id=G-TEST/);
  assert.match(requests[0][0], /api_secret=test%20secret/);
  assert.equal(requests[0][1].method, 'POST');
  assert.equal(requests[0][1].headers['Content-Type'], 'application/json');
  assert.equal(timeoutMs, 1500);
  assert.ok(requests[0][1].signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(requests[0][1].body), {
    client_id: '123',
    events: [{ name: 'translator_start', params: { start_source: 'organic' } }],
  });
  assert.deepEqual(JSON.parse(requests[1][1].body), {
    client_id: '456',
    events: [
      {
        name: 'translator_target_language_selected',
        params: { target_language: 'fr' },
      },
    ],
  });
  assert.deepEqual(JSON.parse(requests[2][1].body), {
    client_id: '789',
    events: [
      { name: 'translator_translate', params: { target_language: 'de' } },
    ],
  });
  assert.deepEqual(JSON.parse(requests[3][1].body), {
    client_id: '654',
    events: [{ name: 'translator_set_target_language', params: {} }],
  });
  assert.deepEqual(JSON.parse(requests[4][1].body), {
    client_id: '987',
    events: [{ name: 'translator_listen', params: {} }],
  });
  assert.deepEqual(JSON.parse(requests[5][1].body), {
    client_id: '321',
    events: [{ name: 'translator_about', params: {} }],
  });
});

test('logs HTTP and network failures without rejecting', async () => {
  process.env.GA4_ENABLED = 'true';
  process.env.GA4_MEASUREMENT_ID = 'G-TEST';
  process.env.GA4_API_SECRET = 'secret';
  const errors = [];
  console.error = (...args) => errors.push(args);
  global.fetch = async () => ({ ok: false, status: 400 });

  await assert.doesNotReject(
    googleAnalytics.event(123, googleAnalytics.actions.listen),
  );

  global.fetch = async () => {
    throw new Error('network unavailable');
  };
  await assert.doesNotReject(
    googleAnalytics.event(123, googleAnalytics.actions.listen),
  );

  assert.equal(errors.length, 2);
  assert.equal(errors[0][1], 400);
  assert.deepEqual(errors[1], [
    'Google Analytics event failed (network error)',
  ]);
});
