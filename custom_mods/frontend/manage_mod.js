(() => {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const THEME_KEY = 'sora2api-theme';
  const THEMES = ['light', 'dark'];
  const THEME_LABELS = { light: '浅色', dark: '深色' };
  const THEME_STYLE_ID = 'custom-theme-style';

  const THEME_CSS = `
:root{
  --border: 0 0% 89%;
  --input: 0 0% 89%;
  --ring: 0 0% 3.9%;
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
}
[data-theme="dark"]{
  color-scheme: dark;
  --border: 220 14% 25%;
  --input: 220 14% 25%;
  --ring: 217 91% 60%;
  --background: 224 15% 12%;
  --foreground: 210 20% 96%;
  --primary: 217 91% 60%;
  --primary-foreground: 210 20% 98%;
  --secondary: 220 12% 18%;
  --secondary-foreground: 210 20% 96%;
  --muted: 220 10% 20%;
  --muted-foreground: 215 16% 70%;
  --accent: 220 14% 24%;
  --accent-foreground: 210 20% 96%;
  --destructive: 0 72% 52%;
  --destructive-foreground: 0 0% 98%;
}
.bg-background{background-color:hsl(var(--background));}
.bg-background\\/95{background-color:hsl(var(--background)/0.95);}
.text-foreground{color:hsl(var(--foreground));}
.border-border{border-color:hsl(var(--border));}
.border-border\\/40{border-color:hsl(var(--border)/0.4);}
.border-input{border-color:hsl(var(--input));}
.bg-primary{background-color:hsl(var(--primary));}
.text-primary-foreground{color:hsl(var(--primary-foreground));}
.bg-secondary{background-color:hsl(var(--secondary));}
.text-secondary-foreground{color:hsl(var(--secondary-foreground));}
.bg-muted{background-color:hsl(var(--muted));}
.text-muted-foreground{color:hsl(var(--muted-foreground));}
.bg-accent{background-color:hsl(var(--accent));}
.text-accent-foreground{color:hsl(var(--accent-foreground));}
.bg-destructive{background-color:hsl(var(--destructive));}
.text-destructive{color:hsl(var(--destructive));}
.hover\\:bg-accent:hover{background-color:hsl(var(--accent));}
.hover\\:text-accent-foreground:hover{color:hsl(var(--accent-foreground));}
.bg-primary\\/90{background-color:hsl(var(--primary)/0.9);}
.hover\\:bg-primary\\/90:hover{background-color:hsl(var(--primary)/0.9);}
.hover\\:bg-destructive\\/90:hover{background-color:hsl(var(--destructive)/0.9);}
.hover\\:bg-destructive\\/10:hover{background-color:hsl(var(--destructive)/0.1);}
`;

  const $id = (id) => (typeof $ === 'function' ? $(id) : document.getElementById(id));

  const ensureThemeStyles = () => {
    if (document.getElementById(THEME_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = THEME_STYLE_ID;
    style.textContent = THEME_CSS;
    document.head.appendChild(style);
  };

  const applyTheme = (theme) => {
    ensureThemeStyles();
    const normalized = THEMES.includes(theme) ? theme : THEMES[0];
    document.documentElement.setAttribute('data-theme', normalized);
    try {
      localStorage.setItem(THEME_KEY, normalized);
    } catch (e) {
      // Ignore storage errors.
    }
    const label = THEME_LABELS[normalized] || normalized;
    const btn = $id('themeToggleBtn');
    if (btn) {
      const title = `切换浅色/深色主题（当前：${label}）`;
      btn.setAttribute('title', title);
      btn.setAttribute('aria-label', title);
    }
    const textEl = $id('themeToggleText');
    if (textEl) {
      textEl.textContent = label;
    }
  };

  window.toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || THEMES[0];
    const currentIndex = THEMES.indexOf(current);
    const nextIndex = currentIndex === -1 ? 1 : (currentIndex + 1) % THEMES.length;
    applyTheme(THEMES[nextIndex]);
  };

  window.initThemeToggle = () => {
    let stored = null;
    try {
      stored = localStorage.getItem(THEME_KEY);
    } catch (e) {
      stored = null;
    }
    applyTheme(stored || THEMES[0]);
  };

  const insertThemeToggle = () => {
    if ($id('themeToggleBtn')) return;
    const nav = document.querySelector('header .flex.flex-1.items-center.justify-end');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.className =
      'inline-flex items-center justify-center text-xs transition-colors hover:bg-accent hover:text-accent-foreground h-7 px-2.5 gap-1';
    btn.title = '切换浅色/深色主题';
    btn.innerHTML = '<span class="h-2 w-2 rounded-full bg-primary"></span><span id="themeToggleText">浅色</span>';
    btn.addEventListener('click', window.toggleTheme);
    const github = nav.querySelector('a[href*="github.com/Wuniao79/newsora2api"]');
    nav.insertBefore(btn, github || nav.firstChild);
  };

  const createToolbarButton = (config) => {
    const btn = document.createElement('button');
    btn.id = config.id;
    btn.className = config.className;
    btn.title = config.title;
    btn.innerHTML = config.innerHTML;
    btn.addEventListener('click', config.onClick);
    return btn;
  };

  const insertToolbarButtons = () => {
    const exportBtn = document.querySelector('button[title="导出所有Token"]');
    if (!exportBtn || !exportBtn.parentElement) return;
    const toolbar = exportBtn.parentElement;
    if ($id('testAllBtn')) return;

    const testAllBtn = createToolbarButton({
      id: 'testAllBtn',
      className: 'inline-flex items-center justify-center rounded-md bg-amber-500 text-white hover:bg-amber-600 h-8 px-3',
      title: '一键测试全部 Token',
      onClick: window.testAllTokens,
      innerHTML:
        '<svg class="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span id="testAllBtnText" class="text-sm font-medium">一键测试</span><svg id="testAllBtnSpinner" class="hidden animate-spin h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'
    });
    const disableLowBtn = createToolbarButton({
      id: 'disableLowBtn',
      className: 'inline-flex items-center justify-center rounded-md bg-orange-600 text-white hover:bg-orange-700 h-8 px-3',
      title: '禁用可用次数少于2的账号',
      onClick: window.disableLowRemainingTokens,
      innerHTML:
        '<svg class="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg><span id="disableLowBtnText" class="text-sm font-medium">禁用低可用</span><svg id="disableLowBtnSpinner" class="hidden animate-spin h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'
    });
    const enableAllBtn = createToolbarButton({
      id: 'enableAllBtn',
      className: 'inline-flex items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700 h-8 px-3',
      title: '启用所有可用账号',
      onClick: window.enableAllTokens,
      innerHTML:
        '<svg class="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span id="enableAllBtnText" class="text-sm font-medium">启用所有可用</span><svg id="enableAllBtnSpinner" class="hidden animate-spin h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'
    });
    const deleteProblematicBtn = createToolbarButton({
      id: 'deleteProblematicBtn',
      className: 'inline-flex items-center justify-center rounded-md bg-destructive text-white hover:bg-destructive/90 h-8 px-3',
      title: '删除所有标记401或已过期的账号',
      onClick: window.deleteProblematicTokens,
      innerHTML:
        '<svg class="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M9 6v12m6-12v12M5 6l1-2h12l1 2"/></svg><span id="deleteProblematicBtnText" class="text-sm font-medium">清理异常</span><svg id="deleteProblematicBtnSpinner" class="hidden animate-spin h-4 w-4 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>'
    });

    toolbar.insertBefore(deleteProblematicBtn, exportBtn);
    toolbar.insertBefore(enableAllBtn, deleteProblematicBtn);
    toolbar.insertBefore(disableLowBtn, enableAllBtn);
    toolbar.insertBefore(testAllBtn, disableLowBtn);
  };

  const patchTableHeaders = () => {
    const tbody = $id('tokenTableBody');
    if (!tbody) return;
    const table = tbody.closest('table');
    if (!table) return;
    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return;
    const headers = Array.from(headerRow.querySelectorAll('th'));
    const findIndex = (label) => headers.findIndex((th) => th.textContent.trim() === label);
    const statusIndex = findIndex('状态');
    if (statusIndex !== -1 && !headerRow.querySelector('th[data-col="account-status"]')) {
      const th = document.createElement('th');
      th.className = 'h-10 px-3 text-left align-middle font-medium text-muted-foreground';
      th.textContent = '账号状态';
      th.setAttribute('data-col', 'account-status');
      headerRow.insertBefore(th, headers[statusIndex + 1] || null);
    }
    if (!headerRow.querySelector('th[data-col="stats"]')) {
      const imageIndex = findIndex('图片');
      const videoIndex = findIndex('视频');
      const errorIndex = findIndex('错误');
      const indices = [imageIndex, videoIndex, errorIndex].filter((idx) => idx !== -1);
      if (indices.length) {
        const insertIndex = Math.min(...indices);
        indices
          .sort((a, b) => b - a)
          .forEach((idx) => {
            if (headers[idx]) headers[idx].remove();
          });
        const th = document.createElement('th');
        th.className = 'h-10 px-3 text-left align-middle font-medium text-muted-foreground';
        th.textContent = '统计';
        th.setAttribute('data-col', 'stats');
        headerRow.insertBefore(th, headerRow.children[insertIndex] || null);
      }
    }
  };

  const sortTokens = (tokens) =>
    tokens.sort((a, b) => {
      const activeDiff = Number(b.is_active) - Number(a.is_active);
      if (activeDiff !== 0) return activeDiff;
      const aRemaining = typeof a.sora2_remaining_count === 'number' ? a.sora2_remaining_count : -1;
      const bRemaining = typeof b.sora2_remaining_count === 'number' ? b.sora2_remaining_count : -1;
      if (bRemaining !== aRemaining) return bRemaining - aRemaining;
      return String(a.email || '').localeCompare(String(b.email || ''));
    });

  const renderTokensPatched = () => {
    const tb = $id('tokenTableBody');
    if (!tb || !Array.isArray(allTokens)) return;
    const formatRemaining =
      typeof formatSora2Remaining === 'function'
        ? formatSora2Remaining
        : (t) => (typeof t.sora2_remaining_count === 'number' ? t.sora2_remaining_count : '-');
    const formatClient =
      typeof formatClientId === 'function' ? formatClientId : (clientId) => clientId || '-';
    const formatExpiryCell = typeof formatExpiry === 'function' ? formatExpiry : (exp) => exp || '-';
    const formatPlan =
      typeof formatPlanTypeWithTooltip === 'function'
        ? formatPlanTypeWithTooltip
        : (t) => t.plan_type || '-';
    const formatSora =
      typeof formatSora2 === 'function' ? formatSora2 : (t) => (t.sora2_supported ? '支持' : '-');

    tb.innerHTML = allTokens
      .map((t) => {
        const imageDisplay = t.image_enabled ? `${t.image_count || 0}` : '-';
        const videoDisplay = t.video_enabled && t.sora2_supported ? `${t.video_count || 0}` : '-';
        const statusDisplay =
          typeof window.formatTokenStatus === 'function'
            ? window.formatTokenStatus(t)
            : `<span class="inline-flex items-center rounded px-2 py-0.5 text-xs ${
                t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
              }">${t.is_active ? '开启中' : '禁用'}</span>`;
        const accountStatusDisplay =
          typeof window.formatAccountStatus === 'function'
            ? window.formatAccountStatus(t)
            : t.status_code
            ? `<span class="inline-flex items-center rounded px-2 py-0.5 text-xs bg-red-50 text-red-700">${t.status_code}</span>`
            : '<span class="inline-flex items-center rounded px-2 py-0.5 text-xs bg-green-50 text-green-700">活跃</span>';
        const statsDisplay = `<div class="flex flex-col gap-1 text-xs"><span class="inline-flex items-center gap-1 rounded bg-blue-50 text-blue-700 px-1.5 py-0.5">图 ${imageDisplay}</span><span class="inline-flex items-center gap-1 rounded bg-purple-50 text-purple-700 px-1.5 py-0.5">视 ${videoDisplay}</span><span class="inline-flex items-center gap-1 rounded bg-red-50 text-red-700 px-1.5 py-0.5">错 ${t.error_count || 0}</span></div>`;
        return `<tr><td class="py-2.5 px-3">${t.email}</td><td class="py-2.5 px-3">${statusDisplay}</td><td class="py-2.5 px-3">${accountStatusDisplay}</td><td class="py-2.5 px-3">${formatClient(t.client_id)}</td><td class="py-2.5 px-3 text-xs">${formatExpiryCell(t.expiry_time)}</td><td class="py-2.5 px-3 text-xs">${formatPlan(t)}</td><td class="py-2.5 px-3 text-xs">${formatSora(t)}</td><td class="py-2.5 px-3">${formatRemaining(t)}</td><td class="py-2.5 px-3">${statsDisplay}</td><td class="py-2.5 px-3 text-xs text-muted-foreground">${t.remark || '-'}</td><td class="py-2.5 px-3 text-right"><button onclick="testToken(${t.id})" class="inline-flex items-center justify-center rounded-md hover:bg-blue-50 hover:text-blue-700 h-7 px-2 text-xs mr-1">测试</button><button onclick="openEditModal(${t.id})" class="inline-flex items-center justify-center rounded-md hover:bg-green-50 hover:text-green-700 h-7 px-2 text-xs mr-1">编辑</button><button onclick="toggleToken(${t.id},${t.is_active})" class="inline-flex items-center justify-center rounded-md hover:bg-accent h-7 px-2 text-xs mr-1">${t.is_active ? '禁用' : '启用'}</button><button onclick="deleteToken(${t.id})" class="inline-flex items-center justify-center rounded-md hover:bg-destructive/10 hover:text-destructive h-7 px-2 text-xs">删除</button></td></tr>`;
      })
      .join('');
  };

  const patchLoadTokens = () => {
    if (typeof window.loadTokens !== 'function') return;
    window.loadTokens = async () => {
      try {
        const r = await apiRequest('/api/tokens');
        if (!r) return;
        allTokens = await r.json();
        sortTokens(allTokens);
        renderTokensPatched();
      } catch (e) {
        console.error('加载Token失败:', e);
      }
    };
  };

  window.testAllTokens = async () => {
    if (!Array.isArray(allTokens) || allTokens.length === 0) {
      showToast('没有Token可测试', 'info');
      return;
    }
    const tokensToTest = [...allTokens].sort((a, b) => Number(a.is_active) - Number(b.is_active));
    const msg = `将测试 ${tokensToTest.length} 个Token，可能需要一些时间，确认继续吗？`;
    if (!confirm(msg)) return;
    const btn = $id('testAllBtn');
    const btnText = $id('testAllBtnText');
    const btnSpinner = $id('testAllBtnSpinner');
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = `测试中 0/${tokensToTest.length}`;
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    let success = 0;
    let failed = 0;
    let completed = 0;
    try {
      for (const t of tokensToTest) {
        completed += 1;
        if (btnText) btnText.textContent = `测试中 ${completed}/${tokensToTest.length}`;
        try {
          const r = await apiRequest(`/api/tokens/${t.id}/test`, { method: 'POST' });
          if (!r) {
            failed += 1;
            break;
          }
          const d = await r.json();
          const messageText = String(d.message || '');
          const match = messageText.match(/\b(\d{3})\b/);
          let statusCode = Number.isFinite(d.status_code) ? d.status_code : null;
          if (statusCode === null && typeof d.status_code === 'string' && /^\d{3}$/.test(d.status_code)) {
            statusCode = parseInt(d.status_code, 10);
          }
          if (statusCode === null && match) {
            statusCode = parseInt(match[1], 10);
          }
          if (d.status === 'success') {
            if (t.status_code) {
              t.status_code = null;
              renderTokensPatched();
            }
          } else if (statusCode) {
            const wasActive = t.is_active;
            t.status_code = statusCode;
            if (statusCode === 401 || statusCode === 403) {
              t.is_active = false;
              if (wasActive) {
                try {
                  await apiRequest(`/api/tokens/${t.id}/disable`, { method: 'POST' });
                } catch (e) {
                  // Best-effort disable; backend test should already handle it.
                }
              }
            }
            renderTokensPatched();
          }
          if (d.success && d.status === 'success') {
            success += 1;
          } else {
            failed += 1;
          }
        } catch (e) {
          failed += 1;
        }
        await sleep(150);
      }
      await refreshTokens();
      const toastType = failed > 0 ? 'error' : 'success';
      showToast(`测试完成：成功 ${success}，失败 ${failed}`, toastType);
    } finally {
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = '一键测试';
      if (btnSpinner) btnSpinner.classList.add('hidden');
    }
  };

  window.disableLowRemainingTokens = async () => {
    const targets = Array.isArray(allTokens)
      ? allTokens.filter((t) => typeof t.sora2_remaining_count === 'number' && t.sora2_remaining_count < 2)
      : [];
    if (targets.length === 0) {
      showToast('没有可用次数低于2的账号', 'info');
      return;
    }
    const preview = targets
      .slice(0, 3)
      .map((t) => `${t.email} (${t.sora2_remaining_count || 0})`)
      .join('\n');
    const msg = `将禁用 ${targets.length} 个可用次数 < 2 的账号${
      preview ? `:\n${preview}${targets.length > 3 ? '\n...' : ''}` : ''
    }\n确认继续吗？`;
    if (!confirm(msg)) return;
    const btn = $id('disableLowBtn');
    const btnText = $id('disableLowBtnText');
    const btnSpinner = $id('disableLowBtnSpinner');
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = `禁用中 0/${targets.length}`;
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    let success = 0;
    let failed = 0;
    let completed = 0;
    try {
      for (const t of targets) {
        completed += 1;
        if (btnText) btnText.textContent = `禁用中 ${completed}/${targets.length}`;
        try {
          const r = await apiRequest(`/api/tokens/${t.id}/disable`, { method: 'POST' });
          if (!r) {
            failed += 1;
            break;
          }
          const d = await r.json();
          if (d.success) {
            success += 1;
          } else {
            failed += 1;
          }
        } catch (e) {
          failed += 1;
        }
        await sleep(100);
      }
      await refreshTokens();
      const toastType = failed > 0 ? 'error' : 'success';
      showToast(`禁用完成：成功 ${success}，失败 ${failed}`, toastType);
    } finally {
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = '禁用低可用';
      if (btnSpinner) btnSpinner.classList.add('hidden');
    }
  };

  window.enableAllTokens = async (skipConfirm = false) => {
    const targets = Array.isArray(allTokens)
      ? allTokens.filter(
          (t) =>
            !t.is_active &&
            t.sora2_supported === true &&
            t.status_code !== 401 &&
            typeof t.sora2_remaining_count === 'number' &&
            t.sora2_remaining_count >= 2
        )
      : [];
    if (targets.length === 0) {
      showToast('没有需要启用的可用账号', 'info');
      return;
    }
    if (!skipConfirm && !confirm(`将启用 ${targets.length} 个可用账号，确认继续吗？`)) return;
    const btn = $id('enableAllBtn');
    const btnText = $id('enableAllBtnText');
    const btnSpinner = $id('enableAllBtnSpinner');
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = `启用中 0/${targets.length}`;
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    let success = 0;
    let failed = 0;
    let completed = 0;
    try {
      for (const t of targets) {
        completed += 1;
        if (btnText) btnText.textContent = `启用中 ${completed}/${targets.length}`;
        try {
          const r = await apiRequest(`/api/tokens/${t.id}/enable`, { method: 'POST' });
          if (!r) {
            failed += 1;
            break;
          }
          const d = await r.json();
          if (d.success) {
            success += 1;
          } else {
            failed += 1;
          }
        } catch (e) {
          failed += 1;
        }
        await sleep(100);
      }
      await refreshTokens();
      const toastType = failed > 0 ? 'error' : 'success';
      showToast(`启用完成：成功 ${success}，失败 ${failed}`, toastType);
    } finally {
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = '启用所有可用';
      if (btnSpinner) btnSpinner.classList.add('hidden');
    }
  };

  window.deleteProblematicTokens = async () => {
    const btn = $id('deleteProblematicBtn');
    const btnText = $id('deleteProblematicBtnText');
    const btnSpinner = $id('deleteProblematicBtnSpinner');
    if (!confirm('将删除所有标记为401的账号和已过期账号，确认继续吗？')) return;
    if (btn) btn.disabled = true;
    if (btnText) btnText.textContent = '清理中...';
    if (btnSpinner) btnSpinner.classList.remove('hidden');
    try {
      const r = await apiRequest('/api/tokens/problematic/cleanup', { method: 'DELETE' });
      if (!r) return;
      const d = await r.json();
      if (d.success) {
        await refreshTokens();
        showToast(`已删除 ${d.deleted || 0} 个异常账号`, 'success');
      } else {
        const detail = d.detail;
        const detailMsg =
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
            ? detail.map((x) => x.msg || x.detail || JSON.stringify(x)).join('; ')
            : d.message || '未知错误';
        showToast('删除失败: ' + detailMsg, 'error');
      }
    } catch (e) {
      showToast('删除失败: ' + e.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
      if (btnText) btnText.textContent = '清理异常';
      if (btnSpinner) btnSpinner.classList.add('hidden');
    }
  };

  window.formatTokenStatus = (t) => {
    return `<span class="inline-flex items-center rounded px-2 py-0.5 text-xs ${
      t.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'
    }">${t.is_active ? '开启中' : '禁用'}</span>`;
  };

  window.formatAccountStatus = (t) => {
    const code = typeof t.status_code === 'number' ? t.status_code : null;
    if (code) {
      const tone =
        code === 429
          ? 'bg-amber-50 text-amber-700'
          : code >= 500
          ? 'bg-red-50 text-red-700'
          : 'bg-red-50 text-red-700';
      return `<span class="inline-flex items-center rounded px-2 py-0.5 text-xs ${tone}">${code}</span>`;
    }
    return '<span class="inline-flex items-center rounded px-2 py-0.5 text-xs bg-green-50 text-green-700">活跃</span>';
  };

  patchLoadTokens();
  window.renderTokens = renderTokensPatched;

  let domInitialized = false;
  const initDom = () => {
    if (domInitialized) return;
    domInitialized = true;
    ensureThemeStyles();
    insertThemeToggle();
    insertToolbarButtons();
    patchTableHeaders();
    window.initThemeToggle();
  };

  initDom();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDom);
  }
})();
