import { describe, it, expect, beforeEach } from 'vitest';

import {
  show,
  hide,
  safeParse,
  renderQrAndJson,
} from '../src/utilities/helpers.js';

// Provide a minimal QRCode stub on window
class QRCodeStub {
  constructor(target, opts) {
    target.dataset.qr = opts.text;
  }
}

describe('utilities/helpers', () => {
  let div;
  let pre;

  beforeEach(() => {
    div = document.createElement('div');
    pre = document.createElement('pre');
    document.body.innerHTML = '';
    document.body.appendChild(div);
    document.body.appendChild(pre);
    window.QRCode = QRCodeStub;
  });

  it('show/hide toggles display style', () => {
    hide(div);
    expect(div.style.display).toBe('none');
    show(div);
    expect(div.style.display).toBe('block');
    show(div, 'flex');
    expect(div.style.display).toBe('flex');
  });

  it('safeParse returns null on invalid JSON', () => {
    expect(safeParse('{bad json}')).toBeNull();
    expect(safeParse('{"a":1}')).toEqual({ a: 1 });
  });

  it('renderQrAndJson renders QR and code block', () => {
    const url = 'https://example.com?q=1';
    const json = { a: 1 };
    renderQrAndJson({
      targetDiv: div,
      targetPre: pre,
      requestUrl: url,
      json,
      includeLinkFallback: false,
    });

    expect(div.dataset.qr).toBe(url);
    expect(pre.textContent.includes('Wallet deep link:')).toBe(true);
    const code = pre.querySelector('code');
    expect(code).not.toBeNull();
    expect(code.textContent).toContain('"a": 1');
  });
});
