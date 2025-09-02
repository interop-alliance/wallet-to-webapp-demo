import {
  APP_URL,
  WALLET_DEEP_LINK,
  CORS_PROXY,
  exchangeUrl,
  demoAppDid,
} from '../app.config.js';

import { startPolling } from './utilities/polling.js';
import { renderQrAndJson } from './utilities/helpers.js';

(async () => {
  try {
    await fetch(CORS_PROXY + exchangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appInstanceDid: demoAppDid }),
    });
    console.log('Exchange initialized:', exchangeUrl);
  } catch (e) {
    console.warn('Exchange init failed (continuing anyway):', e);
  }
})();

const chapiRequest = {
  credentialRequestOrigin: APP_URL,
  protocols: { vcapi: exchangeUrl },
};

const encodedRequest = encodeURI(JSON.stringify(chapiRequest));
const lcwRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedRequest}`;

const didAuthRequest = {
  credentialRequestOrigin: APP_URL,
  verifiablePresentationRequest: {
    interact: {
      type: 'UnmediatedHttpPresentationService2021',
      serviceEndpoint: exchangeUrl,
    },
    query: [
      {
        type: 'DIDAuthentication',
        acceptedMethods: [{ method: 'key' }],
      },
    ],
    challenge: '99612b24-63d9-11ea-b99f-4f66f3e4f81a',
    domain: APP_URL,
  },
};
const encodedDidAuthRequest = encodeURI(JSON.stringify(didAuthRequest));
const lcwDidAuthRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedDidAuthRequest}`;

function startVcPolling() {
  startPolling({
    spinnerId: 'spinner',
    resultId: 'result',
    showActions: () => Actions.showActions(true),
    hideActions: () => Actions.showActions(false),
    timeoutToast: 'Polling timed out',
    onSuccess: obj => Actions.setResultJSON(obj),
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('requestBtn');
  const qrDiv = document.getElementById('qr');
  const qrTextPre = document.getElementById('qrText');

  Actions.initActions({
    getJSON: () =>
      window.latestPayload ? JSON.stringify(window.latestPayload, null, 2) : '',
  });
  Actions.showActions(false);

  Actions.initZcapActions({
    getJSON: () =>
      window.latestPayload ? JSON.stringify(window.latestPayload, null, 2) : '',
  });
  Actions.showZcapActions(false);

  Actions.initSignRequestActions({
    getJSON: () =>
      window.latestPayload ? JSON.stringify(window.latestPayload, null, 2) : '',
  });
  Actions.showSignRequestActions(false);

  if (btn) {
    btn.addEventListener('click', () => {
      renderQrAndJson({
        targetDiv: qrDiv,
        targetPre: qrTextPre,
        requestUrl: lcwRequestUrl,
        json: chapiRequest,
        includeLinkFallback: true,
      });
      startVcPolling();
    });
  }

  initDidAuthentication();
});

function initDidAuthentication() {
  const didLoginBtn = document.getElementById('didLoginBtn');
  const didQrDiv = document.getElementById('didQr');
  const didQrTextPre = document.getElementById('didQrText');

  if (didLoginBtn) {
    didLoginBtn.addEventListener('click', () => {
      renderQrAndJson({
        targetDiv: didQrDiv,
        targetPre: didQrTextPre,
        requestUrl: lcwDidAuthRequestUrl,
        json: didAuthRequest,
        includeLinkFallback: true,
      });
      startDidAuthPolling();
    });
  }
}

function startDidAuthPolling() {
  startPolling({
    spinnerId: 'didSpinner',
    resultId: 'didResult',
    successToast: 'DID authentication successful!',
    timeoutToast: 'DID authentication timed out',
  });
}
