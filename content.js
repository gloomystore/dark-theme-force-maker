// popup.js로부터 메시지를 수신하는 리스너
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyDarkMode') {
    applyDarkMode();
    sendResponse({ success: true });
  } else if (message.action === 'removeDarkMode') {
    removeDarkMode();
    sendResponse({ success: true });
  }
});

// 다크 모드를 적용하는 함수
function applyDarkMode() {
  // 다크 모드 스타일을 담을 <style> 요소 생성
  const style = document.createElement('style');
  style.id = 'dark-mode-styles';
  style.textContent = `
    body {
      background-color: #121212 !important;
      color: #e0e0e0 !important;
    }
    * {
      &::before, &::after {
        color: inherit!important;
        background-color: inherit!important;
        border-color: inherit!important;
      }
    }
    /* Add more styles as needed */
  `;
  document.head.appendChild(style);

  // 모든 요소에 다크 모드 적용
  applyDarkModeToElements(document);

  // iframe과 shadow root 내 요소에 다크 모드 적용
  handleIframesAndShadows(document);

  // 500ms 후에 다이나믹하게 로드된 콘텐츠에 다시 다크 모드 적용
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    applyDarkModeToElements(document);
    handleIframesAndShadows(document);
  }, 500);

  // DOM 변경 감시
  observeDomChanges();
}


let timeout = null;

// DOM 변경을 감시하고 새로 추가된 요소에 다크 모드를 적용하는 함수
function observeDomChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            applyDarkModeToElements(node.parentElement);
            handleIframesAndShadows(node);
            // 500ms 후에 다이나믹하게 로드된 콘텐츠에 다시 다크 모드 적용
            // clearTimeout(timeout)
            // timeout = setTimeout(() => {
            //   applyDarkModeToElementsWithoutConfirmation(node);
            //   handleIframesAndShadows(node);
            // }, 500);
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// 모든 요소에 다크 모드를 적용하는 함수
function applyDarkModeToElements(root) {
  requestAnimationFrame(() => {
    const elements = root.querySelectorAll('*');
    elements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const bgColor = computedStyle.backgroundColor;
      const bgImage = computedStyle.backgroundImage;
      const textColor = computedStyle.color;

      const borderTopColor = computedStyle.borderTopColor;
      const borderRightColor = computedStyle.borderRightColor;
      const borderBottomColor = computedStyle.borderBottomColor;
      const borderLeftColor = computedStyle.borderLeftColor;

      if (bgImage.startsWith('linear-gradient')) {
        const gradientBrightness = parseGradient(bgImage);
        if (gradientBrightness > 0.45) {
          element.style.setProperty('background-color', '#333', 'important');
          element.style.setProperty('background-image', 'linear-gradient(#333, #333)', 'important');
        }
      } else if (isLightColor(bgColor)) {
        element.style.setProperty('background-color', '#333', 'important');
        element.style.setProperty('color', '#e0e0e0', 'important');

        if (element.tagName === 'A' || element.tagName === 'BUTTON') {
          element.style.setProperty('color', '#5288ff', 'important');
          element.style.setProperty('background-color', '#555', 'important');
        } else if (element.tagName === 'BODY') {
          element.style.setProperty('color', '#e0e0e0', 'important');
          element.style.setProperty('background-color', '#121212', 'important');
        } else if (element.tagName === 'ARTICLE') {
          element.style.setProperty('color', '#e0e0e0', 'important');
          element.style.setProperty('background-color', '#232323', 'important');
        } else if (element.tagName === 'INPUT' || element.tagName === 'LABEL') {
          element.style.setProperty('color', '#e0e0e0', 'important');
          element.style.setProperty('background-color', '#232323', 'important');
        } else {
          element.style.setProperty('color', '#e0e0e0', 'important');
          element.style.setProperty('background-color', '#222', 'important');
        }
      }

      if (isDarkColor(textColor)) {
        element.style.setProperty('color', '#e0e0e0', 'important');
        if (element.tagName === 'A') {
          element.style.setProperty('color', '#5288ff', 'important');
        }
      }
      if (isDarkColor(borderTopColor)) {
        element.style.setProperty('border-top-color', '#e0e0e0', 'important');
      }
      if (isDarkColor(borderRightColor)) {
        element.style.setProperty('border-right-color', '#e0e0e0', 'important');
      }
      if (isDarkColor(borderBottomColor)) {
        element.style.setProperty('border-bottom-color', '#e0e0e0', 'important');
      }
      if (isDarkColor(borderLeftColor)) {
        element.style.setProperty('border-left-color', '#e0e0e0', 'important');
      }

      // svg 변경
      if (element.tagName === 'svg' || 
          element.tagName === 'path' || 
          element.tagName === 'circle' || 
          element.tagName === 'ellipse' || 
          element.tagName === 'rect' || 
          element.tagName === 'line' || 
          element.tagName === 'polygon' || 
          element.tagName === 'polyline') {
        handleSvgElements(element);
      }
    });
  });
}

