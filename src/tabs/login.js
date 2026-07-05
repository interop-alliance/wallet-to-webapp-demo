/**
 * "Login with Wallet" tab -- the web-app to web-wallet CHAPI flow.
 *
 * Unlike the other tabs (which POST a VP Request to the minimal-exchanger and
 * poll / render a QR for a mobile wallet), this tab talks directly to a web
 * wallet registered as a CHAPI handler in the same browser. It sends a single
 * Verifiable Presentation Request that combines three queries -- DID
 * Authentication, a Login Credential (`QueryByExample`), and WAS storage
 * capability grants (`AuthorizationCapabilityQuery`) -- via
 * `navigator.credentials.get()`, then displays the signed Verifiable
 * Presentation (with its embedded `zcap` array) that the wallet returns.
 */

import { show, hide, highlight } from '../utilities/helpers.js';

/**
 * CHAPI mediator origin. `authn.io` is the default mediator that brokers
 * between this relying party and whichever web wallet the user has registered.
 */
const MEDIATOR = `https://authn.io/mediator?${encodeURIComponent(
  `origin=${window.location.origin}`
)}`;

/**
 * Builds the "Login with Wallet" VP Request body (the value CHAPI hands the
 * wallet as `web.VerifiablePresentation`): a DID Authentication proof, a
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
              type: 'urn:was:collection',
              name: 'demo-app-data',
            },
          },
          {
            referenceId: 'space-read',
            reason: 'This demo app reads your wallet Space.',
            allowedAction: ['GET', 'HEAD'],
            controller: controllerDid,
            invocationTarget: { type: 'urn:was:space' },
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
  resultPre.textContent = JSON.stringify(obj, null, 2);
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

async function initLoginWithWallet() {
  // Load the CHAPI polyfill so navigator.credentials routes through the mediator.
  if (window.credentialHandlerPolyfill) {
    window.credentialHandlerPolyfill
      .loadOnce(MEDIATOR)
      .then(() => console.log('CHAPI polyfill loaded.'))
      .catch(err => console.error('Error loading CHAPI polyfill:', err));
  } else {
    console.error('credential-handler-polyfill did not load.');
  }

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
    show(spinner);
    setLoginResult('Waiting for wallet...');

    try {
      // Web-app to web-wallet CHAPI request. The mediator opens the user's
      // registered wallet popup; `web.VerifiablePresentation` is the VPR body.
      const result = await navigator.credentials.get({
        web: { VerifiablePresentation: verifiablePresentationRequest },
      });

      if (!result) {
        setLoginResult('No response (the request was cancelled or dismissed).');
        return;
      }

      // A WebCredential wraps the wallet's response VP under `.data`.
      setLoginResult(result.data ?? result);
      show(actions, 'flex');
      toast('✅ Wallet responded!');
    } catch (err) {
      console.error('❌ Login with Wallet failed:', err);
      setLoginResult({ error: err?.message || String(err) });
    } finally {
      hide(spinner);
    }
  });
}

document.addEventListener('DOMContentLoaded', initLoginWithWallet);
