// This background script could be used to control when to inject the content script.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Dark Mode Applier installed.");
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentDomain') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        try {
          const url = new URL(tabs[0].url);
          sendResponse({ domain: url.hostname, port: url.port });
        } catch {
          sendResponse({ domain: null, port: '' });
        }
      } else {
        sendResponse({ domain: null, port: '' });
      }
    });
    return true;
  }
});
