/**
 * "Login with Wallet" tab -- the web-app to web-wallet CHAPI flow, using the
 * new `chapi.interact()` API.
 *
 * It sends a single Verifiable Presentation Request that combines three queries
 * -- DID Authentication, a Login Credential (`QueryByExample`), and WAS storage
 * capability grants (`AuthorizationCapabilityQuery`) -- to a web wallet. Like
 * the other tabs it POSTs that request to the minimal-exchanger and then hands
 * the resulting exchange URL to the user's registered web wallet via
 * `chapi.interact()` (which, unlike the old `navigator.credentials.get()`, does
 * not depend on `navigator.credentials`). The wallet's signed Verifiable
 * Presentation (with its embedded `zcap` array) comes back through the
 * exchange, retrieved by polling.
 */

import { APP_URL } from '../../app.config.js';
import { show, hide, highlight, createExchange } from '../utilities/helpers.js';
import { startPolling } from '../utilities/polling.js';
import { interactWithWallet } from '../utilities/chapi.js';

/**
 * Builds the "Login with Wallet" VP Request body: a DID Authentication proof, a
 * best-effort Login Credential query, and a set of WAS capability grants
 * described abstractly so the wallet maps them onto its own Space.
 *
 * @param options {object}
 * @param options.controllerDid {string}   the relying party's DID -- the
 *   controller the requested zcaps are delegated to
 * @param options.challenge {string}       fresh nonce bound into the DIDAuth proof
 * @param options.domain {string}          this app's origin (domain binding)
 * @returns {object}
 */
function buildLoginRequest({ controllerDid, challenge, domain }) {
  return {
    query: [
      {
        type: 'DIDAuthentication',
        acceptedMethods: [{ method: 'key' }],
        acceptedCryptosuites: [{ cryptosuite: 'eddsa-rdfc-2022' }],
      },
      {
        type: 'QueryByExample',
        credentialQuery: {
          reason: 'Show your username on this demo app.',
          example: { type: 'LoginCredential' },
        },
      },
      {
        type: 'AuthorizationCapabilityQuery',
        capabilityQuery: [
          {
            referenceId: 'demo-app-data',
            reason:
              'This demo app stores your documents in your wallet storage.',
            allowedAction: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE'],
            controller: controllerDid,
            invocationTarget: {
              type: 'https://w3id.org/byoe#collection',
              name: 'demo-app-data',
            },
          },
          {
            referenceId: 'space-read',
            reason: 'This demo app reads your wallet Space.',
            allowedAction: ['GET', 'HEAD'],
            controller: controllerDid,
            invocationTarget: { type: 'https://w3id.org/byoe#space' },
          },
        ],
      },
    ],
    challenge,
    domain,
  };
}

/**
 * Renders a response object (or an error) into the result pane and reveals the
 * copy / download actions.
 *
 * @param obj {unknown}
 */
function setLoginResult(obj) {
  const resultPre = document.getElementById('loginResult');
  if (!resultPre) return;
  resultPre.textContent =
    typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2);
  highlight(resultPre);
}

function toast(html) {
  if (window.M?.toast) {
    M.toast({ html });
  } else {
    console.log('[toast]', html);
  }
}

function initLoginActions() {
  const copyBtn = document.getElementById('loginCopyBtn');
  const downloadBtn = document.getElementById('loginDownloadBtn');
  const getJSON = () => document.getElementById('loginResult')?.textContent || '';

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const json = getJSON();
      if (!json) return toast('Nothing to copy');
      navigator.clipboard?.writeText(json).then(
        () => toast('Copied JSON'),
        () => toast('Copy failed')
      );
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      const json = getJSON();
      if (!json) return toast('Nothing to download');
      const blob = new Blob([json], {
        type: 'application/json;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'login-with-wallet-response.json';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      toast('Downloaded JSON');
    });
  }
}

function initLoginWithWallet() {
  initLoginActions();

  const loginBtn = document.getElementById('loginBtn');
  const spinner = document.getElementById('loginSpinner');
  const actions = document.getElementById('loginActions');
  const controllerDidInput = document.getElementById('loginControllerDid');

  hide(actions);

  if (!loginBtn) return;

  loginBtn.addEventListener('click', async () => {
    const controllerDid =
      controllerDidInput?.value?.trim() ||
      'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK';
    const challenge = crypto?.randomUUID?.() || String(Math.random()).slice(2);

    const verifiablePresentationRequest = buildLoginRequest({
      controllerDid,
      challenge,
      domain: window.location.origin,
    });

    hide(actions);
    setLoginResult('Waiting for wallet...');

    try {
      // Create an exchange carrying the login VPR on the minimal-exchanger.
      const exchangeUrl = await createExchange({
        credentialRequestOrigin: APP_URL,
        verifiablePresentationRequest,
      });

      // Poll the exchange for the wallet's response, and open the user's
      // registered web wallet on that same exchange URL via chapi.interact().
      startPolling({
        spinnerId: 'loginSpinner',
        resultId: 'loginResult',
        exchangeUrl,
        successToast: '✅ Wallet responded!',
        timeoutToast: 'Timed out waiting for wallet.',
        showActions: () => show(actions, 'flex'),
        hideActions: () => hide(actions),
      });

      await interactWithWallet({ interactionUrl: exchangeUrl });
    } catch (err) {
      if (err?.name === 'AbortError') {
        toast('Wallet interaction cancelled.');
      } else {
        console.error('❌ Login with Wallet failed:', err);
        setLoginResult({ error: err?.message || String(err) });
      }
      hide(spinner);
    }
  });
}

document.addEventListener('DOMContentLoaded', initLoginWithWallet);
