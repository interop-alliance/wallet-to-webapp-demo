export const APP_URL =
  'https://interop-alliance.github.io/wallet-to-webapp-demo';
export const EXCHANGE_SERVER_URL = 'https://verifierplus.org';
export const WALLET_DEEP_LINK = 'https://lcw.app/request';
export const CORS_PROXY = 'https://corsproxy.io/?';

export const randomPageId =
  crypto?.randomUUID?.() || String(Math.random()).slice(2);
export const exchangeUrl = `${EXCHANGE_SERVER_URL}/api/exchanges/${randomPageId}`;
export const demoAppDid = `did:example:${randomPageId}`;
