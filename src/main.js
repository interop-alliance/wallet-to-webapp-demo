// ======= CONFIG =======
const APP_URL='https://interop-alliance.github.io/wallet-to-webapp-demo';
const EXCHANGE_SERVER_URL = "https://verifierplus.org";
const WALLET_DEEP_LINK = "https://lcw.app/request";
const CORS_PROXY = "https://corsproxy.io/?";
// ======================

// Generate a unique exchange URL
const randomPageId = crypto?.randomUUID?.() || String(Math.random()).slice(2);
const exchangeUrl = `${EXCHANGE_SERVER_URL}/api/exchanges/${randomPageId}`;

// Dummy DID to associate the app instance
const demoAppDid = `did:example:${randomPageId}`;

// Runtime state
let pollInterval = null;
window.latestPayload = null; // exposed so actions.js (via getJSON) can access it

// Small helpers
const show = (el, css = "block") => el && (el.style.display = css);
const hide = (el) => el && (el.style.display = "none");
const highlight = (el) => (window.hljs && el ? hljs.highlightElement(el) : null);
const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };

// Initialize the exchange session (POST appInstanceDid)
(async () => {
  try {
    await fetch(CORS_PROXY + exchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appInstanceDid: demoAppDid })
    });
    console.log("Exchange initialized:", exchangeUrl);
  } catch (e) {
    console.warn("Exchange init failed (continuing anyway):", e);
  }
})();

// Build CHAPI request object + deep link
const chapiRequest = {
  credentialRequestOrigin: APP_URL,
  protocols: { vcapi: exchangeUrl }
};
const encodedRequest = encodeURI(JSON.stringify(chapiRequest));
const lcwRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedRequest}`;

// Build DID authentication request object
const didAuthRequest = {
  "credentialRequestOrigin": APP_URL,
  "verifiablePresentationRequest": {
    "interact": {
      "type": "UnmediatedHttpPresentationService2021",
      "serviceEndpoint": exchangeUrl
    },
    "query": [{
      "type": "DIDAuthentication",
      "acceptedMethods": [{"method": "key"}]
    }],
    // hardcode the challenge for now, we'll generate and verify it in another PR
    "challenge": "99612b24-63d9-11ea-b99f-4f66f3e4f81a",
    "domain": APP_URL  // yes, the domain appears twice, but this is for different layers
  }
};
const encodedDidAuthRequest = encodeURI(JSON.stringify(didAuthRequest));
const lcwDidAuthRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedDidAuthRequest}`;

// Polling once
async function pollOnce(onFetch) {
  try {
    const res = await fetch(CORS_PROXY + exchangeUrl);
    if (!res.ok) return;

    const text = await res.text();
    let payload;
    try { payload = JSON.parse(text); } catch { payload = text; }

    const obj = typeof payload === "string" ? safeParse(payload) : payload;
    if (obj?.verifiablePresentation || obj?.vp || obj?.zcap) onFetch(obj);
  } catch (e) {
    console.log("Polling error", e);
  }
}

// Start polling loop until a payload arrives (or timeout)
function startPolling() {
  if (pollInterval) return;
  const spinner = document.getElementById("spinner");
  show(spinner);

  pollInterval = setInterval(async () => {
    await pollOnce((obj) => {
      clearInterval(pollInterval);
      pollInterval = null;
      hide(spinner);

      window.latestPayload = obj;
      Actions.setResultJSON(obj); // pretty + highlight
      Actions.showActions(true);  // reveal Copy / Download
    });
  }, 3000);

  // Stop after 2 minutes
  setTimeout(() => {
    if (!pollInterval) return;
    clearInterval(pollInterval);
    pollInterval = null;
    hide(spinner);

    const resultEl = document.getElementById("result");
    resultEl.textContent = "Timed out waiting for wallet. Please rescan or refresh.";
    highlight(resultEl);
    Actions.showActions(false);
    window.M?.toast?.({ html: "Polling timed out" });
  }, 120000);
}

