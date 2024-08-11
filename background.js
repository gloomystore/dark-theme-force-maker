// This background script could be used to control when to inject the content script.
chrome.runtime.onInstalled.addListener(() => {
  console.log("Dark Mode Applier installed.");
});