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
    /* Add more styles as needed */
  `;
  document.head.appendChild(style);

  // Get all elements and adjust colors
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    const bgColor = getComputedStyle(element).backgroundColor;
    const textColor = getComputedStyle(element).color;
    const borderColor = getComputedStyle(element).borderColor;
    
    if (isLightColor(bgColor)) {
      element.style.backgroundColor = '#121212';
      element.style.color = '#e0e0e0';
      
      if (element.tagName === 'A') {
        element.style.color = '#bb86fc';
      }
    }
    if (isDarkColor(textColor)) {
      element.style.color = '#e0e0e0';
    }
    if (isDarkColor(borderColor)) {
      element.style.borderColor = '#e0e0e0';
    }
  });
}

// Function to remove dark mode
function removeDarkMode() {
  // Remove the dark mode styles
  const style = document.getElementById('dark-mode-styles');
  if (style) {
    style.remove();
  }

  // Reset colors to default
  const elements = document.querySelectorAll('*');
  elements.forEach(element => {
    element.style.backgroundColor = '';
    element.style.color = '';
    element.style.borderColor = '';
  });
}

// Function to check if a color is light
function isLightColor(color) {
  const rgb = color.match(/\d+/g);
  if (rgb) {
    const r = parseInt(rgb[0], 10);
    const g = parseInt(rgb[1], 10);
    const b = parseInt(rgb[2], 10);
    const hsl = rgbToHsl(r, g, b);
    return hsl[2] > 0.5; // Light color if lightness > 50%
  }
  return false;
}

// Function to check if a color is dark
function isDarkColor(color) {
  const rgb = color.match(/\d+/g);
  if (rgb) {
    const r = parseInt(rgb[0], 10);
    const g = parseInt(rgb[1], 10);
    const b = parseInt(rgb[2], 10);
    const hsl = rgbToHsl(r, g, b);
    return hsl[2] < 0.5; // Dark color if lightness < 50%
  }
  return false;
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
  } else {
    removeDarkMode();
  }
});
