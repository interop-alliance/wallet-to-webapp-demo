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
    signBtn.addEventListener('click', () => {
      const signRequest = buildSignRequest(controllerDid, exchangeUrl);
      const encodedSignRequest = encodeURI(JSON.stringify(signRequest));
      const lcwSignRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedSignRequest}`;

      if (signQrDiv) signQrDiv.innerHTML = '';
      if (window.QRCode && signQrDiv) {
        new QRCode(signQrDiv, {
          text: lcwSignRequestUrl,
          width: 256,
          height: 256,
          correctLevel: window.QRCode.CorrectLevel?.L || 0
        });
      } else {
        console.warn('QRCode library not available');
      }

      if (signQrTextPre) {
        signQrTextPre.textContent = `Wallet deep link:\n${lcwSignRequestUrl}\n\nDecoded request JSON:`;
        const code = document.createElement('code');
        code.className = 'language-json';
        code.textContent = JSON.stringify(signRequest, null, 2);
        signQrTextPre.appendChild(document.createElement('br'));
        signQrTextPre.appendChild(code);
        highlight(code);
      }

      startSignPolling();
    });
  }
}

function startSignPolling() {
  const signSpinner = document.getElementById('signSpinner');
  const signResult = document.getElementById('signResult');

  show(signSpinner);

  pollInterval = setInterval(async () => {
    await pollOnce(obj => {
      clearInterval(pollInterval);
      pollInterval = null;
      hide(signSpinner);

      window.latestPayload = obj;
      if (signResult) {
        signResult.textContent = JSON.stringify(obj, null, 2);
        highlight(signResult);
      }

      Actions.showSignRequestActions(true);

      if (window.M?.toast) {
        M.toast({ html: 'Sign request successful!' });
      }
    });
  }, 3000);

  // 120 seconds timeout
  setTimeout(() => {
    if (!pollInterval) return;
    clearInterval(pollInterval);
    pollInterval = null;
    hide(signSpinner);

    if (signResult) {
      signResult.textContent =
        'Timed out waiting for wallet. Please rescan or refresh.';
      highlight(signResult);
    }

    Actions.showActions(false);
    window.M?.toast?.({ html: 'Polling timed out' });
  }, 120000);
}
