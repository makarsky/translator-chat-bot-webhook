const eventNames = {
  start: 'translator_start',
  setTargetLanguage: 'translator_set_target_language',
  targetLanguageSelected: 'translator_target_language_selected',
  translate: 'translator_translate',
  listen: 'translator_listen',
  about: 'translator_about',
};

const labelParameters: Partial<Record<AnalyticsAction, string>> = {
  start: 'start_source',
  targetLanguageSelected: 'target_language',
  translate: 'target_language',
};

const actions = {
  start: 'start',
  setTargetLanguage: 'setTargetLanguage',
  targetLanguageSelected: 'targetLanguageSelected',
  translate: 'translate',
  listen: 'listen',
  about: 'about',
} as const;

const requestTimeoutMs = 1500;

type AnalyticsAction = keyof typeof actions;

const event = async (
  userId: number | string,
  action: AnalyticsAction,
  label?: string,
): Promise<void> => {
  const enabled = process.env.GA4_ENABLED === 'true';
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  const eventName = eventNames[action];

  if (!enabled || !measurementId || !apiSecret || !eventName) {
    return;
  }

  const parameters: Record<string, string> = {};
  const labelParameter = labelParameters[action];
  if (labelParameter && label !== undefined) {
    parameters[labelParameter] = label;
  }

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(requestTimeoutMs),
        body: JSON.stringify({
          client_id: String(userId),
          events: [{ name: eventName, params: parameters }],
        }),
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
