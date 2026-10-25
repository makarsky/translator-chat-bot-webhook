export const actions = {
  start: 'start',
  setTargetLanguage: 'setTargetLanguage',
  targetLanguageSelected: 'targetLanguageSelected',
  translate: 'translate',
  listen: 'listen',
  about: 'about',
} as const;

export type AnalyticsAction = keyof typeof actions;

const eventNames = {
  start: 'translator_start',
  setTargetLanguage: 'translator_set_target_language',
  targetLanguageSelected: 'translator_target_language_selected',
  translate: 'translator_translate',
  listen: 'translator_listen',
  about: 'translator_about',
} as const;

const labelParameters: Partial<Record<AnalyticsAction, string>> = {
  start: 'start_source',
  targetLanguageSelected: 'target_language',
  translate: 'target_language',
};

export const isAnalyticsEnabled = (
  env: NodeJS.ProcessEnv = process.env,
): boolean =>
  env.GA4_ENABLED === 'true' &&
  Boolean(env.GA4_MEASUREMENT_ID) &&
  Boolean(env.GA4_API_SECRET);

export const buildAnalyticsRequest = (
  userId: number | string,
  action: AnalyticsAction,
  label?: string,
): {
  client_id: string;
  events: Array<{ name: (typeof eventNames)[AnalyticsAction]; params: Record<string, string> }>;
} => {
  const eventName = eventNames[action];
  const parameters: Record<string, string> = {};
  const labelParameter = labelParameters[action];

  if (labelParameter && label !== undefined) {
    parameters[labelParameter] = label;
  }

  return {
    client_id: String(userId),
    events: [{ name: eventName, params: parameters }],
  };
};
