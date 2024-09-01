// Listener for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'applyDarkMode') {
    applyDarkMode();
    sendResponse({ success: true });
  } else if (message.action === 'removeDarkMode') {
    removeDarkMode();
    sendResponse({ success: true });
  }
});

// Function to apply dark mode
function applyDarkMode() {
  // Create a <style> element to hold the dark mode styles
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

  // Apply dark mode to all elements
  applyDarkModeToElements(document);

  // Apply dark mode to elements within iframes and shadow roots
  handleIframesAndShadows(document);

  // Reapply dark mode after 500ms to catch dynamically loaded content
  // setTimeout(() => {
  //   applyDarkModeToElements(document);
  //   handleIframesAndShadows(document);
  // }, 500);

  // Observe DOM changes for infinite scroll content
  observeDomChanges();
}

// Function to observe DOM changes and apply dark mode to new elements
function observeDomChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            applyDarkModeToElements(node);
            handleIframesAndShadows(node);
          }
        });
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

// Function to apply dark mode to all elements
function applyDarkModeToElements(root) {
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

    // Handle background color or gradient
    if (bgImage.startsWith('linear-gradient')) {
      const gradientBrightness = parseGradient(bgImage);
      if (gradientBrightness > 0.45) {
        element.style.backgroundColor = '#121212';
        element.style.backgroundImage = 'linear-gradient(#121212, #121212)';
      }
    } else if (isLightColor(bgColor)) {
      element.style.backgroundColor = '#121212';
      element.style.color = '#e0e0e0';

      if (element.tagName === 'A') {
        element.style.color = '#bb86fc';
      }
    }

    if (isDarkColor(textColor)) {
      element.style.color = '#e0e0e0';
      if (element.tagName === 'A') {
        element.style.color = '#bb86fc';
      }
    }
    if (isDarkColor(borderTopColor)) {
      element.style.borderTopColor = '#e0e0e0';
    }
    if (isDarkColor(borderRightColor)) {
      element.style.borderRightColor = '#e0e0e0';
    }
    if (isDarkColor(borderBottomColor)) {
      element.style.borderBottomColor = '#e0e0e0';
    }
    if (isDarkColor(borderLeftColor)) {
      element.style.borderLeftColor = '#e0e0e0';
    }

    // Handle SVG elements
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
}

// Function to handle SVG elements specifically
function handleSvgElements(element) {
  if (element.hasAttribute('fill')) {
    element.setAttribute('fill', '#999');
  }

  if (element.hasAttribute('stroke')) {
    element.setAttribute('stroke', '#999');
  }
}

// Function to remove dark mode
function removeDarkMode() {
  const style = document.getElementById('dark-mode-styles');
  if (style) {
    style.remove();
  }

  resetColors(document);

  // Remove dark mode from iframes and shadow roots
  handleIframesAndShadows(document, true);
}

// Function to reset colors to default
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

// Function to handle iframes and shadow roots
function handleIframesAndShadows(root, remove = false) {
  // Process iframes
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
      console.error('Cross-Origin Error accessing iframe:', e);
    }
  });

  // Process shadow roots
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

// Function to check if a color is light
function isLightColor(color) {
  if (!color) return false;

  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(...rgb);
    return hsl[2] > 0.45; // Light color if lightness > 45%
  } else if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g).map(Number);
    const hsl = rgbToHsl(...rgb);
    return hsl[2] > 0.45;
  }

  return false;
}

// Function to check if a color is dark
function isDarkColor(color) {
  if (!color) return false;

  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    const hsl = rgbToHsl(...rgb);
    return hsl[2] < 0.6; // Dark color if lightness < 60%
  } else if (color.startsWith('rgb')) {
    const rgb = color.match(/\d+/g).map(Number);
    const hsl = rgbToHsl(...rgb);
    return hsl[2] < 0.6;
  }

  return false;
}

// Function to parse and calculate brightness of a gradient
function parseGradient(gradient) {
  // Use regex to extract colors from the gradient
  const colorRegex = /rgba?\(([^)]+)\)|#[0-9a-fA-F]{3,6}/g;
  let matches = gradient.match(colorRegex);
  
  if (!matches) return null;

  // Calculate the brightness of each color
  let totalLightness = 0;
  matches.forEach(color => {
    let rgb;
    if (color.startsWith('rgb')) {
      rgb = color.match(/\d+/g).map(Number);
    } else {
      rgb = hexToRgb(color);
    }
    let hsl = rgbToHsl(...rgb);
    totalLightness += hsl[2]; // Lightness
  });

  // Return the average brightness
  return totalLightness / matches.length;
}

// Function to convert hex color to RGB
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const bigint = parseInt(hex, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

// Function to convert RGB to HSL
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h, s;
  
  if (max === min) {
    h = s = 0; // achromatic
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

// Automatically apply dark mode on page load based on stored preference
chrome.storage.local.get(['darkModeEnabled'], (result) => {
  const darkModeEnabled = result.darkModeEnabled || false;
  if (darkModeEnabled) {
    applyDarkMode();
  } 
  // else {
  //   removeDarkMode();
  // }
});
