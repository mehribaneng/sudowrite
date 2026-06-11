import { AxiosHeaders, create } from 'axios';

const OPENROUTER_KEY = process.env.EXPO_PUBLIC_OPENROUTER_KEY;

function getApiKey() {
  if (!OPENROUTER_KEY) {
    throw new Error('Set EXPO_PUBLIC_OPENROUTER_KEY before using dictation.');
  }

  return OPENROUTER_KEY;
}

export const openRouterClient = create({
  baseURL: 'https://openrouter.ai/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60_000,
});

openRouterClient.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);
  headers.set('Authorization', `Bearer ${getApiKey()}`);
  config.headers = headers;
  return config;
});
