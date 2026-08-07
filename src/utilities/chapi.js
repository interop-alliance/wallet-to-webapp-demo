/**
 * Shared CHAPI `interact()` helper -- the new, single-call Credential Handler
 * API. It hands a web wallet an *interaction URL* (the exchange URL these tabs
 * already create on the minimal-exchanger) instead of an inline request, and
 * does not depend on `navigator.credentials`, which browsers are expected to
 * freeze. See
 * https://github.com/credential-handler/credential-handler-polyfill#readme
 *
 * The exchange tabs already POST their request to the exchanger and poll the
 * returned exchange URL for the wallet's response. This helper adds an
 * alternative to scanning the QR code with a mobile wallet: it opens the user's
 * CHAPI-registered *web* wallet on that same exchange URL via
 * `chapi.interact()`. `interact()` resolves to an empty object (data
 * minimization) -- the actual response still arrives through the tab's existing
 * polling.
 */

import { show, hide } from './helpers.js';

/**
 * CHAPI mediator URL. `authn.io` brokers between this relying party and
 * whichever web wallet the user has registered as a credential handler.
 */
const MEDIATOR = `https://authn.io/mediator?${encodeURIComponent(
  `origin=${window.location.origin}`
)}`;

let chapiPromise = null;

function toast(html) {
  if (window.M?.toast) {
    M.toast({ html });
  } else {
    console.log('[toast]', html);
  }
}

/**
 * Loads the CHAPI polyfill once and resolves the `chapi` object that carries
 * the `interact()` method. Subsequent calls reuse the same promise.
 *
 * @returns {Promise<{ interact: Function }>}
 */
export function loadChapi() {
  if (chapiPromise) return chapiPromise;
  const polyfill = window.credentialHandlerPolyfill;
  if (!polyfill) {
    return Promise.reject(
      new Error('credential-handler-polyfill did not load.')
    );
  }
  // `loadOnce` resolves to the polyfill object (with `.chapi`); fall back to
  // the `globalThis.chapi` the polyfill also installs.
  chapiPromise = polyfill.loadOnce(MEDIATOR).then(api => api?.chapi ?? window.chapi);
  return chapiPromise;
}

/**
 * Opens the user's registered web wallet on an interaction (exchange) URL via
 * the new `chapi.interact()` API.
 *
 * @param options {object}
 * @param options.interactionUrl {string}   an `https:` exchange URL
 * @param [options.recommendedHandlerOrigins] {string[]}   wallet origins to
 *   recommend to the user in the mediator's chooser
 * @returns {Promise<object>}   resolves to `{}` on completion; rejects with an
 *   `AbortError` if the user cancels
 */
export async function interactWithWallet({
  interactionUrl,
  recommendedHandlerOrigins,
}) {
  const chapi = await loadChapi();
  if (!chapi?.interact) {
    throw new Error(
      'chapi.interact() is unavailable; the polyfill may be older than v4.'
    );
  }
  return chapi.interact({ interactionUrl, recommendedHandlerOrigins });
}

/**
 * Wires an "Open in Web Wallet (CHAPI)" button. The button stays hidden until a
 * tab hands it an exchange URL via `setUrl()` (typically right after it creates
 * the exchange); clicking it opens the registered web wallet on that URL.
 *
 * @param options {object}
 * @param options.buttonId {string}   id of the `<a>`/`<button>` to wire
 * @param [options.rowId] {string}   id of a wrapper element to show/hide
 *   instead of the button itself
 * @returns {{ setUrl(url: string): void, reset(): void }}
 */
export function wireChapiButton({ buttonId, rowId }) {
  const btn = document.getElementById(buttonId);
  const row = rowId ? document.getElementById(rowId) : null;
  const revealEl = row || btn;
  let currentUrl = null;

  if (btn) {
    btn.addEventListener('click', async () => {
      if (!currentUrl) {
        toast('Create a request first.');
        return;
      }
      try {
        await interactWithWallet({ interactionUrl: currentUrl });
        toast('✅ Wallet opened; waiting for response...');
      } catch (err) {
        if (err?.name === 'AbortError') {
          toast('Wallet interaction cancelled.');
        } else {
          console.error('CHAPI interact() failed:', err);
          toast(`CHAPI interaction failed: ${err?.message || err}`);
        }
      }
    });
  }

  return {
    setUrl(url) {
      currentUrl = url;
      show(revealEl);
    },
    reset() {
      currentUrl = null;
      hide(revealEl);
    },
  };
}
