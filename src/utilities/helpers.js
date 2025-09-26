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

      // Wrap the generated QR nodes with an anchor so it's tappable on mobile
      const qrLink = document.createElement('a');
      qrLink.href = requestUrl;
      qrLink.target = '_blank';
      qrLink.rel = 'noopener';

      // Move all current children (QR canvas/img) into the anchor
      while (targetDiv.firstChild) {
        qrLink.appendChild(targetDiv.firstChild);
      }
      targetDiv.appendChild(qrLink);

      // Add an adjacent "Open in LCW" button linking to the same deep link
      const openBtn = document.createElement('a');
      openBtn.href = requestUrl;
      openBtn.target = '_blank';
      openBtn.rel = 'noopener';
      openBtn.className = 'btn green';
      openBtn.textContent = 'Open in LCW';
      targetDiv.appendChild(openBtn);
    } catch (e) {
      if (includeLinkFallback) {
        console.warn('QR too long, showing link instead:', e);
        const link = document.createElement('a');
        link.href = requestUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Open in Wallet';
        targetDiv.appendChild(link);

        const openBtn = document.createElement('a');
        openBtn.href = requestUrl;
        openBtn.target = '_blank';
        openBtn.rel = 'noopener';
        openBtn.className = 'btn green';
        openBtn.textContent = 'Open in LCW';
        targetDiv.appendChild(openBtn);
      } else {
        console.warn('QR generation failed:', e);
      }
    }
  } else if (includeLinkFallback) {
    const link = document.createElement('a');
    link.href = requestUrl;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Open in Wallet';
    targetDiv.appendChild(link);

    const openBtn = document.createElement('a');
    openBtn.href = requestUrl;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener';
    openBtn.className = 'btn green';
    openBtn.textContent = 'Open in LCW';
    targetDiv.appendChild(openBtn);
  }

  // Render a clickable deep link and the decoded JSON
  targetPre.textContent = 'Wallet deep link:\n';
  const linkEl = document.createElement('a');
  linkEl.href = requestUrl;
  linkEl.target = '_blank';
  linkEl.rel = 'noopener';
  linkEl.textContent = requestUrl;
  targetPre.appendChild(linkEl);
  targetPre.appendChild(document.createTextNode('\n\nDecoded request JSON:'));
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
