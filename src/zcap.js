function buildZcapRequest(controllerDid, targetUrl) {
  return {
    "credentialRequestOrigin": APP_URL,
    "verifiablePresentationRequest": {
      "interact": {
        "type": "UnmediatedHttpPresentationService2021",
        "serviceEndpoint": exchangeUrl
      },
      "query": [
        {
          "type": "ZcapQuery",
          "capabilityQuery": {
            "reason": "Example App is requesting the permission to read and write to the Verifiable Credentials collection.",
            "allowedAction": ["GET", "PUT", "POST"],
            "controller": controllerDid,
            "invocationTarget": targetUrl
          }
        },
        {
          "type": "ZcapQuery",
          "capabilityQuery": {
            "reason": "Example App is requesting the permission to read and write to the Documents (VC Evidence) collections.",
            "allowedAction": ["GET", "PUT", "POST"],
            "controller": controllerDid,
            "invocationTarget": targetUrl
          }
        },
        {
          "type": "DIDAuthentication",
          "acceptedMethods": [{"method": "key"}]
        }
      ]
    }
  };
}

function initZcapRequest() {
  const zcapBtn = document.getElementById("zcapBtn");
  const zcapQrDiv = document.getElementById("zcapQr");
  const zcapQrTextPre = document.getElementById("zcapQrText");
  const controllerDidInput = document.getElementById("controllerDid");
  const targetUrlInput = document.getElementById("targetUrl");

  if (zcapBtn) {
    zcapBtn.addEventListener("click", () => {
      const controllerDid = controllerDidInput.value || "did:example:12345";
      const targetUrl = targetUrlInput.value || "https://example.com/api/endpoint";
      
      const zcapRequest = buildZcapRequest(controllerDid, targetUrl);
      const encodedZcapRequest = encodeURI(JSON.stringify(zcapRequest));
      const lcwZcapRequestUrl = `${WALLET_DEEP_LINK}?request=${encodedZcapRequest}`;

      zcapQrDiv.innerHTML = "";
      try {
        new QRCode(zcapQrDiv, {
          text: lcwZcapRequestUrl,
          width: 256,
          height: 256,
          correctLevel: QRCode.CorrectLevel.L
        });
      } catch (e) {
        console.warn("QR too long, showing link instead:", e);
        zcapQrDiv.innerHTML = `<a href="${lcwZcapRequestUrl}" target="_blank" rel="noopener">Open in Wallet</a>`;
      }

      zcapQrTextPre.textContent = `Wallet deep link:\n${lcwZcapRequestUrl}\n\nDecoded request JSON:`;
      const code = document.createElement("code");
      code.className = "language-json";
      code.textContent = JSON.stringify(zcapRequest, null, 2);
      zcapQrTextPre.appendChild(document.createElement("br"));
      zcapQrTextPre.appendChild(code);
      highlight(code);

      startZcapPolling();
    });
  }
}

function startZcapPolling() {
  if (pollInterval) return;
  const zcapSpinner = document.getElementById("zcapSpinner");
  const zcapResult = document.getElementById("zcapResult");
  
  show(zcapSpinner);

  pollInterval = setInterval(async () => {
    await pollOnce((obj) => {
      clearInterval(pollInterval);
      pollInterval = null;
      hide(zcapSpinner);

      window.latestPayload = obj;
      
      if (zcapResult) {
        zcapResult.textContent = JSON.stringify(obj, null, 2);
        highlight(zcapResult);
      }
      
      Actions.showZcapActions(true);
      
      if (window.M?.toast) {
        M.toast({ html: "zCap request successful!" });
      }
    });
  }, 3000);

  setTimeout(() => {
    if (!pollInterval) return;
    clearInterval(pollInterval);
    pollInterval = null;
    hide(zcapSpinner);

    if (zcapResult) {
      zcapResult.textContent = "Timed out waiting for wallet. Please rescan or refresh.";
      highlight(zcapResult);
    }
    
    Actions.showZcapActions(false);
    
    if (window.M?.toast) {
      M.toast({ html: "zCap request timed out" });
    }
  }, 120000);
}
