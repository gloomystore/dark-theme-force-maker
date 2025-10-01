// popup.js 메시지 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyDarkMode') {
    applyDarkMode(); // 일반 모드
    sendResponse({ success: true });
  } else if (message.action === 'applyDarkModePerformance') {
    applyPerformanceDarkMode(); // 성능 모드
    sendResponse({ success: true });
  } else if (message.action === 'applyDarkModeDirect') {
    applyDirectDarkMode(); // 직접 스타일 조작 모드
    sendResponse({ success: true });
  } else if (message.action === 'applyDarkModeUltra') {
    applyUltraDarkMode(); // 울트라 모드
    sendResponse({ success: true });
  } else if (message.action === 'removeDarkMode') {
    removeDarkMode();
    sendResponse({ success: true });
  }
});

let timeout = null;

// ==================================================
// 1. 클래스 기반 다크모드 (스타일 시트 삽입)
// ==================================================
function injectDarkModeStyle() {
  if (document.getElementById("dark-mode-styles")) return;

  const purples = [
    "#0f0e0f", "#1a171a", "#242024", "#2e292e", "#383238",
    "#423b42", "#4c444c", "#564d56", "#605660", "#6a5f6a"
  ];
  const tags = [
    "html","body","div","span","section","article","button","a","label","input","pre","code",
    "table","tr","td","th","ul","li","nav","header","footer","main","aside",
    "form","textarea","select","option","img","p","h1","h2","h3","h4","h5","h6"
  ];

  let css = `
    .gloomy-dark-border { border-color: #e0e0e0 !important; }
    .gloomy-dark-svg { fill: #aaa !important; stroke: #aaa !important; }

    /* before/after 공통 */
    *::before, *::after {
      background-color: inherit !important;
      color: inherit !important;
      border-color: inherit !important;
    }

    /* Hover (링크, 버튼, form 요소 위주) */
    a:hover, button:hover, input:hover, select:hover, textarea:hover {
      background-color: #2e2b2e !important;
      color: #f0f0f0 !important;
      border-color: #7a6a8a !important;
    }

    /* Active (클릭되는 요소) */
    a:active, button:active, input:active, select:active, textarea:active {
      background-color: #1d1a1d !important;
      color: #ffffff !important;
      border-color: #a080c0 !important;
    }

    /* Focus (form 입력 요소 + 버튼 + 링크) */
    a:focus, button:focus, input:focus, select:focus, textarea:focus,
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 2px solid #b38aff !important;
      outline-offset: 2px !important;
      background-color: #242024 !important;
      color: #ffffff !important;
    }

    /* Disabled (form 요소 + 버튼) */
    button:disabled, input:disabled, select:disabled, textarea:disabled {
      background-color: #3a3a3a !important;
      color: #888 !important;
      border-color: #555 !important;
      cursor: not-allowed !important;
    }

    /* 방문한 링크 */
    a:visited {
      color: #c080ff !important;
    }
  `;

  tags.forEach(tag => {
    purples.forEach((color, i) => {
      css += `
        .gloomy-dark-${tag}${i+1} {
          background-color:${color}!important;
          color:#e0e0e0!important;
          border-color:#6a5a7a!important;
        }
      `;
    });
  });

  const style = document.createElement("style");
  style.id = "dark-mode-styles";
  style.textContent = css;
  document.head.appendChild(style);
}

// ==================================================
// 2. 일반 다크모드 (빠른 batch)
// ==================================================
let lastApplyTimeFast = 0, applyScheduledFast = false;

function applyDarkMode() {
  injectDarkModeStyle();
  applyDarkModeToElements(document);
  handleIframesAndShadows(document);

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyDarkModeToElements(document);
    handleIframesAndShadows(document);
  }, 500);

  observeDomChanges("fast");
}

function applyDarkModeToElements(root) {
  if (!root) return;
  const now = Date.now();
  if (lastApplyTimeFast && now - lastApplyTimeFast < 50) {
    if (!applyScheduledFast) {
      applyScheduledFast = true;
      setTimeout(() => {
        applyScheduledFast = false;
        applyDarkModeToElements(root);
      }, 50);
    }
    return;
  }
  lastApplyTimeFast = now;

  const elements = root.querySelectorAll('*');
  let index = 0;
  function batch() {
    const end = Math.min(index + 500, elements.length);
    for (; index < end; index++) processElement(elements[index]);
    if (index < elements.length) setTimeout(batch, 10);
  }
  batch();
}

// ==================================================
// 3. 성능 모드 다크모드 (느린 batch)
// ==================================================
let lastApplyTime = 0, applyScheduled = false;

function applyPerformanceDarkMode() {
  injectDarkModeStyle();
  applyThrottleDarkModeToElements(document);
  handleIframesAndShadows(document);

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyThrottleDarkModeToElements(document);
    handleIframesAndShadows(document);
  }, 500);

  observeDomChanges("slow");
}

function applyThrottleDarkModeToElements(root) {
  if (!root) return;
  const now = Date.now();
  if (lastApplyTime && now - lastApplyTime < 500) {
    if (!applyScheduled) {
      applyScheduled = true;
      setTimeout(() => {
        applyScheduled = false;
        applyThrottleDarkModeToElements(root);
      }, 500);
    }
    return;
  }
  lastApplyTime = now;

  const elements = root.querySelectorAll('*');
  let index = 0;
  function batch() {
    const end = Math.min(index + 50, elements.length);
    for (; index < end; index++) processElement(elements[index]);
    if (index < elements.length) setTimeout(batch, 200);
  }
  batch();
}

