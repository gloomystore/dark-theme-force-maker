document.addEventListener('DOMContentLoaded', () => {
  const applyButton1 = document.getElementById('apply-dark-mode1'); // 일반 모드
  const applyButton2 = document.getElementById('apply-dark-mode2'); // 성능 모드
  const applyButton3 = document.getElementById('apply-dark-mode3'); // 직접 스타일 조작 모드
  const applyButton4 = document.getElementById('apply-dark-mode4'); // 울트라 모드
  const status = document.getElementById('status');
  const currentDomainElement = document.getElementById('current-domain');

  // 현재 도메인 표시
  chrome.runtime.sendMessage({ action: 'getCurrentDomain' }, (response) => {
    if (response && response.domain) {
      currentDomainElement.textContent = `Current domain: ${response.domain}`;
    } else {
      currentDomainElement.textContent = 'Could not retrieve domain.';
    }
  });

  // 초기 상태 체크
  chrome.storage.local.get(
    ['darkModeEnabled', 'darkModePerformance', 'darkModeDirect', 'darkModeUltra'],
    (result) => {
      updateStatus(
        result.darkModeEnabled || false,
        result.darkModePerformance || false,
        result.darkModeDirect || false,
        result.darkModeUltra || false
      );
    }
  );

  // 일반 다크모드 버튼
  applyButton1.addEventListener('click', () => {
    chrome.storage.local.get(['darkModeEnabled'], (result) => {
      const darkModeEnabled = result.darkModeEnabled || false;
      const newDarkModeEnabled = !darkModeEnabled;

      chrome.storage.local.set({
        darkModeEnabled: newDarkModeEnabled,
        darkModePerformance: false,
        darkModeDirect: false,
        darkModeUltra: false
      }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: newDarkModeEnabled ? 'applyDarkMode' : 'removeDarkMode' },
            (response) => {
              if (response && response.success) {
                updateStatus(newDarkModeEnabled, false, false, false);
              } else {
                status.textContent = 'Failed to apply dark mode. Please refresh the page (F5).';
              }
            }
          );
        });
      });
    });
  });

  // 성능 모드 버튼
  applyButton2.addEventListener('click', () => {
    chrome.storage.local.get(['darkModePerformance'], (result) => {
      const performanceEnabled = result.darkModePerformance || false;
      const newPerformanceEnabled = !performanceEnabled;

      chrome.storage.local.set({
        darkModeEnabled: false,
        darkModePerformance: newPerformanceEnabled,
        darkModeDirect: false,
        darkModeUltra: false
      }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: newPerformanceEnabled ? 'applyDarkModePerformance' : 'removeDarkMode' },
            (response) => {
              if (response && response.success) {
                updateStatus(false, newPerformanceEnabled, false, false);
              } else {
                status.textContent = 'Failed to apply performance dark mode. Please refresh the page (F5).';
              }
            }
          );
        });
      });
    });
  });

  // 직접 스타일 조작 모드 버튼
  applyButton3.addEventListener('click', () => {
    chrome.storage.local.get(['darkModeDirect'], (result) => {
      const directEnabled = result.darkModeDirect || false;
      const newDirectEnabled = !directEnabled;

      chrome.storage.local.set({
        darkModeEnabled: false,
        darkModePerformance: false,
        darkModeDirect: newDirectEnabled,
        darkModeUltra: false
      }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: newDirectEnabled ? 'applyDarkModeDirect' : 'removeDarkMode' },
            (response) => {
              if (response && response.success) {
                updateStatus(false, false, newDirectEnabled, false);
              } else {
                status.textContent = 'Failed to apply direct style dark mode. Please refresh the page (F5).';
              }
            }
          );
        });
      });
    });
  });

  // 울트라 모드 버튼
  applyButton4.addEventListener('click', () => {
    chrome.storage.local.get(['darkModeUltra'], (result) => {
      const ultraEnabled = result.darkModeUltra || false;
      const newUltraEnabled = !ultraEnabled;

      chrome.storage.local.set({
        darkModeEnabled: false,
        darkModePerformance: false,
        darkModeDirect: false,
        darkModeUltra: newUltraEnabled
      }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: newUltraEnabled ? 'applyDarkModeUltra' : 'removeDarkMode' },
            (response) => {
              if (response && response.success) {
                updateStatus(false, false, false, newUltraEnabled);
              } else {
                status.textContent = 'Failed to apply ultra dark mode. Please refresh the page (F5).';
              }
            }
          );
        });
      });
    });
  });

  // 상태 갱신
  function updateStatus(isDarkMode, isPerformanceMode, isDirectMode, isUltraMode) {
    if (isUltraMode) {
      status.textContent = 'Ultra Dark Mode is enabled.';
      applyButton1.textContent = 'Enable Dark Mode';
      applyButton2.textContent = 'Enable Performance Dark Mode';
      applyButton3.textContent = 'Enable Direct Dark Mode';
      applyButton4.textContent = 'Disable Ultra Dark Mode';

      applyButton1.disabled = true;
      applyButton2.disabled = true;
      applyButton3.disabled = true;
      applyButton4.disabled = false;

    } else if (isDirectMode) {
      status.textContent = 'Direct Style Dark Mode is enabled.';
      applyButton1.textContent = 'Enable Dark Mode';
      applyButton2.textContent = 'Enable Performance Dark Mode';
      applyButton3.textContent = 'Disable Direct Dark Mode';
      applyButton4.textContent = 'Enable Ultra Dark Mode';

      applyButton1.disabled = true;
      applyButton2.disabled = true;
      applyButton3.disabled = false;
      applyButton4.disabled = true;

    } else if (isPerformanceMode) {
      status.textContent = 'Performance Dark Mode is enabled.';
      applyButton1.textContent = 'Enable Dark Mode';
      applyButton2.textContent = 'Disable Performance Dark Mode';
      applyButton3.textContent = 'Enable Direct Dark Mode';
      applyButton4.textContent = 'Enable Ultra Dark Mode';

      applyButton1.disabled = true;
      applyButton2.disabled = false;
      applyButton3.disabled = true;
      applyButton4.disabled = true;

    } else if (isDarkMode) {
      status.textContent = 'Dark Mode is enabled.';
      applyButton1.textContent = 'Disable Dark Mode';
      applyButton2.textContent = 'Enable Performance Dark Mode';
      applyButton3.textContent = 'Enable Direct Dark Mode';
      applyButton4.textContent = 'Enable Ultra Dark Mode';

      applyButton1.disabled = false;
      applyButton2.disabled = true;
      applyButton3.disabled = true;
      applyButton4.disabled = true;

    } else {
      status.textContent = 'Dark Mode is disabled.';
      applyButton1.textContent = 'Enable Dark Mode';
      applyButton2.textContent = 'Enable Performance Dark Mode';
      applyButton3.textContent = 'Enable Direct Dark Mode';
      applyButton4.textContent = 'Enable Ultra Dark Mode';

      applyButton1.disabled = false;
      applyButton2.disabled = false;
      applyButton3.disabled = false;
      applyButton4.disabled = false;
    }
  }
});

