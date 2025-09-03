import { CORS_PROXY } from '../../app.config.js';

import { hide, show, safeParse, highlight } from './helpers.js';

let pollInterval = null;
export let latestPayload = null;

async function pollOnce(exchangeUrl, onFetch) {
  try {
    const res = await fetch(CORS_PROXY + exchangeUrl);
    if (!res.ok) return;
    const text = await res.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
    const obj = typeof payload === 'string' ? safeParse(payload) : payload;
    if (obj?.verifiablePresentation || obj?.vp || obj?.zcap) onFetch(obj);
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
