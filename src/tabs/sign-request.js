import { WALLET_DEEP_LINK } from '../../app.config.js';
import { renderQrAndJson, generateRandomPageId, createExchange } from '../utilities/helpers.js';
import { startPolling } from '../utilities/polling.js';

function buildSignRequest(controllerDid, exchangeUrl) {
  return {
    issueRequest: {
      interact: {
        type: 'UnmediatedHttpPresentationService2021',
        serviceEndpoint: exchangeUrl,
      },
      credential: {
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.2.json',
          'https://w3id.org/security/suites/ed25519-2020/v1',
        ],
        type: ['VerifiableCredential', 'OpenBadgeCredential'],
        name: 'Demonstration of Issuing by Wallet',
        credentialSubject: {
          type: ['AchievementSubject'],
          achievement: {
            id: 'urn:uuid:58d1987c-7c5f-4111-bddc-d71c987a5d21',
            type: ['Achievement'],
            name: 'Issue via Wallet Achievement',
            criteria: {
              type: 'Criteria',
              narrative:
                'This person has used a wallet mobile app to sign (issue) a Verifiable Credential.',
            },
            description:
              'This person has used a wallet mobile app to sign (issue) a Verifiable Credential.',
            achievementType: 'Competency',
          },
          id: controllerDid,
        },
        id: 'urn:uuid:688146a20f4657798509ff6e',
        issuanceDate: '2025-07-23T20:34:17Z',
      },
    },
  };
}

function initSignRequest() {
  const signBtn = document.getElementById('signBtn');
  const signQrDiv = document.getElementById('signQr');
  const signQrTextPre = document.getElementById('signQrText');

  const controllerDid =
    localStorage.getItem('controllerDid') || 'did:example:12345';

  if (signBtn) {
    signBtn.addEventListener('click', async () => {
      // Generate fresh randomPageId for this request (kept for demo logs)
      generateRandomPageId();

      // Create an exchange for the sign/issue request
      const signQuery = buildSignRequest(controllerDid, '');
      try {
        const exchangeUrl = await createExchange(signQuery);

        // Now embed the actual exchange URL into the request for wallet deep link visibility
        const signRequest = buildSignRequest(controllerDid, exchangeUrl);
        const encodedSignRequest = encodeURI(JSON.stringify(signRequest));
        const lcwSignRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedSignRequest}`;

        renderQrAndJson({
          targetDiv: signQrDiv,
          targetPre: signQrTextPre,
          requestUrl: lcwSignRequestUrl,
          json: signRequest,
          includeLinkFallback: false,
        });

        startPolling({
          spinnerId: 'signSpinner',
          resultId: 'signResult',
          showActions: () => Actions.showSignRequestActions(true),
          hideActions: () => Actions.showSignRequestActions(false),
          successToast: 'Sign request successful!',
          timeoutToast: 'Polling timed out',
          exchangeUrl: exchangeUrl,
        });
      } catch (e) {
        console.error(e);
      }
    });
  }
}
document.addEventListener('DOMContentLoaded', initSignRequest);
