const lastActiveTabByWindow = new Map();
const openerByNewTab = new Map();

const DEFAULTS = { enabled: true };

const allowNextFromOpener = new Map();

const allowedNewTabs = new Map();

const ALLOW_TTL_MS = 5000;

async function getEnabled() {
  const res = await chrome.storage.sync.get(DEFAULTS);
  return !!res.enabled;
}

function isSkippableUrl(url) {
  if (!url) return true;
  return (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("chrome-extension://")
  );
}

function cleanup(now = Date.now()) {
  for (const [k, exp] of allowNextFromOpener.entries()) {
    if (exp <= now) allowNextFromOpener.delete(k);
  }
  for (const [k, exp] of allowedNewTabs.entries()) {
    if (exp <= now) allowedNewTabs.delete(k);
  }
}

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || msg.type !== "allow_next_new_tab") return;

  const openerTabId = sender?.tab?.id;
  if (!openerTabId) return;

  cleanup();
  allowNextFromOpener.set(openerTabId, Date.now() + ALLOW_TTL_MS);
});

chrome.tabs.onActivated.addListener((info) => {
  lastActiveTabByWindow.set(info.windowId, info.tabId);
});

chrome.tabs.onCreated.addListener((tab) => {
  cleanup();

  const openerTabId = tab.openerTabId ?? null;

  if (openerTabId && allowNextFromOpener.has(openerTabId)) {
    allowNextFromOpener.delete(openerTabId);
    allowedNewTabs.set(tab.id, Date.now() + ALLOW_TTL_MS);
    return;
  }

  openerByNewTab.set(tab.id, {
    openerTabId,
    windowId: tab.windowId
  });
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  cleanup();

  if (allowedNewTabs.has(tabId)) return;

  if (!openerByNewTab.has(tabId)) return;

  const enabled = await getEnabled();
  if (!enabled) {
    openerByNewTab.delete(tabId);
    return;
  }

  const url = changeInfo.url || tab.url || tab.pendingUrl;
  if (isSkippableUrl(url)) return;

  const meta = openerByNewTab.get(tabId);
  openerByNewTab.delete(tabId);

  let targetTabId = meta.openerTabId || lastActiveTabByWindow.get(meta.windowId);
  if (!targetTabId) return;

  try { await chrome.tabs.update(targetTabId, { url, active: true }); } catch {}
  try { await chrome.tabs.remove(tabId); } catch {}
});
