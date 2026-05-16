/* ══════════════════════════════════════════════
   FRPVault v2 — Command Palette (Ctrl+K / ⌘K)
   ══════════════════════════════════════════════ */

export function initCommandPalette() {
  const overlay = document.getElementById('cmdOverlay');
  const input   = document.getElementById('cmdInput');
  const results = document.getElementById('cmdResults');
  if (!overlay || !input || !results) return;

  /* ── Comandos disponíveis ── */
  const commands = [
    {
      id: 'new',
      label: 'Novo Registro',
      desc: 'Adicionar um novo desbloqueio',
      icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`,
      shortcut: 'N',
      action: () => { window.__openModal?.(); },
    },
    {
      id: 'search',
      label: 'Buscar Registros',
      desc: 'Focar no campo de busca',
      icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>`,
      shortcut: '/',
      action: () => { document.getElementById('srch')?.focus(); },
    },
    {
      id: 'export',
      label: 'Exportar CSV',
      desc: 'Baixar todos os registros filtrados',
      icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>`,
      shortcut: '⌘E',
      action: () => { document.getElementById('btnExportCSV')?.click(); },
    },
    {
      id: 'shortcuts',
      label: 'Ver Atalhos de Teclado',
      desc: 'Painel de todos os atalhos',
      icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>`,
      shortcut: '?',
      action: () => { document.getElementById('helpOverlay')?.classList.add('on'); },
    },
    {
      id: 'filter-ok',
      label: 'Filtrar: Funcionaram',
      desc: 'Mostrar só registros com sucesso',
      icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
      action: () => {
        const sel = document.getElementById('fSt');
        if (sel) { sel.value = 'sim'; sel.dispatchEvent(new Event('change')); }
      },
    },
    {
      id: 'filter-fail',
      label: 'Filtrar: Falharam',
      desc: 'Mostrar só registros com falha',
      icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
      action: () => {
        const sel = document.getElementById('fSt');
        if (sel) { sel.value = 'nao'; sel.dispatchEvent(new Event('change')); }
      },
    },
    {
      id: 'filter-clear',
      label: 'Limpar Filtros',
      desc: 'Mostrar todos os registros',
      icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>`,
      action: () => {
        ['fSt','fBr','fSort'].forEach(id => {
          const el = document.getElementById(id);
          if (el) { el.value = el.options[0].value; el.dispatchEvent(new Event('change')); }
        });
        const srch = document.getElementById('srch');
        if (srch) { srch.value = ''; srch.dispatchEvent(new Event('input')); }
      },
    },
    {
      id: 'signout',
      label: 'Sair da Conta',
      desc: 'Encerrar sessão atual',
      icon: `<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>`,
      action: () => { document.getElementById('btnSignOut')?.click(); },
    },
  ];

  /* ── Abrir / fechar ── */
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      togglePalette();
    }
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closePalette();
  });

  /* ── Busca ── */
  input.addEventListener('input', () => renderCommands(input.value));

  /* ── Navegação por teclado ── */
  input.addEventListener('keydown', e => {
    const items = results.querySelectorAll('.cmd-item');
    const active = results.querySelector('.cmd-item.active');
    let idx = [...items].indexOf(active);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = (idx + 1) % items.length;
      items.forEach((el, i) => el.classList.toggle('active', i === idx));
      items[idx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = idx <= 0 ? items.length - 1 : idx - 1;
      items.forEach((el, i) => el.classList.toggle('active', i === idx));
      items[idx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (active) { active.click(); }
      else if (items.length === 1) { items[0].click(); }
    }
  });

  renderCommands('');

  /* ── Funções internas ── */
  function togglePalette() {
    const isOpen = overlay.classList.contains('on');
    if (isOpen) {
      closePalette();
    } else {
      overlay.classList.add('on');
      input.value = '';
      renderCommands('');
      setTimeout(() => input.focus(), 50);
    }
  }

  function closePalette() {
    overlay.classList.remove('on');
    input.value = '';
  }

  function renderCommands(q = '') {
    const filtered = commands.filter(c =>
      c.label.toLowerCase().includes(q.toLowerCase()) ||
      (c.desc || '').toLowerCase().includes(q.toLowerCase())
    );

    if (!filtered.length) {
      results.innerHTML = `<div class="cmd-empty">Nenhum comando encontrado para "<strong>${q}</strong>"</div>`;
      return;
    }

    results.innerHTML = `
      <div class="cmd-section-label">Comandos</div>
      ${filtered.map((c, i) => `
        <div class="cmd-item ${i === 0 ? 'active' : ''}" data-cmd="${c.id}">
          <span style="color:var(--txt3);flex-shrink:0">${c.icon}</span>
          <span style="flex:1">
            <span style="color:var(--txt);font-size:13px">${highlight(c.label, q)}</span>
            ${c.desc ? `<span style="color:var(--txt3);font-size:11px;display:block;margin-top:1px">${c.desc}</span>` : ''}
          </span>
          ${c.shortcut ? `<span class="cmd-item-key">${c.shortcut}</span>` : ''}
        </div>
      `).join('')}
    `;

    results.querySelectorAll('.cmd-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        results.querySelectorAll('.cmd-item').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
      });
      el.addEventListener('click', () => {
        const cmd = commands.find(c => c.id === el.dataset.cmd);
        if (cmd) { closePalette(); cmd.action(); }
      });
    });
  }

  function highlight(text, q) {
    if (!q) return text;
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark style="background:rgba(0,240,160,.25);color:var(--ac);border-radius:2px">$1</mark>');
  }
}
