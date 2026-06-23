document.addEventListener('DOMContentLoaded', () => {
  const btnNormal = document.getElementById('btn-normal');
  const btnUltra = document.getElementById('btn-ultra');
  const chkGlobal = document.getElementById('chk-global');
  const chkLite = document.getElementById('chk-lite');
  const status = document.getElementById('status');
  const domainEl = document.getElementById('current-domain');
  const excludeListEl = document.getElementById('exclude-list');
  const excludeInput = document.getElementById('exclude-input');
  const btnAddExclude = document.getElementById('btn-add-exclude');
  const btnExcludeCurrent = document.getElementById('btn-exclude-current');

  let currentDomain = '';
  let currentPort = '';

  // 현재 도메인/포트 가져오기
  chrome.runtime.sendMessage({ action: 'getCurrentDomain' }, (response) => {
    if (response && response.domain) {
      currentDomain = response.domain;
      currentPort = response.port || '';
      domainEl.textContent = currentPort
        ? `${currentDomain}:${currentPort}`
        : currentDomain;
    } else {
      domainEl.textContent = 'Unknown';
    }
    loadState();
  });

  // === Exclude 매칭 (content.js와 동일 로직) ===
  function matchesExclude(entry, hostname, port) {
    const pattern = typeof entry === 'string' ? entry : entry.pattern;
    const type = typeof entry === 'string' ? 'domain' : entry.type;
    if (type === 'wildcard') {
      const base = pattern.replace(/^\*\./, '');
      return hostname === base || hostname.endsWith('.' + base);
    }
    if (type === 'domain-port') {
      const colonIdx = pattern.lastIndexOf(':');
      if (colonIdx === -1) return false;
      const pHost = pattern.slice(0, colonIdx);
      const pPort = pattern.slice(colonIdx + 1);
      return hostname === pHost && port === pPort;
    }
    return hostname === pattern || hostname.endsWith('.' + pattern);
  }

  function isExcluded(excludes) {
    return excludes.some(e => matchesExclude(e, currentDomain, currentPort));
  }

  function getSelectedType() {
    const radio = document.querySelector('input[name="exclude-type"]:checked');
    return radio ? radio.value : 'domain';
  }

  // === 타입별 placeholder ===
  function updatePlaceholder() {
    const map = {
      wildcard: '*.example.com',
      domain: 'example.com',
      'domain-port': 'example.com:8080',
    };
    excludeInput.placeholder = map[getSelectedType()] || 'e.g. example.com';
  }

  // === 패턴 정규화 ===
  function normalizePattern(raw, type) {
    let p = raw.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
    if (!p) return '';

    if (type === 'wildcard') {
      p = p.replace(/:[0-9]+$/, ''); // 포트 제거
      if (!p.startsWith('*.')) p = '*.' + p;
    } else if (type === 'domain') {
      p = p.replace(/^\*\./, '').replace(/:[0-9]+$/, '');
    }
    // domain-port: 그대로 (포트 포함 형태 유지)
    return p;
  }

  // === Add 버튼 상태 동기 업데이트 ===
  function updateAddButton() {
    const raw = excludeInput.value;
    const type = getSelectedType();
    const pattern = normalizePattern(raw, type);
    if (!pattern) {
      btnAddExclude.textContent = 'Add';
      btnAddExclude.classList.remove('btn-remove');
      return;
    }
    chrome.storage.local.get(['excludeList'], (result) => {
      const excludes = result.excludeList || [];
      const exists = excludes.some(e => {
        const ep = typeof e === 'string' ? e : e.pattern;
        const et = typeof e === 'string' ? 'domain' : e.type;
        return ep === pattern && et === type;
      });
      btnAddExclude.textContent = exists ? 'Remove' : 'Add';
      btnAddExclude.classList.toggle('btn-remove', exists);
    });
  }

  function loadState() {
    chrome.storage.local.get(['darkMode', 'globalMode', 'excludeList', 'siteSettings', 'liteMode'], (result) => {
      const globalMode = result.darkMode || 'off';
      const global = result.globalMode || false;
      const excludes = result.excludeList || [];
      const siteSettings = result.siteSettings || {};

      let mode;
      if (currentDomain && siteSettings[currentDomain]) {
        mode = siteSettings[currentDomain];
      } else if (global) {
        mode = globalMode;
      } else {
        mode = 'off';
      }

      chkGlobal.checked = global;
      chkLite.checked = result.liteMode || false;
      renderExcludeList(excludes);
      updateButtons(mode, global, excludes);
      updateExcludeCurrentButton(excludes);
      updateAddButton();
    });
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

  function updateExcludeCurrentButton(excludes) {
    const excluded = isExcluded(excludes);
    if (excluded) {
      btnExcludeCurrent.textContent = '× Remove from exclude';
      btnExcludeCurrent.classList.add('btn-remove');
    } else {
      btnExcludeCurrent.textContent = 'Exclude current site';
      btnExcludeCurrent.classList.remove('btn-remove');
    }
  }

  // === 렌더링 ===
  function getTypeBadge(type) {
    return {
      wildcard:      { label: '*',  cls: 'badge-wildcard' },
      domain:        { label: 'D',  cls: 'badge-domain'   },
      'domain-port': { label: ':P', cls: 'badge-port'     },
    }[type] || { label: 'D', cls: 'badge-domain' };
  }

  function renderExcludeList(excludes) {
    excludeListEl.innerHTML = '';
    excludes.forEach((entry, i) => {
      const pattern = typeof entry === 'string' ? entry : entry.pattern;
      const type = typeof entry === 'string' ? 'domain' : entry.type;
      const badge = getTypeBadge(type);

      const row = document.createElement('div');
      row.className = 'exclude-item';

      const badgeEl = document.createElement('span');
      badgeEl.className = `exclude-badge ${badge.cls}`;
      badgeEl.textContent = badge.label;

      const span = document.createElement('span');
      span.className = 'exclude-pattern';
      span.textContent = pattern;

      const btn = document.createElement('button');
      btn.textContent = '×';
      btn.title = 'Remove';
      btn.addEventListener('click', () => removeExclude(i));

      row.appendChild(badgeEl);
      row.appendChild(span);
      row.appendChild(btn);
      excludeListEl.appendChild(row);
    });
  }

  // === 추가 / 삭제 (토글) ===
  function addExclude(rawPattern, type) {
    if (!type) type = getSelectedType();
    const pattern = normalizePattern(rawPattern, type);
    if (!pattern) return;

    if (type === 'domain-port' && !/:[0-9]+$/.test(pattern)) {
      status.textContent = 'domain:port 타입은 포트를 포함해야 합니다. (예: example.com:8080)';
      return;
    }

    chrome.storage.local.get(['excludeList'], (result) => {
      const excludes = result.excludeList || [];

      // 이미 존재하면 토글(제거)
      const existingIdx = excludes.findIndex(e => {
        const ep = typeof e === 'string' ? e : e.pattern;
        const et = typeof e === 'string' ? 'domain' : e.type;
        return ep === pattern && et === type;
      });

      if (existingIdx !== -1) {
        excludes.splice(existingIdx, 1);
        chrome.storage.local.set({ excludeList: excludes }, () => {
          status.textContent = `Removed: ${pattern}`;
          loadState();
        });
        return;
      }

      const entry = { pattern, type };
      excludes.push(entry);
      chrome.storage.local.set({ excludeList: excludes }, () => {
        status.textContent = `Added: ${pattern}`;
        if (matchesExclude(entry, currentDomain, currentPort)) {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: 'removeDarkMode' });
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
      const label = typeof removed === 'string' ? removed : removed.pattern;
      chrome.storage.local.set({ excludeList: excludes }, () => {
        status.textContent = `Removed: ${label}`;
        loadState();
      });
    });
  }

  // === 이벤트 ===
  btnAddExclude.addEventListener('click', () => {
    const val = excludeInput.value.trim();
    if (!val) return;
    addExclude(val, getSelectedType());
    excludeInput.value = '';
    updateAddButton();
  });

  excludeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = excludeInput.value.trim();
      if (!val) return;
      addExclude(val, getSelectedType());
      excludeInput.value = '';
      updateAddButton();
    }
  });

  excludeInput.addEventListener('input', updateAddButton);

  document.querySelectorAll('input[name="exclude-type"]').forEach(r => {
    r.addEventListener('change', () => {
      updatePlaceholder();
      updateAddButton();
    });
  });

  // "Exclude current site" — 토글
  btnExcludeCurrent.addEventListener('click', () => {
    chrome.storage.local.get(['excludeList'], (result) => {
      const excludes = result.excludeList || [];
      const excluded = isExcluded(excludes);

      if (excluded) {
        // 현재 사이트와 매칭되는 항목 모두 제거
        const newExcludes = excludes.filter(e => !matchesExclude(e, currentDomain, currentPort));
        chrome.storage.local.set({ excludeList: newExcludes }, () => {
          status.textContent = 'Removed from exclude.';
          loadState();
        });
      } else {
        // 선택된 타입으로 현재 사이트 추가
        const type = getSelectedType();
        let pattern = currentDomain;
        if (type === 'wildcard') {
          const parts = currentDomain.split('.');
          // sub.example.com → *.example.com, example.com → *.example.com
          pattern = parts.length > 2
            ? '*.' + parts.slice(1).join('.')
            : '*.' + currentDomain;
        } else if (type === 'domain-port') {
          pattern = currentPort ? `${currentDomain}:${currentPort}` : currentDomain;
        }
        addExclude(pattern, type);
      }
    });
  });

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

  function applyMode(mode) {
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

  chkGlobal.addEventListener('change', () => {
    chrome.storage.local.set({ globalMode: chkGlobal.checked }, () => {
      status.textContent = chkGlobal.checked
        ? 'Global mode ON — applies to all sites.'
        : 'Global mode OFF — manual toggle per site.';
    });
  });

  chkLite.addEventListener('change', () => {
    chrome.storage.local.set({ liteMode: chkLite.checked }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'setLiteMode', value: chkLite.checked });
        }
      });
      status.textContent = chkLite.checked
        ? 'Lite mode ON — reduced CPU/RAM usage.'
        : 'Lite mode OFF.';
    });
  });

  // 초기 placeholder 설정
  updatePlaceholder();
});
