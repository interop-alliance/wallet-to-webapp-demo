import { APP_URL, WALLET_DEEP_LINK } from '../app.config.js';

import { startPolling } from './utilities/polling.js';
import {
  renderQrAndJson,
  generateRandomPageId,
  createExchange,
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
    successToast: '✅ Wallet responded!',
    exchangeUrl: currentExchangeUrl,
    onSuccess: (obj) => {
      Actions.setResultJSON(obj);
    },
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('requestBtn');
  const qrDiv = document.getElementById('qr');
  const qrTextPre = document.getElementById('qrText');

  // --- Action bar initialization ---
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

  // --- Verifiable Credential Exchange button handler ---
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        // Generate fresh randomPageId
        generateRandomPageId();

        // Prepare the VPR
        const vpRequestQuery = {
          credentialRequestOrigin: APP_URL,
          verifiablePresentationRequest: {
            query: [
              {
                type: 'QueryByExample',
                credentialQuery: {
                  reason:
                    'Please present your Verifiable Credential to complete the verification process.',
                  example: { type: ['VerifiableCredential'] },
                },
              },
            ],
          },
        };

        // Create the exchange on the minimal-exchanger
        currentExchangeUrl = await createExchange(vpRequestQuery);

        // Build CHAPI request for LCW
        const chapiRequest = {
          credentialRequestOrigin: APP_URL,
          protocols: { vcapi: currentExchangeUrl },
        };

        const encodedRequest = encodeURI(JSON.stringify(chapiRequest));
        const lcwRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedRequest}`;

        // Render QR + JSON payload
        renderQrAndJson({
          targetDiv: qrDiv,
          targetPre: qrTextPre,
          requestUrl: lcwRequestUrl,
          json: chapiRequest,
          includeLinkFallback: true,
        });

        // Start polling until LCW responds
        startVcPolling();
      } catch (e) {
        console.error('❌ Error during VC exchange setup:', e);
      }
    });
  }

  // --- DID Auth section initialization ---
  initDidAuthentication();
});

function initDidAuthentication() {
  const didLoginBtn = document.getElementById('didLoginBtn');
  const didQrDiv = document.getElementById('didQr');
  const didQrTextPre = document.getElementById('didQrText');

  if (didLoginBtn) {
    didLoginBtn.addEventListener('click', async () => {
      try {
        generateRandomPageId();

        // Prepare the DIDAuth query
        const didAuthQuery = {
          credentialRequestOrigin: APP_URL,
          verifiablePresentationRequest: {
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

        // Create exchange on exchanger
        currentExchangeUrl = await createExchange(didAuthQuery);
        console.log('✅ DIDAuth exchange created:', currentExchangeUrl);

        // Build CHAPI request for LCW
        const chapiRequest = {
          credentialRequestOrigin: APP_URL,
          protocols: { vcapi: currentExchangeUrl },
        };

        const encodedDidAuthRequest = encodeURI(JSON.stringify(chapiRequest));
        const lcwDidAuthRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedDidAuthRequest}`;

        // Render DID Auth QR
        renderQrAndJson({
          targetDiv: didQrDiv,
          targetPre: didQrTextPre,
          requestUrl: lcwDidAuthRequestUrl,
          json: chapiRequest,
          includeLinkFallback: true,
        });

        // Start polling for DIDAuth response
        startDidAuthPolling();
      } catch (e) {
        console.error('❌ Error during DID Auth setup:', e);
      }
    });
  }
}

function startDidAuthPolling() {
  startPolling({
    spinnerId: 'didSpinner',
    resultId: 'didResult',
    successToast: '✅ DID authentication successful!',
    timeoutToast: '⏰ DID authentication timed out',
    exchangeUrl: currentExchangeUrl,
    onSuccess: (obj) => {
      console.log('✅ DID Auth complete:', obj);
      Actions.setResultJSON(obj);
    },
  });
}
