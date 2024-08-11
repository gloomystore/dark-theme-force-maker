document.addEventListener('DOMContentLoaded', () => {
  const applyButton = document.getElementById('apply-dark-mode');
  const status = document.getElementById('status');

  // Check the current state from local storage and update UI
  chrome.storage.local.get(['darkModeEnabled'], (result) => {
    const darkModeEnabled = result.darkModeEnabled || false;
    updateStatus(darkModeEnabled);
  });

  applyButton.addEventListener('click', () => {
    // Toggle dark mode state
    chrome.storage.local.get(['darkModeEnabled'], (result) => {
      const darkModeEnabled = result.darkModeEnabled || false;
      const newDarkModeEnabled = !darkModeEnabled;

      chrome.storage.local.set({ darkModeEnabled: newDarkModeEnabled }, () => {
        // Notify content script to apply or remove dark mode
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: newDarkModeEnabled ? 'applyDarkMode' : 'removeDarkMode' }, (response) => {
            if (response && response.success) {
              updateStatus(newDarkModeEnabled);
            } else {
              status.textContent = 'Failed to apply dark mode.';
            }
          });
        });
      });
    });
  });

  function updateStatus(isDarkMode) {
    status.textContent = isDarkMode ? 'Dark mode is enabled.' : 'Dark mode is disabled.';
    applyButton.textContent = isDarkMode ? 'Disable Dark Mode' : 'Enable Dark Mode';
  }
});
