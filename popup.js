document.addEventListener('DOMContentLoaded', () => {
  const btnNormal = document.getElementById('btn-normal');
  const btnUltra = document.getElementById('btn-ultra');
  const chkGlobal = document.getElementById('chk-global');
  const status = document.getElementById('status');
  const domainEl = document.getElementById('current-domain');
  const excludeList = document.getElementById('exclude-list');
  const excludeInput = document.getElementById('exclude-input');
  const btnAddExclude = document.getElementById('btn-add-exclude');
  const btnExcludeCurrent = document.getElementById('btn-exclude-current');

  let currentDomain = '';

  // 현재 도메인 가져오기
  chrome.runtime.sendMessage({ action: 'getCurrentDomain' }, (response) => {
    if (response && response.domain) {
      currentDomain = response.domain;
      domainEl.textContent = currentDomain;
    } else {
      domainEl.textContent = 'Unknown';
    }
    loadState();
  });

  function loadState() {
    chrome.storage.local.get(['darkMode', 'globalMode', 'excludeList', 'siteSettings'], (result) => {
      const globalMode = result.darkMode || 'off';
      const global = result.globalMode || false;
      const excludes = result.excludeList || [];
      const siteSettings = result.siteSettings || {};

      // 현재 사이트의 모드 결정: 사이트별 설정 > 글로벌 설정
      let mode;
      if (currentDomain && siteSettings[currentDomain]) {
        mode = siteSettings[currentDomain];
      } else if (global) {
        mode = globalMode;
      } else {
        mode = 'off';
      }

      chkGlobal.checked = global;
      renderExcludeList(excludes);
      updateButtons(mode, global, excludes);
    });
  }

  function isExcluded(excludes) {
    return excludes.some(d => currentDomain === d || currentDomain.endsWith('.' + d));
  }

  function updateButtons(mode, global, excludes) {
    const excluded = isExcluded(excludes);

    if (excluded) {
      btnNormal.textContent = 'Excluded';
      btnUltra.textContent = 'Excluded';
      btnNormal.disabled = true;
      btnUltra.disabled = true;
      btnNormal.classList.remove('active');
      btnUltra.classList.remove('active');
      status.textContent = 'This site is in the exclude list.';
      return;
    }

    btnNormal.disabled = false;
    btnUltra.disabled = false;

    if (mode === 'normal') {
      btnNormal.textContent = 'Disable Normal Mode';
      btnNormal.classList.add('active');
      btnUltra.textContent = 'Enable Ultra Mode';
      btnUltra.classList.remove('active');
      status.textContent = 'Normal Dark Mode enabled.';
    } else if (mode === 'ultra') {
      btnNormal.textContent = 'Enable Normal Mode';
      btnNormal.classList.remove('active');
      btnUltra.textContent = 'Disable Ultra Mode';
      btnUltra.classList.add('active');
      status.textContent = 'Ultra Dark Mode enabled.';
    } else {
      btnNormal.textContent = 'Enable Normal Mode';
      btnNormal.classList.remove('active');
      btnUltra.textContent = 'Enable Ultra Mode';
      btnUltra.classList.remove('active');
      status.textContent = 'Dark Mode is off.';
    }
  }

  function applyMode(mode) {
    // 사이트별 설정 저장 + 전역 darkMode 값도 동기화
    chrome.storage.local.get(['siteSettings'], (result) => {
      const siteSettings = result.siteSettings || {};
      if (mode === 'off') {
        delete siteSettings[currentDomain];
      } else {
        siteSettings[currentDomain] = mode;
      }
      chrome.storage.local.set({ siteSettings, darkMode: mode }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const action = mode === 'off' ? 'removeDarkMode'
            : mode === 'normal' ? 'applyNormalMode'
            : 'applyUltraMode';
          chrome.tabs.sendMessage(tabs[0].id, { action }, () => {
            loadState();
          });
        });
      });
    });
  }

  btnNormal.addEventListener('click', () => {
    chrome.storage.local.get(['siteSettings', 'darkMode', 'globalMode'], (result) => {
      const siteSettings = result.siteSettings || {};
      const global = result.globalMode || false;
      const currentMode = siteSettings[currentDomain] || (global ? (result.darkMode || 'off') : 'off');
      applyMode(currentMode === 'normal' ? 'off' : 'normal');
    });
  });

  btnUltra.addEventListener('click', () => {
    chrome.storage.local.get(['siteSettings', 'darkMode', 'globalMode'], (result) => {
      const siteSettings = result.siteSettings || {};
      const global = result.globalMode || false;
      const currentMode = siteSettings[currentDomain] || (global ? (result.darkMode || 'off') : 'off');
      applyMode(currentMode === 'ultra' ? 'off' : 'ultra');
    });
  });

  // Global 모드 토글
  chkGlobal.addEventListener('change', () => {
    chrome.storage.local.set({ globalMode: chkGlobal.checked }, () => {
      status.textContent = chkGlobal.checked
        ? 'Global mode ON — applies to all sites.'
        : 'Global mode OFF — manual toggle per site.';
    });
  });

  // Exclude List 렌더링
  function renderExcludeList(excludes) {
    excludeList.innerHTML = '';
    excludes.forEach((domain, i) => {
      const row = document.createElement('div');
      row.className = 'exclude-item';

      const span = document.createElement('span');
      span.textContent = domain;

      const btn = document.createElement('button');
      btn.textContent = '\u00d7';
      btn.title = 'Remove';
      btn.addEventListener('click', () => removeExclude(i));

      row.appendChild(span);
      row.appendChild(btn);
      excludeList.appendChild(row);
    });
  }

  function addExclude(domain) {
    domain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain) return;

    chrome.storage.local.get(['excludeList'], (result) => {
      const excludes = result.excludeList || [];
      if (excludes.includes(domain)) {
        status.textContent = 'Already in exclude list.';
        return;
      }
      excludes.push(domain);
      chrome.storage.local.set({ excludeList: excludes }, () => {
        renderExcludeList(excludes);
        status.textContent = `Added: ${domain}`;
        // 제외된 사이트면 즉시 다크모드 해제
        if (currentDomain === domain || currentDomain.endsWith('.' + domain)) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'removeDarkMode' });
          });
        }
        loadState();
      });
    });
  }

  function removeExclude(index) {
    chrome.storage.local.get(['excludeList'], (result) => {
      const excludes = result.excludeList || [];
      const removed = excludes.splice(index, 1)[0];
      chrome.storage.local.set({ excludeList: excludes }, () => {
        renderExcludeList(excludes);
        status.textContent = `Removed: ${removed}`;
        loadState();
      });
    });
  }

  btnAddExclude.addEventListener('click', () => {
    addExclude(excludeInput.value);
    excludeInput.value = '';
  });

  excludeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addExclude(excludeInput.value);
      excludeInput.value = '';
    }
  });

  btnExcludeCurrent.addEventListener('click', () => {
    if (currentDomain) addExclude(currentDomain);
  });
});
