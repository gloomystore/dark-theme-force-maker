function applyDarkMode() {
  // Get all stylesheets
  const stylesheets = Array.from(document.styleSheets);
  
  stylesheets.forEach(sheet => {
    try {
      const rules = Array.from(sheet.cssRules || []);
      rules.forEach(rule => {
        if (rule.style) {
          // Iterate through all the styles in the rule
          Array.from(rule.style).forEach(prop => {
            const value = rule.style.getPropertyValue(prop);
            if (isColor(value)) {
              const newColor = convertToDarkMode(value);
              rule.style.setProperty(prop, newColor);
            }
          });
        }
      });
    } catch (e) {
      console.error("Error processing stylesheet:", e);
    }
  });
}

function isColor(value) {
  // Simple regex to check if the value is a color
  return /^#[0-9A-Fa-f]{6}$/.test(value) || /^rgba?\(/.test(value) || /^hsla?\(/.test(value);
}

function convertToDarkMode(color) {
  // Simple color conversion logic
  // For simplicity, invert the color; this is just an example
  // You would need a more robust algorithm to handle various color formats and achieve better results
  if (color.startsWith('#')) {
    // Convert hex to RGB, invert, and convert back to hex
    const r = 255 - parseInt(color.slice(1, 3), 16);
    const g = 255 - parseInt(color.slice(3, 5), 16);
    const b = 255 - parseInt(color.slice(5, 7), 16);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  // Handle other color formats
  return color; // Return unchanged if not handled
}

// Apply dark mode when the content script is loaded
applyDarkMode();
