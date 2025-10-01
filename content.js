// popup.js 메시지 수신
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyDarkMode') {
    applyDarkMode();
    sendResponse({ success: true });
  } else if (message.action === 'removeDarkMode') {
    removeDarkMode();
    sendResponse({ success: true });
  }
});

let timeout = null;

// 다크모드 스타일 주입
function injectDarkModeStyle() {
  if (document.getElementById("dark-mode-styles")) return;

  const style = document.createElement("style");
  style.id = "dark-mode-styles";
  style.textContent = `
    body.gloomy-dark-body {
      background-color: #121212 !important;
      color: #e0e0e0 !important;
    }

    .gloomy-dark-article {
      background-color: #232323 !important;
      color: #e0e0e0 !important;
    }

    .gloomy-dark-input, .gloomy-dark-label {
      background-color: #232323 !important;
      color: #e0e0e0 !important;
    }

    .gloomy-dark-button, .gloomy-dark-link {
      background-color: #555 !important;
      color: #5288ff !important;
    }

    .gloomy-dark-default {
      background-color: #222 !important;
      color: #e0e0e0 !important;
    }

    .gloomy-dark-border {
      border-color: #e0e0e0 !important;
    }

    .gloomy-dark-svg {
      fill: #999 !important;
      stroke: #999 !important;
    }

    /* 🔹 모든 요소의 before/after 강제 다크모드 적용 */
    *::before, *::after {
      background-color: inherit !important;
      color: inherit !important;
      border-color: inherit !important;
    }
  `;
  document.head.appendChild(style);
}

// 다크 모드 적용
function applyDarkMode() {
  injectDarkModeStyle();

  applyDarkModeToElements(document);
  handleIframesAndShadows(document);

  clearTimeout(timeout);
  timeout = setTimeout(() => {
    applyDarkModeToElements(document);
    handleIframesAndShadows(document);
  }, 500);

  observeDomChanges();
}

// DOM 변경 감시
// DOM 변경 감시 (노드 추가 + 속성 변경까지 감시)
function observeDomChanges() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            applyDarkModeToElements(node.parentElement);
            handleIframesAndShadows(node);
          }
        });
      }

      // 🔹 class 속성이 변경된 경우
      if (mutation.type === "attributes" && mutation.attributeName === "class") {
        const el = mutation.target;
        // 다시 dark mode class 적용
        applyDarkModeToElements(el);
      }
    });
  });

  observer.observe(document.body, { 
    childList: true, 
    subtree: true, 
    attributes: true,     // 속성 변경 감시
    attributeFilter: ["class"] // class 변경만 감시
  });
}

// 모든 요소 다크모드 처리
function applyDarkModeToElements(root) {
  if (!root) return;
  requestAnimationFrame(() => {
    const elements = root.querySelectorAll('*');
    elements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const bgColor = computedStyle.backgroundColor;
      const textColor = computedStyle.color;

      // 배경이 밝고 투명도가 낮지 않으면 class 추가
      if (isLightColor(bgColor)) {
        if (element.tagName === 'BODY') {
          element.classList.add("gloomy-dark-body");
        } else if (element.tagName === 'ARTICLE') {
          element.classList.add("gloomy-dark-article");
        } else if (element.tagName === 'INPUT' || element.tagName === 'LABEL') {
          element.classList.add("gloomy-dark-input");
        } else if (element.tagName === 'A') {
          element.classList.add("gloomy-dark-link");
        } else if (element.tagName === 'BUTTON') {
          element.classList.add("gloomy-dark-button");
        } else {
          element.classList.add("gloomy-dark-default");
        }
      }

      // 텍스트 색이 어두우면 글자색 class
      if (isDarkColor(textColor)) {
        if (element.tagName === 'A') {
          element.classList.add("gloomy-dark-link");
        } else {
          element.classList.add("gloomy-dark-default");
        }
      }

      // 보더 처리
      const borders = [
        computedStyle.borderTopColor,
        computedStyle.borderRightColor,
        computedStyle.borderBottomColor,
        computedStyle.borderLeftColor
      ];
      if (borders.some(c => isDarkColor(c))) {
        element.classList.add("gloomy-dark-border");
      }

      // svg
      if (["svg","path","circle","ellipse","rect","line","polygon","polyline"].includes(element.tagName.toLowerCase())) {
        element.classList.add("gloomy-dark-svg");
      }
    });
  });
}

// 다크모드 제거
function removeDarkMode() {
  const style = document.getElementById("dark-mode-styles");
  if (style) style.remove();

  const all = document.querySelectorAll("[class*='gloomy-dark-']");
  all.forEach(el => {
    el.classList.remove(
      "gloomy-dark-body","gloomy-dark-article","gloomy-dark-input",
      "gloomy-dark-label","gloomy-dark-button","gloomy-dark-link",
      "gloomy-dark-default","gloomy-dark-border","gloomy-dark-svg"
    );
  });
}

// iframe / shadow 처리
function handleIframesAndShadows(root, remove = false) {
  const iframes = root.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        requestAnimationFrame(() => {
          if (remove) removeDarkMode();
          else applyDarkModeToElements(iframeDoc);
          handleIframesAndShadows(iframeDoc, remove);
        });
      }
    } catch (e) {
      console.warn("Cross-Origin iframe 접근 불가:", e);
    }
  });

  const elements = root.querySelectorAll('*');
  elements.forEach(element => {
    if (element.shadowRoot) {
      requestAnimationFrame(() => {
        if (remove) removeDarkMode();
        else applyDarkModeToElements(element.shadowRoot);
        handleIframesAndShadows(element.shadowRoot, remove);
      });
    }
  });
}

// 밝은 색 판별 (알파 포함)
function isLightColor(color) {
  if (!color) return false;
  if (color.startsWith("rgb")) {
    const parts = color.match(/[\d.]+/g).map(Number);
    let [r, g, b, a] = parts;
    if (a === undefined) a = 1;
    if (a < 0.1) return false; // 거의 투명 → 무시
    const hsl = rgbToHsl(r, g, b);
    const effectiveL = hsl[2] * a + 0.5 * (1 - a);
    return effectiveL > 0.45;
  }
  return false;
}

// 어두운 색 판별 (알파 포함)
function isDarkColor(color) {
  if (!color) return false;
  if (color.startsWith("rgb")) {
    const parts = color.match(/[\d.]+/g).map(Number);
    let [r, g, b, a] = parts;
    if (a === undefined) a = 1;
    if (a < 0.1) return false;
    const hsl = rgbToHsl(r, g, b);
    const effectiveL = hsl[2] * a + 0.5 * (1 - a);
    return effectiveL < 0.45;
  }
  return false;
}

// RGB→HSL 변환
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

// 자동 적용
chrome.storage.local.get(['darkModeEnabled'], (result) => {
  if (result.darkModeEnabled) applyDarkMode();
});

