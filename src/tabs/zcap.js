import { APP_URL, WALLET_DEEP_LINK, exchangeUrl } from '../../app.config.js';
import { renderQrAndJson } from '../utilities/helpers.js';
import { startPolling } from '../utilities/polling.js';

function buildZcapRequest(controllerDid, targetUrl) {
  return {
    credentialRequestOrigin: APP_URL,
    verifiablePresentationRequest: {
      interact: {
        type: 'UnmediatedHttpPresentationService2021',
        serviceEndpoint: exchangeUrl,
      },
      query: [
        {
          type: 'ZcapQuery',
          capabilityQuery: {
            reason:
              'Example App is requesting the permission to read and write to the Verifiable Credentials collection.',
            allowedAction: ['GET', 'PUT', 'POST'],
            controller: controllerDid,
            invocationTarget: targetUrl,
          },
        },
        {
          type: 'ZcapQuery',
          capabilityQuery: {
            reason:
              'Example App is requesting the permission to read and write to the Documents (VC Evidence) collections.',
            allowedAction: ['GET', 'PUT', 'POST'],
            controller: controllerDid,
            invocationTarget: targetUrl,
          },
        },
        {
          type: 'DIDAuthentication',
          acceptedMethods: [{ method: 'key' }],
        },
      ],
    },
  };
}

function initZcapRequest() {
  const zcapBtn = document.getElementById('zcapBtn');
  const zcapQrDiv = document.getElementById('zcapQr');
  const zcapQrTextPre = document.getElementById('zcapQrText');
  const controllerDidInput = document.getElementById('controllerDid');
  const targetUrlInput = document.getElementById('targetUrl');

  if (zcapBtn) {
    zcapBtn.addEventListener('click', () => {
      const controllerDid = controllerDidInput.value || 'did:example:12345';
      const targetUrl =
        targetUrlInput.value || 'https://example.com/api/endpoint';

      const zcapRequest = buildZcapRequest(controllerDid, targetUrl);
      const encodedZcapRequest = encodeURI(JSON.stringify(zcapRequest));
      const lcwZcapRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedZcapRequest}`;

      renderQrAndJson({
        targetDiv: zcapQrDiv,
        targetPre: zcapQrTextPre,
        requestUrl: lcwZcapRequestUrl,
        json: zcapRequest,
        includeLinkFallback: true,
      });

      startPolling({
        spinnerId: 'zcapSpinner',
        resultId: 'zcapResult',
        showActions: () => Actions.showZcapActions(true),
        hideActions: () => Actions.showZcapActions(false),
        successToast: 'zCap request successful!',
        timeoutToast: 'zCap request timed out',
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', initZcapRequest);
