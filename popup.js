const DEFAULTS = { enabled: true };

const REVIEW_URL = "https://addons.mozilla.org/en-CA/firefox/addon/continuity-linksinsametab/";
const DONATE_URL = "https://buymeacoffee.com/yuilix";
const GITHUB_URL = "https://github.com/LXRylex/Continuity-Links-In-Same-Tab/tree/main";

async function syncUI() {
  const { enabled } = await chrome.storage.sync.get(DEFAULTS);
  const t = document.getElementById("toggle");
  const statusText = document.getElementById("statusText");
  const hint = document.getElementById("hint");

  t.checked = !!enabled;
  statusText.textContent = enabled ? "ON (Same tab)" : "OFF (Normal tabs)";
  hint.textContent = enabled
    ? "New-tab navigation will be redirected into your current tab."
    : "Disabled. New tabs behave normally.";
}

async function openInCurrentTab(url) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.tabs.update(tab.id, { url, active: true });
  window.close();
}

document.addEventListener("DOMContentLoaded", async () => {
  await syncUI();

  document.getElementById("toggle").addEventListener("change", async (e) => {
    await chrome.storage.sync.set({ enabled: e.target.checked });
    await syncUI();
  });

  document.getElementById("btnReview").addEventListener("click", () => openInCurrentTab(REVIEW_URL));
  document.getElementById("btnDonate").addEventListener("click", () => openInCurrentTab(DONATE_URL));
  document.getElementById("btnGithub").addEventListener("click", () => openInCurrentTab(GITHUB_URL));
});
