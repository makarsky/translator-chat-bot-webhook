import {
  actions,
  buildAnalyticsRequest,
  isAnalyticsEnabled,
  type AnalyticsAction,
} from './googleGa4Policy.js';

const requestTimeoutMs = 1500;

const event = async (
  userId: number | string,
  action: AnalyticsAction,
  label?: string,
): Promise<void> => {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!isAnalyticsEnabled(process.env) || !measurementId || !apiSecret) {
    return;
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(requestTimeoutMs),
        body: JSON.stringify(buildAnalyticsRequest(userId, action, label)),
      },
    );

    if (!response.ok) {
      console.error('Google Analytics event failed', response.status);
    }
  } catch {
    console.error('Google Analytics event failed (network error)');
  }
};

export default {
  actions,
  event,
};
