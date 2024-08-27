// This background script could be used to control when to inject the content script.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Dark Mode Applier installed.");
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCurrentDomain') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        const url = new URL(tabs[0].url);
        sendResponse({ domain: url.hostname });
      } else {
        sendResponse({ domain: null });
      }
    });
    return true;  // Indicates that the response is sent asynchronously
  }
});