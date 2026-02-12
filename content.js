function findAnchor(el) {
  while (el && el !== document.documentElement) {
    if (el.tagName === "A" && el.href) return el;
    el = el.parentElement;
  }
  return null;
}

function allowNext() {
  try {
    chrome.runtime.sendMessage({ type: "allow_next_new_tab" });
  } catch {}
}

document.addEventListener("mousedown", (e) => {
  if (!e || e.defaultPrevented) return;
  if (e.button !== 0) return;
  if (!(e.ctrlKey || e.metaKey)) return;

  const a = findAnchor(e.target);
  if (!a) return;

  allowNext();
}, true);

document.addEventListener("mousedown", (e) => {
  if (!e || e.defaultPrevented) return;
  if (e.button !== 1) return;

  const a = findAnchor(e.target);
  if (!a) return;

  allowNext();
}, true);
