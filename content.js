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
  const style = document.createElement('style');
  style.id = 'dark-mode-styles';
  style.innerHTML = `
    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center, dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend, table, caption,
    tbody, tfoot, thead, tr, th, td, article, aside,
    canvas, details, embed, figure, figcaption, footer,
    header, hgroup, menu, nav, output, ruby, section,
    summary, time, mark, audio, video {
      background-color: #333 !important;
      color: #eee !important;
    }

    a {
      color: #bb86fc !important;
      * {
        color: #bb86fc !important;
      }
    }
  `;
  
  // Append the style element to the document's body
  document.body.appendChild(style);

  // Apply dark mode to elements with borders
  applyDarkModeToBorders(document);

  // Apply dark mode to iframes and shadow DOMs
  handleIframesAndShadows(document);
}

// Function to apply dark mode to elements with border-color
function applyDarkModeToBorders(root) {
  const elements = root.querySelectorAll('*');
  elements.forEach(element => {
    const computedStyle = getComputedStyle(element);
    
    // Check border-color for all sides
    const borderTopColor = computedStyle.borderTopColor;
    const borderRightColor = computedStyle.borderRightColor;
    const borderBottomColor = computedStyle.borderBottomColor;
    const borderLeftColor = computedStyle.borderLeftColor;

    // Apply dark mode colors if any border color is present
    if (borderTopColor && borderTopColor !== 'rgba(0, 0, 0, 0)') {
      element.style.setProperty('border-top-color', '#888', 'important');
    }
    if (borderRightColor && borderRightColor !== 'rgba(0, 0, 0, 0)') {
      element.style.setProperty('border-right-color', '#888', 'important');
    }
    if (borderBottomColor && borderBottomColor !== 'rgba(0, 0, 0, 0)') {
      element.style.setProperty('border-bottom-color', '#888', 'important');
    }
    if (borderLeftColor && borderLeftColor !== 'rgba(0, 0, 0, 0)') {
      element.style.setProperty('border-left-color', '#888', 'important');
    }
  });
}

// Function to remove dark mode
function removeDarkMode() {
  const style = document.getElementById('dark-mode-styles');
  if (style) {
    style.remove();
  }

  // Reset styles in iframes and shadow DOMs
  handleIframesAndShadows(document, true);
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
            const style = iframeDoc.getElementById('dark-mode-styles');
            if (style) style.remove();
          } else {
            applyDarkModeToDocument(iframeDoc);
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
          const style = element.shadowRoot.getElementById('dark-mode-styles');
          if (style) style.remove();
        } else {
          applyDarkModeToDocument(element.shadowRoot);
        }
        handleIframesAndShadows(element.shadowRoot, remove);
      });
    }
  });
}

// Function to apply dark mode to a document
function applyDarkModeToDocument(doc) {
  const style = doc.createElement('style');
  style.id = 'dark-mode-styles';
  style.innerHTML = `
    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center, dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend, table, caption,
    tbody, tfoot, thead, tr, th, td, article, aside,
    canvas, details, embed, figure, figcaption, footer,
    header, hgroup, menu, nav, output, ruby, section,
    summary, time, mark, audio, video {
      background-color: #333 !important;
      color: #eee !important;
    }

    a {
      color: #bb86fc !important;
      * {
        color: #bb86fc !important;
      }
    }
  `;
  doc.body.appendChild(style);

  // Apply dark mode to elements with borders
  applyDarkModeToBorders(doc);
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