// On load: wire UI and kick off actions
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("requestBtn");
  const qrDiv = document.getElementById("qr");
  const qrTextPre = document.getElementById("qrText");

  // Prepare actions (copy/download) with a getter for the freshest JSON
  Actions.initActions({
    getJSON: () => (window.latestPayload ? JSON.stringify(window.latestPayload, null, 2) : "")
  });
  Actions.showActions(false); // hidden until we get a payload

  btn.addEventListener("click", () => {
    // Render QR or fallback link
    qrDiv.innerHTML = "";
    try {
      new QRCode(qrDiv, {
        text: lcwRequestUrl,
        width: 256,
        height: 256,
        correctLevel: QRCode.CorrectLevel.L
      });
    } catch (e) {
      console.warn("QR too long, showing link instead:", e);
      qrDiv.innerHTML = `<a href="${lcwRequestUrl}" target="_blank" rel="noopener">Open in Wallet</a>`;
    }

    // Show URL and the decoded request JSON (highlighted)
    qrTextPre.textContent = `Wallet deep link:\n${lcwRequestUrl}\n\nDecoded request JSON:`;
    const code = document.createElement("code");
    code.className = "language-json";
    code.textContent = JSON.stringify(chapiRequest, null, 2);
    qrTextPre.appendChild(document.createElement("br"));
    qrTextPre.appendChild(code);
    highlight(code);

    // Begin polling for wallet response
    startPolling();
  });

  // Initialize DID authentication functionality
  initDidAuthentication();
});

// Initialize DID authentication functionality
function initDidAuthentication() {
  const didLoginBtn = document.getElementById("didLoginBtn");
  const didQrDiv = document.getElementById("didQr");
  const didQrTextPre = document.getElementById("didQrText");
  const didSpinner = document.getElementById("didSpinner");
  const didResult = document.getElementById("didResult");

  if (didLoginBtn) {
    didLoginBtn.addEventListener("click", () => {
      // Render QR or fallback link for DID auth
      didQrDiv.innerHTML = "";
      try {
        new QRCode(didQrDiv, {
          text: lcwDidAuthRequestUrl,
          width: 256,
          height: 256,
          correctLevel: QRCode.CorrectLevel.L
        });
      } catch (e) {
        console.warn("QR too long, showing link instead:", e);
        didQrDiv.innerHTML = `<a href="${lcwDidAuthRequestUrl}" target="_blank" rel="noopener">Open in Wallet</a>`;
      }

      // Show URL and the decoded request JSON (highlighted)
      didQrTextPre.textContent = `Wallet deep link:\n${lcwDidAuthRequestUrl}\n\nDecoded request JSON:`;
      const code = document.createElement("code");
      code.className = "language-json";
      code.textContent = JSON.stringify(didAuthRequest, null, 2);
      didQrTextPre.appendChild(document.createElement("br"));
      didQrTextPre.appendChild(code);
      highlight(code);

      // Begin polling for DID auth response
      startDidAuthPolling();
    });
  }
}

// Start polling loop for DID authentication
function startDidAuthPolling() {
  if (pollInterval) return;
  const didSpinner = document.getElementById("didSpinner");
  const didResult = document.getElementById("didResult");
  
  show(didSpinner);

  pollInterval = setInterval(async () => {
    await pollOnce((obj) => {
      clearInterval(pollInterval);
      pollInterval = null;
      hide(didSpinner);

      window.latestPayload = obj;
      
      // Display DID authentication result
      if (didResult) {
        didResult.textContent = JSON.stringify(obj, null, 2);
        highlight(didResult);
      }
      
      // Show success message
      if (window.M?.toast) {
        M.toast({ html: "DID authentication successful!" });
      }
    });
  }, 3000);

  // Stop after 2 minutes
  setTimeout(() => {
    if (!pollInterval) return;
    clearInterval(pollInterval);
    pollInterval = null;
    hide(didSpinner);

    if (didResult) {
      didResult.textContent = "Timed out waiting for wallet. Please rescan or refresh.";
      highlight(didResult);
    }
    
    if (window.M?.toast) {
      M.toast({ html: "DID authentication timed out" });
    }
  }, 120000);
}
