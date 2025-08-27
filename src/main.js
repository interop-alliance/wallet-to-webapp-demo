// ======= CONFIG =======
const EXCHANGE_SERVER_URL = "https://devlinked-claims-author.vercel.app"; 
const WALLET_DEEP_LINK = "https://lcw.app/request";
// ======================

const randomPageId = (crypto?.randomUUID?.() || String(Math.random()).slice(2));
const exchangeUrl = `${EXCHANGE_SERVER_URL}/api/exchanges/${randomPageId}`;

// a dummy DID.
const demoAppDid = `did:example:${randomPageId}`;

let pollInterval = null;
let latestPayload = null;

// Initialize the exchange session
(async () => {
  try {
    await fetch(exchangeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appInstanceDid: demoAppDid })
    });
    console.log("Exchange initialized:", exchangeUrl);
  } catch (e) {
    console.warn("Exchange init failed (continuing anyway):", e);
  }
})();

// Build CHAPI request object
const chapiRequest = {
  credentialRequestOrigin: EXCHANGE_SERVER_URL,
  protocols: { vcapi: exchangeUrl }
};

const encodedRequest = encodeURI(JSON.stringify(chapiRequest));
const lcwRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedRequest}`;

function startSpinner() { document.getElementById("spinner").style.display = "block"; }
function stopSpinner()  { document.getElementById("spinner").style.display = "none"; }

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }

async function pollOnce(onFetchVP) {
  try {
    console.log("Polling:", exchangeUrl);
    const res = await fetch(exchangeUrl);
    if (!res.ok) return;

    const text = await res.text();
    let payload; 
    try { payload = JSON.parse(text); } catch { payload = text; }
    const vpObj = (typeof payload === "string") ? safeParse(payload) : payload;

    if (vpObj?.verifiablePresentation || vpObj?.vp || vpObj?.zcap) {
      onFetchVP(vpObj);
    }
  } catch (e) {
    console.log("Polling error", e);
  }
}

function startPolling() {
  if (pollInterval) return;
  startSpinner();

  pollInterval = setInterval(async () => {
    await pollOnce((obj) => {
      clearInterval(pollInterval);
      pollInterval = null;
      stopSpinner();

      latestPayload = obj;
      document.getElementById("result").textContent = JSON.stringify(obj, null, 2);
    });
  }, 3000);

  // Optional: timeout after 2 minutes
  setTimeout(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
      stopSpinner();
      document.getElementById("result").textContent =
        "Timed out waiting for wallet. Please rescan or refresh.";
      M.toast?.({ html: "Polling timed out" });
    }
  }, 120000);
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("requestBtn");
  const qrDiv = document.getElementById("qr");

  btn.addEventListener("click", () => {
    qrDiv.innerHTML = "";
    try {
      new QRCode(qrDiv, {
        text: lcwRequestUrl,
        width: 256,
        height: 256,
        correctLevel: QRCode.CorrectLevel.L // capacity > H; avoids overflow
      });
    } catch (e) {
      console.warn("QR too long, showing link instead:", e);
      qrDiv.innerHTML =
        `<a href="${lcwRequestUrl}" target="_blank" rel="noopener">Open in Wallet</a>`;
    }

    startPolling();
  });
});
