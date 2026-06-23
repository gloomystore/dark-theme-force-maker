// ==================================================
// Dark Theme Force Maker - Content Script
// Modes: Normal / Ultra / PDF (color invert)
// ==================================================

const colorStyleMap = new Map();
const colorClassMap = new Map();
let timeout = null;
let activeObserver = null;
let liteMode = false;
let observerThrottleTimer = null;
let pendingMutationNodes = [];

function isPdfPage() {
  return document.contentType === 'application/pdf' ||
    /\.pdf(\?[^#]*)?$/i.test(window.location.pathname);
}

// 와일드카드/도메인/도메인+포트 모두 지원하는 exclude 매칭
function matchesExclude(entry, hostname, port) {
  const pattern = typeof entry === 'string' ? entry : entry.pattern;
  const type = typeof entry === 'string' ? 'domain' : entry.type;

  if (type === 'wildcard') {
    const base = pattern.replace(/^\*\./, '');
    return hostname === base || hostname.endsWith('.' + base);
  }
  if (type === 'domain-port') {
    const colonIdx = pattern.lastIndexOf(':');
    if (colonIdx === -1) return false;
    const pHost = pattern.slice(0, colonIdx);
    const pPort = pattern.slice(colonIdx + 1);
    return hostname === pHost && port === pPort;
  }
  // 'domain' (기본값, 하위 호환)
  return hostname === pattern || hostname.endsWith('.' + pattern);
}

// 메시지 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyNormalMode') {
    removeDarkMode();
    if (isPdfPage()) applyPdfInvertMode();
    else applyNormalMode();
    sendResponse({ success: true });
  } else if (message.action === 'applyUltraMode') {
    removeDarkMode();
    if (isPdfPage()) applyPdfInvertMode();
    else applyUltraMode();
    sendResponse({ success: true });
  } else if (message.action === 'removeDarkMode') {
    removeDarkMode();
    sendResponse({ success: true });
  } else if (message.action === 'setLiteMode') {
    liteMode = message.value;
    sendResponse({ success: true });
  }
});

// ==================================================
// PDF Invert Mode — backdrop-filter로 컴포지터 레벨 색반전
//
// embed에 filter 스타일을 직접 넣어도 Chrome 네이티브 PDF 렌더러는 무시함.
// backdrop-filter는 컴포지터가 이미 렌더링한 픽셀에 후처리로 적용되므로
// div(Chrome) / object(Edge) / embed 방식 모두 커버 가능.
// ==================================================
function applyPdfInvertMode() {
  if (document.getElementById('dark-mode-pdf-overlay')) return;

  // 페이지 배경색 설정 (툴바 여백 등)
  const style = document.createElement('style');
  style.id = 'dark-mode-styles';
  style.textContent = `html { background: #000 !important; }`;
  (document.head || document.documentElement).appendChild(style);

  // 전체 뷰포트를 덮는 투명 오버레이에 backdrop-filter 적용
  const overlay = document.createElement('div');
  overlay.id = 'dark-mode-pdf-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;' +
    'backdrop-filter:invert(1) hue-rotate(180deg);' +
    '-webkit-backdrop-filter:invert(1) hue-rotate(180deg);' +
    'pointer-events:none;z-index:2147483647;';
  (document.body || document.documentElement).appendChild(overlay);
}

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
      if (isGradientLight(cs.backgroundImage)) {
        el.style.setProperty('background-image', darkifyGradient(cs.backgroundImage), 'important');
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
  const apply = () => {
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
      if (isGradientLight(cs.backgroundImage)) {
        el.style.setProperty('background-image', darkifyGradient(cs.backgroundImage), 'important');
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
  };
  if (liteMode) requestAnimationFrame(apply);
  else apply();
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

  const pdfOverlay = document.getElementById('dark-mode-pdf-overlay');
  if (pdfOverlay) pdfOverlay.remove();

  document.querySelectorAll("[class*='gloomy-dark-']").forEach(el => {
    if (el.className && typeof el.className === 'string') {
      el.className = el.className.split(' ').filter(c => !c.startsWith('gloomy-dark-')).join(' ');
    }
  });

  document.querySelectorAll('*').forEach(el => {
    el.style.removeProperty('background-color');
    el.style.removeProperty('background-image');
    el.style.removeProperty('color');
    el.style.removeProperty('border-color');
    el.style.removeProperty('filter');
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

function isGradientLight(backgroundImage) {
  if (!backgroundImage || backgroundImage === 'none') return false;
  if (!backgroundImage.includes('gradient')) return false;
  const colors = backgroundImage.match(/rgba?\([\d.,\s]+\)/g);
  if (!colors) return false;
  return colors.some(c => isLightColor(c));
}

function darkifyGradient(backgroundImage) {
  return backgroundImage.replace(/rgba?\([\d.,\s]+\)/g, (match) => {
    const parts = match.match(/[\d.]+/g).map(Number);
    if (parts.length >= 4 && parts[3] < 0.1) return match;
    const [h, s, l] = rgbToHsl(parts[0], parts[1], parts[2]);
    if (l <= 0.45) return match;
    const newL = 0.08 + (1.0 - l) * 0.18;
    const newS = Math.min(s * 0.6, 0.35);
    const [nr, ng, nb] = hslToRgb(h, newS, newL);
    if (parts.length >= 4) {
      return `rgba(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)}, ${parts[3]})`;
    }
    return `rgb(${Math.round(nr)}, ${Math.round(ng)}, ${Math.round(nb)})`;
  });
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3) * 255, hue2rgb(p, q, h) * 255, hue2rgb(p, q, h - 1 / 3) * 255];
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
    const added = [];
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType === 1) added.push(node);
      });
    });
    if (!added.length) return;

    if (liteMode) {
      pendingMutationNodes.push(...added);
      if (!observerThrottleTimer) {
        observerThrottleTimer = setTimeout(() => {
          const nodes = pendingMutationNodes.splice(0);
          observerThrottleTimer = null;
          requestAnimationFrame(() => {
            nodes.forEach(node => {
              if (!document.contains(node)) return;
              if (mode === 'normal') applyNormalToElements(node);
              else applyUltraToElements(node);
            });
          });
        }, 200);
      }
    } else {
      added.forEach(node => {
        if (mode === 'normal') applyNormalToElements(node.parentElement);
        else applyUltraToElements(node.parentElement);
      });
    }
  });
  activeObserver.observe(document.body, { childList: true, subtree: true });
}

// ==================================================
// Auto-apply on page load
// ==================================================
chrome.storage.local.get(['darkMode', 'globalMode', 'excludeList', 'siteSettings', 'liteMode'], (result) => {
  liteMode = result.liteMode || false;
  const globalMode = result.darkMode || 'off';
  const global = result.globalMode || false;
  const excludes = result.excludeList || [];
  const siteSettings = result.siteSettings || {};
  const hostname = location.hostname;
  const port = location.port;

  const excluded = excludes.some(e => matchesExclude(e, hostname, port));
  if (excluded) return;

  let mode = 'off';
  if (siteSettings[hostname]) {
    mode = siteSettings[hostname];
  } else if (global) {
    mode = globalMode;
  }

  if (mode === 'off') return;

  if (isPdfPage()) {
    applyPdfInvertMode();
  } else if (mode === 'normal') {
    applyNormalMode();
  } else if (mode === 'ultra') {
    applyUltraMode();
  }
});
