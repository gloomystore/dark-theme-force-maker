// ==================================================
// Dark Theme Force Maker - Content Script
// Modes: Normal (direct style) / Ultra (class + style)
// ==================================================

const colorStyleMap = new Map();
const colorClassMap = new Map();
let timeout = null;
let activeObserver = null;

// 메시지 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyNormalMode') {
    removeDarkMode();
    applyNormalMode();
    sendResponse({ success: true });
  } else if (message.action === 'applyUltraMode') {
    removeDarkMode();
    applyUltraMode();
    sendResponse({ success: true });
  } else if (message.action === 'removeDarkMode') {
    removeDarkMode();
    sendResponse({ success: true });
  }
});

// ==================================================
// Normal Mode (inline style)
// ==================================================
function applyNormalMode() {
  injectBaseStyle();
  applyNormalToElements(document);
  handleIframesAndShadows(document, 'normal');
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyNormalToElements(document);
    handleIframesAndShadows(document, 'normal');
  }, 500);
  observeDomChanges('normal');
}

function applyNormalToElements(root) {
  if (!root) return;
  requestAnimationFrame(() => {
    const els = root.querySelectorAll('*');
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const cs = getComputedStyle(el);
      if (isLightColor(cs.backgroundColor)) {
        el.style.setProperty('background-color', '#222', 'important');
        el.style.setProperty('color', '#e0e0e0', 'important');
      }
      if (isDarkColor(cs.color)) {
        el.style.setProperty('color', '#e0e0e0', 'important');
      }
      if (isLightColor(cs.borderColor)) {
        el.style.setProperty('border-color', '#555', 'important');
      }
    }
  });
}

// ==================================================
// Ultra Mode (class + inline style)
// ==================================================
function applyUltraMode() {
  injectDarkModeStyle();
  applyUltraToElements(document);
  handleIframesAndShadows(document, 'ultra');
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyUltraToElements(document);
    handleIframesAndShadows(document, 'ultra');
  }, 500);
  observeDomChanges('ultra');
}

function applyUltraToElements(root) {
  if (!root) return;
  const els = root.querySelectorAll('*');
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    const cs = getComputedStyle(el);
    if (isLightColor(cs.backgroundColor)) {
      const tag = el.tagName.toLowerCase();
      el.classList.add(getOrAssignClass(tag, cs.backgroundColor));
      el.style.setProperty('background-color', '#222', 'important');
      el.style.setProperty('color', '#e0e0e0', 'important');
    }
    if (isDarkColor(cs.color)) {
      const tag = el.tagName.toLowerCase();
      el.classList.add(getOrAssignClass(tag, cs.color));
      el.style.setProperty('color', '#e0e0e0', 'important');
    }
    if (isLightColor(cs.borderColor)) {
      el.classList.add('gloomy-dark-border');
      el.style.setProperty('border-color', '#555', 'important');
    }
  }
}

// ==================================================
// Base style (Normal mode)
// ==================================================
function injectBaseStyle() {
  if (document.getElementById('dark-mode-styles')) return;
  const style = document.createElement('style');
  style.id = 'dark-mode-styles';
  style.textContent = `
    html, body { background-color: #121212 !important; color: #e0e0e0 !important; }
    img, video, canvas, svg { filter: brightness(0.9); }
    a:visited { color: #c080ff !important; }
  `;
  document.head.appendChild(style);
}

// ==================================================
// Full style sheet (Ultra mode)
// ==================================================
function injectDarkModeStyle() {
  if (document.getElementById('dark-mode-styles')) return;

  const purples = [
    '#0f0e0f','#1a171a','#242024','#2e292e','#383238',
    '#423b42','#4c444c','#564d56','#605660','#6a5f6a'
  ];
  const tags = [
    'html','body','div','span','section','article','button','a','label','input','pre','code',
    'table','tr','td','th','ul','li','nav','header','footer','main','aside','form','textarea',
    'select','option','img','p','h1','h2','h3','h4','h5','h6'
  ];

  let css = `
    html, body { background-color: #121212 !important; color: #e0e0e0 !important; }
    .gloomy-dark-border { border-color: #555 !important; }
    .gloomy-dark-svg { fill: #aaa !important; stroke: #aaa !important; }
    img, video, canvas, svg { filter: brightness(0.9); }
    *::before, *::after { background-color: inherit !important; color: inherit !important; border-color: inherit !important; }
    a:hover, button:hover, input:hover, select:hover, textarea:hover {
      background-color: #2e2b2e !important; color: #f0f0f0 !important; border-color: #7a6a8a !important; }
    a:active, button:active, input:active, select:active, textarea:active {
      background-color: #1d1a1d !important; color: #fff !important; border-color: #a080c0 !important; }
    a:focus, button:focus, input:focus, select:focus, textarea:focus,
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 2px solid #b38aff !important; outline-offset: 2px !important;
      background-color: #242024 !important; color: #fff !important; }
    button:disabled, input:disabled, select:disabled, textarea:disabled {
      background-color: #3a3a3a !important; color: #888 !important; border-color: #555 !important; cursor: not-allowed !important; }
    a:visited { color: #c080ff !important; }
  `;

  tags.forEach(tag => {
    purples.forEach((color, i) => {
      css += `.gloomy-dark-${tag}${i + 1}{background-color:${color}!important;color:#e0e0e0!important;border-color:#6a5a7a!important;}\n`;
    });
  });

  const style = document.createElement('style');
  style.id = 'dark-mode-styles';
  style.textContent = css;
  document.head.appendChild(style);
}

