import { APP_URL, WALLET_DEEP_LINK } from '../app.config.js';

import { startPolling } from './utilities/polling.js';
import {
  renderQrAndJson,
  generateRandomPageId,
  createExchangeUrl,
} from './utilities/helpers.js';

// These will be created fresh on each button click
let currentExchangeUrl = null;
function startVcPolling() {
  startPolling({
    spinnerId: 'spinner',
    resultId: 'result',
    showActions: () => Actions.showActions(true),
    hideActions: () => Actions.showActions(false),
    timeoutToast: 'Polling timed out',
    onSuccess: obj => Actions.setResultJSON(obj),
    exchangeUrl: currentExchangeUrl,
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
      // Generate fresh randomPageId for this request
      const pageId = generateRandomPageId();
      currentExchangeUrl = createExchangeUrl(pageId);

      // Create fresh request with new exchange URL
      const chapiRequest = {
        credentialRequestOrigin: APP_URL,
        protocols: { vcapi: currentExchangeUrl },
      };

      const encodedRequest = encodeURI(JSON.stringify(chapiRequest));
      const lcwRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedRequest}`;

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
      // Generate fresh randomPageId for this request
      const pageId = generateRandomPageId();
      currentExchangeUrl = createExchangeUrl(pageId);

      // Create fresh DID auth request with new exchange URL
      const didAuthRequest = {
        credentialRequestOrigin: APP_URL,
        verifiablePresentationRequest: {
          interact: {
            type: 'UnmediatedHttpPresentationService2021',
            serviceEndpoint: currentExchangeUrl,
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
    exchangeUrl: currentExchangeUrl,
  });
}
