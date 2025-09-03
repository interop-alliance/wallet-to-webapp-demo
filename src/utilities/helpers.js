import { EXCHANGE_SERVER_URL } from '../../app.config.js';

export const show = (el, css = 'block') => el && (el.style.display = css);
export const hide = el => el && (el.style.display = 'none');
export const safeParse = s => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export const highlight = el => {
  if (window.hljs && el) hljs.highlightElement(el);
};

export function renderQrAndJson({
  targetDiv,
  targetPre,
  requestUrl,
  json,
  includeLinkFallback = false,
}) {
  if (!targetDiv || !targetPre) return;

  targetDiv.innerHTML = '';
  if (window.QRCode) {
    try {
      new window.QRCode(targetDiv, {
        text: requestUrl,
        width: 256,
        height: 256,
        correctLevel: window.QRCode.CorrectLevel?.L ?? 0,
      });
    } catch (e) {
      if (includeLinkFallback) {
        console.warn('QR too long, showing link instead:', e);
        targetDiv.innerHTML = `<a href="${requestUrl}" target="_blank" rel="noopener">Open in Wallet</a>`;
      } else {
        console.warn('QR generation failed:', e);
      }
    }
  } else if (includeLinkFallback) {
    targetDiv.innerHTML = `<a href="${requestUrl}" target="_blank" rel="noopener">Open in Wallet</a>`;
  }

  targetPre.textContent = `Wallet deep link:\n${requestUrl}\n\nDecoded request JSON:`;
  const code = document.createElement('code');
  code.className = 'language-json';
  code.textContent = JSON.stringify(json, null, 2);
  targetPre.appendChild(document.createElement('br'));
  targetPre.appendChild(code);
  highlight(code);
}

export const generateRandomPageId = () => {
  const randomPageId = crypto?.randomUUID?.() || String(Math.random()).slice(2);
  console.log('randomPageId', randomPageId);
  return randomPageId;
};

export const createExchangeUrl = pageId => {
  const exchangeUrl = `${EXCHANGE_SERVER_URL}/api/exchanges/${pageId}`;
  console.log('exchangeUrl', exchangeUrl);
  return exchangeUrl;
};
export const createDemoAppDid = pageId => {
  const demoAppDid = `did:example:${pageId}`;
  console.log('demoAppDid', demoAppDid);
  return demoAppDid;
};
