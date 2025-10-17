import { CORS_PROXY } from '../../app.config.js';

import { hide, show, highlight } from './helpers.js';

let pollInterval = null;
export let latestPayload = null;

async function pollOnce(exchangeUrl, onFetch, onNotFound) {
  try {
    const res = await fetch(exchangeUrl);
    if (res.status === 404) {
      onNotFound?.();
      return;
    }
    if (!res.ok) return;
    const obj = await res.json().catch(() => null);
    if (!obj) return;

    // Server responses:
    // { id, sequence: 0, state: 'pending' }  -> keep polling
    // { id, sequence: 1, state: 'complete', response: {...} } -> done
    if (obj?.state === 'pending') return; // keep polling

    if (obj?.state === 'complete') {
      const result = obj.response ?? obj;
      onFetch(result);
      return;
    }
  } catch (e) {
    console.log('Polling error', e);
  }
}

export function startPolling({
  spinnerId,
  resultId,
  onSuccess,
  onTimeout: _onTimeout,
  showActions,
  hideActions,
  successToast,
  timeoutToast,
  exchangeUrl,
}) {
  if (pollInterval) clearInterval(pollInterval);

  document.querySelectorAll('.spinner').forEach(el => hide(el));

  const spinnerEl = spinnerId && document.getElementById(spinnerId);
  const resultEl = resultId && document.getElementById(resultId);
  show(spinnerEl);

  pollInterval = setInterval(async () => {
    await pollOnce(exchangeUrl, obj => {
      clearInterval(pollInterval);
      pollInterval = null;
      hide(spinnerEl);
      latestPayload = obj;
      try {
        window.latestPayload = obj;
      } catch {
        // Ignore errors setting window property
      }

      if (resultEl) {
        resultEl.textContent = JSON.stringify(obj, null, 2);
        highlight(resultEl);
      }
      showActions?.();
      onSuccess?.(obj);
      if (successToast && window.M?.toast) M.toast({ html: successToast });
    }, () => {
      clearInterval(pollInterval);
      pollInterval = null;
      hide(spinnerEl);
      if (resultEl) {
        resultEl.textContent = 'Exchange not found (404). Please try again.';
        highlight(resultEl);
      }
      hideActions?.();
    });
  }, 3000);

  setTimeout(() => {
    if (!pollInterval) return;
    clearInterval(pollInterval);
    pollInterval = null;
    hide(spinnerEl);

    if (resultEl) {
      resultEl.textContent =
        'Timed out waiting for wallet. Please rescan or refresh.';
      highlight(resultEl);
    }
    hideActions?.();
    if (timeoutToast && window.M?.toast) M.toast({ html: timeoutToast });
  }, 120000);
}