// ==================================================
// Remove
// ==================================================
function removeDarkMode() {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
  clearTimeout(timeout);

  const style = document.getElementById('dark-mode-styles');
  if (style) style.remove();

  document.querySelectorAll("[class*='gloomy-dark-']").forEach(el => {
    if (el.className && typeof el.className === 'string') {
      el.className = el.className.split(' ').filter(c => !c.startsWith('gloomy-dark-')).join(' ');
    }
  });

  document.querySelectorAll('*').forEach(el => {
    el.style.removeProperty('background-color');
    el.style.removeProperty('color');
    el.style.removeProperty('border-color');
  });

  colorClassMap.clear();
  colorStyleMap.clear();
}

// ==================================================
// Class mapping (Ultra)
// ==================================================
function getOrAssignClass(tag, color) {
  if (colorClassMap.has(color)) return colorClassMap.get(color);
  const idx = Math.floor(Math.random() * 10) + 1;
  const cls = `gloomy-dark-${tag}${idx}`;
  colorClassMap.set(color, cls);
  return cls;
}

// ==================================================
// iframe / Shadow DOM
// ==================================================
function handleIframesAndShadows(root, mode) {
  root.querySelectorAll('iframe').forEach(iframe => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc) {
        requestAnimationFrame(() => {
          if (mode === 'normal') applyNormalToElements(doc);
          else applyUltraToElements(doc);
          handleIframesAndShadows(doc, mode);
        });
      }
    } catch {}
  });
  root.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      requestAnimationFrame(() => {
        if (mode === 'normal') applyNormalToElements(el.shadowRoot);
        else applyUltraToElements(el.shadowRoot);
        handleIframesAndShadows(el.shadowRoot, mode);
      });
    }
  });
}

// ==================================================
// Color detection
// ==================================================
function isLightColor(color) {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return false;
  if (color.startsWith('rgb')) {
    const parts = color.match(/[\d.]+/g).map(Number);
    if (parts.length >= 4 && parts[3] < 0.1) return false;
    return rgbToHsl(parts[0], parts[1], parts[2])[2] > 0.45;
  }
  return false;
}

function isDarkColor(color) {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return false;
  if (color.startsWith('rgb')) {
    const parts = color.match(/[\d.]+/g).map(Number);
    if (parts.length >= 4 && parts[3] < 0.1) return false;
    return rgbToHsl(parts[0], parts[1], parts[2])[2] < 0.45;
  }
  return false;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

// ==================================================
// DOM mutation observer
// ==================================================
function observeDomChanges(mode) {
  if (activeObserver) activeObserver.disconnect();

  activeObserver = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (mode === 'normal') applyNormalToElements(node.parentElement);
        else applyUltraToElements(node.parentElement);
      });
    });
  });
  activeObserver.observe(document.body, { childList: true, subtree: true });
}

// ==================================================
// Auto-apply on page load
// ==================================================
chrome.storage.local.get(['darkMode', 'globalMode', 'excludeList', 'siteSettings'], (result) => {
  const globalMode = result.darkMode || 'off';
  const global = result.globalMode || false;
  const excludes = result.excludeList || [];
  const siteSettings = result.siteSettings || {};
  const domain = location.hostname;

  // Exclude list 체크
  const excluded = excludes.some(d => domain === d || domain.endsWith('.' + d));
  if (excluded) return;

  // 사이트별 설정 우선, 없으면 글로벌 설정 사용
  let mode = 'off';
  if (siteSettings[domain]) {
    mode = siteSettings[domain];
  } else if (global) {
    mode = globalMode;
  }

  if (mode === 'off') return;

  if (mode === 'normal') applyNormalMode();
  else if (mode === 'ultra') applyUltraMode();
});
