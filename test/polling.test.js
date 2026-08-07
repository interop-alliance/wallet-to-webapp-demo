import { describe, it, expect, vi, beforeEach } from 'vitest';

import { startPolling } from '../src/utilities/polling.js';

// Mock fetch to return a completed exchange once. The exchanger answers a poll
// with `{ state, response }`; a completed exchange carries the wallet's payload
// under `response`.
const payload = { verifiablePresentation: { proof: { type: 'Ed25519' } } };

function mockSuccessfulFetchOnce() {
  let called = false;
  global.fetch = vi.fn(async () => {
    if (called) {
      return { ok: true, status: 200, json: async () => ({ state: 'pending' }) };
    }
    called = true;
    return {
      ok: true,
      status: 200,
      json: async () => ({ state: 'complete', response: payload }),
    };
  });
}

describe('utilities/polling', () => {
  let spinner;
  let result;

  beforeEach(() => {
    spinner = document.createElement('div');
    spinner.id = 'spinnerX';
    result = document.createElement('pre');
    result.id = 'resultX';
    document.body.innerHTML = '';
    document.body.appendChild(spinner);
    document.body.appendChild(result);

    // reset timers
    vi.useFakeTimers();
  });

  it('starts and stops polling, writes result, hides spinner', async () => {
    mockSuccessfulFetchOnce();

    startPolling({
      spinnerId: 'spinnerX',
      resultId: 'resultX',
      exchangeUrl: 'https://exchanger.example/workflows/ephemeral/exchanges/z1',
      timeoutToast: null,
    });

    // advance timers to trigger interval once
    await vi.advanceTimersByTimeAsync(3100);

    expect(spinner.style.display).toBe('none');
    expect(result.textContent).toContain('verifiablePresentation');
  });
});