// SVG 요소를 다루는 함수
function handleSvgElements(element) {
  if (element.hasAttribute('fill')) {
    element.setAttribute('fill', '#999', 'important');
  }

  if (element.hasAttribute('stroke')) {
    element.setAttribute('stroke', '#999', 'important');
  }
}

// 다크모드 제거
function removeDarkMode() {
  const style = document.getElementById('dark-mode-styles');
  if (style) {
    style.remove();
  }

  resetColors(document);

  // iframe 다크모드 제거
  handleIframesAndShadows(document, true);
}

// 기본 모드로 리셋
function resetColors(root) {
  const elements = root.querySelectorAll('*');
  elements.forEach(element => {
    element.style.removeProperty('background-color');
    element.style.removeProperty('color');
    element.style.removeProperty('border-top-color');
    element.style.removeProperty('border-right-color');
    element.style.removeProperty('border-bottom-color');
    element.style.removeProperty('border-left-color');

    if (element.tagName === 'svg' || 
      element.tagName === 'path' || 
      element.tagName === 'circle' || 
      element.tagName === 'ellipse' || 
      element.tagName === 'rect' || 
      element.tagName === 'line' || 
      element.tagName === 'polygon' || 
      element.tagName === 'polyline') {
      if (element.getAttribute('fill') !== null) {
        element.setAttribute('fill', '#000');
      }
      if (element.getAttribute('stroke') !== null) {
        element.setAttribute('stroke', '#000');
      }
    }
  });
}

// iframe 및 shadow root를 처리하는 함수
function handleIframesAndShadows(root, remove = false) {
  // iframe 처리
  const iframes = root.querySelectorAll('iframe');
  iframes.forEach(iframe => {
    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        requestAnimationFrame(() => {
          if (remove) {
            resetColors(iframeDoc);
          } else {
            applyDarkModeToElements(iframeDoc);
          }
          handleIframesAndShadows(iframeDoc, remove);
        });
      }
    } catch (e) {
      console.error('Cross-Origin 에러로 인해 iframe 접근 불가:', e);
    }
  });

  // shadow root 처리
  const elements = root.querySelectorAll('*');
  elements.forEach(element => {
    if (element.shadowRoot) {
      requestAnimationFrame(() => {
        if (remove) {
          resetColors(element.shadowRoot);
        } else {
          applyDarkModeToElements(element.shadowRoot);
        }
        handleIframesAndShadows(element.shadowRoot, remove);
      });
    }
  });
}

// 색상이 밝은지 확인하는 함수
function isLightColor(color) {
  if (!color) return false;

  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(...rgb);
    return hsl[2] > 0.45; // 밝은 색상 여부를 lightness > 45%로 판별
  } else if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g).map(Number);
    const hsl = rgbToHsl(...rgb);
    return hsl[2] > 0.45;
  }

  return false;
}

// 색상이 어두운지 확인하는 함수
function isDarkColor(color) {
  if (!color) return false;

  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(...rgb);
    return hsl[2] < 0.45; // 어두운 색상 여부를 lightness < 60%로 판별
  } else if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g).map(Number);
    const hsl = rgbToHsl(...rgb);
    return hsl[2] < 0.45;
  }

  return false;
}

// 그라디언트의 밝기를 계산하는 함수
function parseGradient(gradient) {
  // 그라디언트에서 색상을 추출하는 정규식
  const colorRegex = /rgba?\(([^)]+)\)|#[0-9a-fA-F]{3,6}/g;
  let matches = gradient.match(colorRegex);
  
  if (!matches) return null;

  // 각 색상의 밝기를 계산
  let totalLightness = 0;
  matches.forEach(color => {
    let rgb;
    if (color.startsWith('rgb')) {
      rgb = color.match(/\d+/g).map(Number);
    } else {
      rgb = hexToRgb(color);
    }
    let hsl = rgbToHsl(...rgb);
    totalLightness += hsl[2]; // 밝기 값
  });

  // 평균 밝기를 반환
  return totalLightness / matches.length;
}

// 16진수 색상을 RGB로 변환하는 함수
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const bigint = parseInt(hex, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// RGB를 HSL로 변환하는 함수
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h, s;
  
  if (max === min) {
    h = s = 0; // 무채색
  } else {
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

// 저장된 선호도에 따라 페이지 로드 시 다크 모드 자동 적용
chrome.storage.local.get(['darkModeEnabled'], (result) => {
  const darkModeEnabled = result.darkModeEnabled || false;
  if (darkModeEnabled) {
    applyDarkMode();
  } 
  // else {
  //   removeDarkMode();
  // }
});
