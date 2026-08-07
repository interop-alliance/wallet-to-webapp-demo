import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const INTERACTION_URL =
  'https://minimal-exchanger.example/workflows/ephemeral/exchanges/z1A2b3';

// `chapi.js` memoizes the loaded polyfill in module state, so each test imports
// a fresh copy after `vi.resetModules()`.
async function freshChapi() {
  vi.resetModules();
  return import('../src/utilities/chapi.js');
}

describe('utilities/chapi', () => {
  let interact;

  beforeEach(() => {
    document.body.innerHTML = '';
    interact = vi.fn().mockResolvedValue({});
    window.credentialHandlerPolyfill = {
      loadOnce: vi.fn().mockResolvedValue({ chapi: { interact } }),
    };
    delete window.chapi;
  });

  afterEach(() => {
    delete window.credentialHandlerPolyfill;
    delete window.chapi;
    vi.restoreAllMocks();
  });

  it('interactWithWallet forwards the interaction URL to chapi.interact()', async () => {
    const { interactWithWallet } = await freshChapi();
    await interactWithWallet({ interactionUrl: INTERACTION_URL });
    expect(interact).toHaveBeenCalledWith({
      interactionUrl: INTERACTION_URL,
      recommendedHandlerOrigins: undefined,
    });
  });

  it('interactWithWallet passes recommendedHandlerOrigins through', async () => {
    const { interactWithWallet } = await freshChapi();
    const origins = ['https://wallet.example'];
    await interactWithWallet({
      interactionUrl: INTERACTION_URL,
      recommendedHandlerOrigins: origins,
    });
    expect(interact).toHaveBeenCalledWith({
      interactionUrl: INTERACTION_URL,
      recommendedHandlerOrigins: origins,
    });
  });

  it('resolves chapi from globalThis.chapi when loadOnce returns nothing', async () => {
    window.credentialHandlerPolyfill.loadOnce = vi
      .fn()
      .mockResolvedValue(undefined);
    window.chapi = { interact };
    const { interactWithWallet } = await freshChapi();
    await interactWithWallet({ interactionUrl: INTERACTION_URL });
    expect(interact).toHaveBeenCalled();
  });

  it('rejects when the polyfill did not load', async () => {
    delete window.credentialHandlerPolyfill;
    const { interactWithWallet } = await freshChapi();
    await expect(
      interactWithWallet({ interactionUrl: INTERACTION_URL })
    ).rejects.toThrow(/did not load/);
  });

  it('wireChapiButton stays hidden until setUrl, then reveals and interacts', async () => {
    const { wireChapiButton } = await freshChapi();
    const row = document.createElement('div');
    row.id = 'chapiRow';
    row.style.display = 'none';
    const btn = document.createElement('a');
    btn.id = 'chapiBtn';
    document.body.append(row, btn);

    const handle = wireChapiButton({ buttonId: 'chapiBtn', rowId: 'chapiRow' });

    // Clicking before a URL is set must not call interact().
    btn.click();
    await Promise.resolve();
    expect(interact).not.toHaveBeenCalled();
    expect(row.style.display).toBe('none');

    handle.setUrl(INTERACTION_URL);
    expect(row.style.display).toBe('block');

    btn.click();
    await vi.waitFor(() =>
      expect(interact).toHaveBeenCalledWith({
        interactionUrl: INTERACTION_URL,
        recommendedHandlerOrigins: undefined,
      })
    );

    handle.reset();
    expect(row.style.display).toBe('none');
  });
});