// ==================================================
// 4. 직접 스타일 조작 모드
// ==================================================
function applyDirectDarkMode() {
  const style = document.createElement('style');
  style.id = 'dark-mode-styles';
  style.textContent = `body { background-color:#121212!important; color:#e0e0e0!important; }`;
  document.head.appendChild(style);

  applyDirectDarkModeToElements(document);
  handleIframesAndShadows(document);

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyDirectDarkModeToElements(document);
    handleIframesAndShadows(document);
  }, 500);

  observeDomChanges("direct");
}

function applyDirectDarkModeToElements(root) {
  if (!root) return;
  requestAnimationFrame(() => {
    const elements = root.querySelectorAll('*');
    elements.forEach(el => {
      const cs = getComputedStyle(el);
      if (isLightColor(cs.backgroundColor)) {
        el.style.setProperty("background-color", "#222", "important");
        el.style.setProperty("color", "#e0e0e0", "important");
      }
      if (isDarkColor(cs.color)) {
        el.style.setProperty("color", "#e0e0e0", "important");
      }
    });
  });
}

// ==================================================
// 5. 울트라 모드 (클래스 + 직접 스타일 동시 적용)
// ==================================================
function applyUltraDarkMode() {
  injectDarkModeStyle();
  applyUltraDarkModeToElements(document);
  handleIframesAndShadows(document);

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyUltraDarkModeToElements(document);
    handleIframesAndShadows(document);
  }, 500);

  observeDomChanges("ultra");
}

function applyUltraDarkModeToElements(root) {
  if (!root) return;
  const elements = root.querySelectorAll('*');
  elements.forEach(el => {
    const cs = getComputedStyle(el);
    if (isLightColor(cs.backgroundColor)) {
      const tag = el.tagName.toLowerCase();
      const randIdx = Math.floor(Math.random() * 10) + 1;
      el.classList.add(`gloomy-dark-${tag}${randIdx}`);
      el.style.setProperty("background-color", "#222"); // important ❌
      el.style.setProperty("color", "#e0e0e0");
    }
    if (isDarkColor(cs.color)) {
      const tag = el.tagName.toLowerCase();
      el.classList.add(`gloomy-dark-${tag}1`);
      el.style.setProperty("color", "#e0e0e0");
    }
  });
}

// ==================================================
// 공통 처리 함수
// ==================================================
function processElement(element) {
  const cs = getComputedStyle(element);
  if (isLightColor(cs.backgroundColor)) {
    const tag = element.tagName.toLowerCase();
    const randIdx = Math.floor(Math.random() * 10) + 1;
    element.classList.add(`gloomy-dark-${tag}${randIdx}`);
  }
  if (isDarkColor(cs.color)) {
    const tag = element.tagName.toLowerCase();
    element.classList.add(`gloomy-dark-${tag}1`);
  }
}

// ==================================================
// 다크모드 제거
// ==================================================
function removeDarkMode() {
  const style = document.getElementById("dark-mode-styles");
  if (style) style.remove();
  document.querySelectorAll("[class*='gloomy-dark-']").forEach(el => {
    if (el.className && typeof el.className === "string") {
      el.className = el.className.split(" ").filter(c => !c.startsWith("gloomy-dark-")).join(" ");
    }
  });
  document.querySelectorAll('*').forEach(el => {
    el.style.removeProperty("background-color");
    el.style.removeProperty("color");
    el.style.removeProperty("border-color");
  });
}

// ==================================================
// iframe / shadow 처리
// ==================================================
function handleIframesAndShadows(root, remove = false) {
  root.querySelectorAll("iframe").forEach(iframe => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc) {
        requestAnimationFrame(() => {
          if (remove) removeDarkMode(); else applyDarkModeToElements(doc);
          handleIframesAndShadows(doc, remove);
        });
      }
    } catch {}
  });
  root.querySelectorAll('*').forEach(el => {
    if (el.shadowRoot) {
      requestAnimationFrame(() => {
        if (remove) removeDarkMode(); else applyDarkModeToElements(el.shadowRoot);
        handleIframesAndShadows(el.shadowRoot, remove);
      });
    }
  });
}

// ==================================================
// 색 판별 함수
// ==================================================
function isLightColor(color) {
  if (!color) return false;
  if (color.startsWith("rgb")) {
    const parts = color.match(/[\d.]+/g).map(Number);
    return rgbToHsl(...parts.slice(0,3))[2] > 0.45;
  }
  return false;
}
function isDarkColor(color) {
  if (!color) return false;
  if (color.startsWith("rgb")) {
    const parts = color.match(/[\d.]+/g).map(Number);
    return rgbToHsl(...parts.slice(0,3))[2] < 0.45;
  }
  return false;
}
function rgbToHsl(r,g,b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}
  else{
    const d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;}
    h/=6;
  }
  return [h,s,l];
}

// ==================================================
// DOM 변경 감시
// ==================================================
function observeDomChanges(mode) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (mode === "fast") applyDarkModeToElements(node.parentElement);
        else if (mode === "slow") applyThrottleDarkModeToElements(node.parentElement);
        else if (mode === "direct") applyDirectDarkModeToElements(node.parentElement);
        else if (mode === "ultra") applyUltraDarkModeToElements(node.parentElement);
      });
    });
  });
  observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:["class"] });
}

// ==================================================
// 자동 적용 (이전 상태 유지)
// ==================================================
chrome.storage.local.get(['darkModeEnabled','darkModePerformance','darkModeDirect','darkModeUltra'], (result) => {
  if (result.darkModeEnabled) applyDarkMode();
  if (result.darkModePerformance) applyPerformanceDarkMode();
  if (result.darkModeDirect) applyDirectDarkMode();
  if (result.darkModeUltra) applyUltraDarkMode();
});

