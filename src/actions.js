// actions.js
(function () {
  function highlight(el) {
    if (window.hljs && el) hljs.highlightElement(el);
  }

  function setResultJSON(obj) {
    const el = document.getElementById("result"); // <code id="result">
    if (!el) return;
    el.textContent = JSON.stringify(obj, null, 2);
    highlight(el);
  }

  function showActions(show) {
    const wrap = document.getElementById("actions");
    if (!wrap) return;
    wrap.style.display = show ? "flex" : "none";
  }

  function getCurrentJSONText() {
    const el = document.getElementById("result");
    return el ? el.textContent : "";
  }

  function toast(html) {
    // Materialize toast if available
    if (window.M?.toast) {
      M.toast({ html });
    } else {
      console.log("[toast]", html);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      toast("Copied JSON");
    } catch (e) {
      console.warn("execCommand copy failed:", e);
      toast("Copy failed");
    } finally {
      document.body.removeChild(ta);
    }
  }

  function copyJSONToClipboard(getJSON) {
    const json = (typeof getJSON === "function" && getJSON()) || getCurrentJSONText() || "";
    if (!json) return toast("Nothing to copy");
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(json).then(
        () => toast("Copied JSON"),
        (err) => {
          console.warn("Clipboard failed:", err);
          fallbackCopy(json);
        }
      );
    } else {
      fallbackCopy(json);
    }
  }

  function downloadJSON(getJSON) {
    const json = (typeof getJSON === "function" && getJSON()) || getCurrentJSONText() || "";
    if (!json) return toast("Nothing to download");
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const fname = `wallet-result-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Downloaded JSON");
  }

  function initActions(opts = {}) {
    const copyBtn = document.getElementById("copyBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const getJSON = opts.getJSON; // optional: () => string

    if (copyBtn) copyBtn.addEventListener("click", () => copyJSONToClipboard(getJSON));
    if (downloadBtn) downloadBtn.addEventListener("click", () => downloadJSON(getJSON));
  }

  function initZcapActions(opts = {}) {
    const zcapCopyBtn = document.getElementById("zcapCopyBtn");
    const zcapDownloadBtn = document.getElementById("zcapDownloadBtn");
    const getJSON = opts.getJSON; // optional: () => string

    if (zcapCopyBtn) zcapCopyBtn.addEventListener("click", () => copyJSONToClipboard(getJSON));
    if (zcapDownloadBtn) zcapDownloadBtn.addEventListener("click", () => downloadJSON(getJSON));
  }

  function showZcapActions(show) {
    const wrap = document.getElementById("zcapActions");
    if (!wrap) return;
    wrap.style.display = show ? "flex" : "none";
  }

  // expose a tiny API to main.js
  window.Actions = { initActions, setResultJSON, showActions, initZcapActions, showZcapActions };
})();
