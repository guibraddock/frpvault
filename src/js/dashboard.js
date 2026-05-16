/* ══════════════════════════════════════════════
   FRPVault v2 — Dashboard Module
   Bugs corrigidos + favoritos + undo delete +
   highlight na busca + texto sem corte
   ══════════════════════════════════════════════ */
import { sb }                        from '../supabase/client.js'
import { toastSuccess, toastError }  from '../components/toast.js'
import { esc, fmtDate, todayISO, highlightText } from './utils.js'
import { duplicateRecord, sortRecords } from './features.js'

let records     = []
let editId      = null
let currentUser = null
let onRecordsChange = null
let undoTimer   = null   // para desfazer exclusão

const $ = id => document.getElementById(id)

/* ══ PUBLIC API ══════════════════════════════════ */
export function initDashboard(user, recordsCallback) {
  currentUser     = user
  onRecordsChange = recordsCallback || null
  bindEvents()
  loadRecords()
  checkFirstLogin()
}

export function destroyDashboard() { records = []; editId = null }
export { openModal }

/* ══ PRIMEIRO LOGIN ══════════════════════════════ */
function checkFirstLogin() {
  const key = `frp_welcomed_${currentUser.id}`
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, '1')
    setTimeout(() => {
      toastSuccess('👋 Bem-vindo ao FRPVault! Pressione N para novo registro ou ? para ver atalhos.', 5000)
    }, 1200)
  }
}

/* ══ DATA ════════════════════════════════════════ */
async function loadRecords() {
  showSkeleton()
  const { data, error } = await sb
    .from('frp_records')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })

  if (error) { toastError('Erro ao carregar: ' + error.message); return }
  records = data || []
  onRecordsChange?.(records)
  renderAll()
}

async function saveRecord() {
  let valid = true
  ;[$('fMarca'), $('fModelo')].forEach(el => {
    if (!el?.value.trim()) {
      el?.classList.add('input-error')
      el?.addEventListener('input', () => el.classList.remove('input-error'), { once: true })
      valid = false
    }
  })
  if (!valid) { toastError('Preencha Marca e Modelo.'); return }

  const btn = $('btnSave')
  btn.disabled  = true
  btn.innerHTML = '<span class="spinner"></span> Salvando...'

  const stEl   = document.querySelector('input[name="st"]:checked')
  const payload = {
    user_id:      currentUser.id,
    marca:        $('fMarca')?.value.trim(),
    modelo:       $('fModelo')?.value.trim(),
    android:      $('fAnd')?.value.trim()  || null,
    data_servico: $('fData')?.value        || null,
    ferramenta:   $('fFerr')?.value.trim() || null,
    modo:         $('fModo')?.value.trim() || null,
    binario:      $('fBin')?.value.trim()  || null,
    obs:          $('fObs')?.value.trim()  || null,
    status:       stEl?.value             || null,
    favorito:     false,
  }

  if (editId) {
    delete payload.favorito
    const cur = records.find(r => r.id === editId)
    if (cur) payload.favorito = cur.favorito
  }

  const res = editId
    ? await sb.from('frp_records').update(payload).eq('id', editId).eq('user_id', currentUser.id)
    : await sb.from('frp_records').insert(payload)

  btn.disabled  = false
  btn.innerHTML = `<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar`

  if (res.error) { toastError('Erro: ' + res.error.message); return }
  toastSuccess(editId ? 'Registro atualizado!' : 'Salvo! ✦')
  closeModal()
  loadRecords()
}

function deleteRecord(id) {
  // Undo delete — remove da lista visualmente primeiro
  const record = records.find(r => r.id === id)
  if (!record) return

  records = records.filter(r => r.id !== id)
  onRecordsChange?.(records)
  renderAll()

  // Cancela qualquer undo anterior pendente
  if (undoTimer) clearTimeout(undoTimer)

  // Toast com botão Desfazer
  showUndoToast('Registro apagado', async () => {
    clearTimeout(undoTimer)
    records = [...records, record].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    onRecordsChange?.(records)
    renderAll()
    toastSuccess('Exclusão cancelada!')
  })

  // Após 5s confirma a exclusão no banco
  undoTimer = setTimeout(async () => {
    const { error } = await sb.from('frp_records').delete().eq('id', id).eq('user_id', currentUser.id)
    if (error) {
      toastError('Erro ao apagar: ' + error.message)
      loadRecords()
    }
  }, 5000)
}

async function toggleFavorito(id) {
  const record = records.find(r => r.id === id)
  if (!record) return

  const novo = !record.favorito
  record.favorito = novo
  renderRecords()

  const { error } = await sb.from('frp_records').update({ favorito: novo }).eq('id', id).eq('user_id', currentUser.id)
  if (error) {
    record.favorito = !novo
    renderRecords()
    toastError('Erro ao favoritar')
  }
}

async function handleDuplicate(id) {
  const record = records.find(r => r.id === id)
  if (!record) return
  const ok = await duplicateRecord(record, currentUser.id)
  if (ok) loadRecords()
}

/* ══ UNDO TOAST ══════════════════════════════════ */
function showUndoToast(msg, onUndo) {
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div')
    c.id = 'toast-container'
    document.body.appendChild(c)
    return c
  })()

  const el = document.createElement('div')
  el.className = 'toast-item toast-undo'
  el.innerHTML = `
    <span class="toast-dot" style="background:var(--yellow)"></span>
    <span style="flex:1">${msg}</span>
    <button class="toast-undo-btn" type="button">Desfazer</button>
  `
  container.appendChild(el)

  el.querySelector('.toast-undo-btn').addEventListener('click', () => {
    el.classList.add('toast-out')
    el.addEventListener('animationend', () => el.remove(), { once: true })
    onUndo()
  })

  setTimeout(() => {
    el.classList.add('toast-out')
    el.addEventListener('animationend', () => el.remove(), { once: true })
  }, 5000)
}

/* ══ RENDER ══════════════════════════════════════ */
function getSortKey() {
  return $('fSort')?.value || window.__frpSortKey || 'created_at_desc'
}

function getFiltered() {
  const q     = ($('srch')?.value || '').toLowerCase()
  const st    = $('fSt')?.value  || ''
  const br    = ($('fBr')?.value || '').toLowerCase()
  const fav   = $('fFav')?.value || ''

  let filtered = records.filter(r => {
    const text = [r.marca, r.modelo, r.android, r.ferramenta, r.modo, r.binario, r.obs]
      .join(' ').toLowerCase()
    return (!q   || text.includes(q))  &&
           (!st  || r.status === st)   &&
           (!br  || (r.marca || '').toLowerCase() === br) &&
           (!fav || r.favorito === true)
  })

  return sortRecords(filtered, getSortKey())
}

function renderStats() {
  const total  = records.length
  const ok     = records.filter(r => r.status === 'sim').length
  const fail   = records.filter(r => r.status === 'nao').length
  const brands = new Set(records.map(r => r.marca).filter(Boolean)).size
  const rate   = total > 0 ? Math.round((ok / total) * 100) : 0
  const favs   = records.filter(r => r.favorito).length

  const grid = $('statsGrid')
  if (!grid) return

  grid.innerHTML = `
    <div class="stat-card anim-fade-up delay-1">
      <div class="stat-label">Total</div>
      <div class="stat-value">${total}</div>
    </div>
    <div class="stat-card anim-fade-up delay-2">
      <div class="stat-label">Funcionaram</div>
      <div class="stat-value green">${ok}</div>
    </div>
    <div class="stat-card anim-fade-up delay-3">
      <div class="stat-label">Falharam</div>
      <div class="stat-value red">${fail}</div>
    </div>
    <div class="stat-card anim-fade-up delay-4">
      <div class="stat-label">Marcas</div>
      <div class="stat-value purple">${brands}</div>
    </div>
    <div class="stat-card anim-fade-up delay-5">
      <div class="stat-label">Taxa sucesso</div>
      <div class="stat-value ${rate >= 70 ? 'green' : rate >= 40 ? 'yellow' : 'red'}">${rate}%</div>
    </div>
    <div class="stat-card anim-fade-up delay-6">
      <div class="stat-label">Favoritos</div>
      <div class="stat-value yellow">★ ${favs}</div>
    </div>
  `
}

function updateBrands() {
  const brands = [...new Set(records.map(r => r.marca).filter(Boolean))].sort()
  const sel    = $('fBr')
  if (!sel) return
  const cur  = sel.value
  sel.innerHTML = '<option value="">Todas as marcas</option>' +
    brands.map(b =>
      `<option value="${b.toLowerCase()}" ${b.toLowerCase() === cur ? 'selected' : ''}>${b}</option>`
    ).join('')
}

function renderRecords() {
  const filtered = getFiltered()
  const grid     = $('recordsGrid')
  const cnt      = $('recordCount')
  if (!grid) return

  const q = ($('srch')?.value || '').trim()

  if (cnt) cnt.textContent = `${filtered.length} registro${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${records.length === 0 ? '📋' : '🔍'}</div>
        <div class="empty-title">${records.length === 0 ? 'Nenhum registro ainda' : 'Nenhum resultado'}</div>
        <div class="empty-desc">${records.length === 0 ? 'Clique em "+ Novo" para começar.' : 'Tente outros termos ou limpe os filtros.'}</div>
        ${records.length === 0 ? `<button class="btn btn-primary" onclick="window.__openModal?.()">+ Novo Registro</button>` : ''}
      </div>`
    return
  }

  grid.innerHTML = filtered.map((r, i) => recordCardHTML(r, i, q)).join('')

  grid.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => openModal(btn.dataset.edit))
  )
  grid.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => deleteRecord(btn.dataset.delete))
  )
  grid.querySelectorAll('[data-duplicate]').forEach(btn =>
    btn.addEventListener('click', () => handleDuplicate(btn.dataset.duplicate))
  )
  grid.querySelectorAll('[data-fav]').forEach(btn =>
    btn.addEventListener('click', () => toggleFavorito(btn.dataset.fav))
  )
}

function recordCardHTML(r, i, q = '') {
  const delay = Math.min(i, 6)
  const hl    = t => q ? highlightText(esc(t), q) : esc(t)

  const statusBadge = r.status === 'sim'
    ? '<span class="badge badge-success">✓ Funcionou</span>'
    : r.status === 'nao'
    ? '<span class="badge badge-danger">✗ Falhou</span>'
    : '<span class="badge badge-neutral">— Sem status</span>'

  const details = [
    r.ferramenta ? `<div class="record-detail-item"><span class="record-detail-label">Ferramenta</span><span class="record-detail-value">${hl(r.ferramenta)}</span></div>` : '',
    r.modo       ? `<div class="record-detail-item"><span class="record-detail-label">Modo</span><span class="record-detail-value">${hl(r.modo)}</span></div>` : '',
    r.binario    ? `<div class="record-detail-item"><span class="record-detail-label">Binário</span><span class="record-detail-value">${hl(r.binario)}</span></div>` : '',
  ].filter(Boolean).join('')

  const favIcon = r.favorito
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="var(--yellow)" stroke="var(--yellow)" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`

  return `
    <div class="record-card ${r.status === 'nao' ? 'fail' : ''} ${r.favorito ? 'is-fav' : ''} anim-fade-up delay-${delay}">
      <div class="record-head">
        <div style="min-width:0;flex:1">
          <div class="record-device">${hl(r.marca)} ${hl(r.modelo)}</div>
          ${r.android ? `<div class="record-android">Android ${hl(r.android)}</div>` : ''}
        </div>
        <div class="record-badges">
          ${statusBadge}
          ${r.data_servico ? `<span class="record-date">${fmtDate(r.data_servico)}</span>` : ''}
        </div>
      </div>
      ${details ? `<div class="record-details">${details}</div>` : ''}
      ${r.obs ? `<div class="record-obs">${hl(r.obs)}</div>` : ''}
      <div class="record-actions">
        <button class="btn btn-ghost" style="font-size:12px;padding:6px 10px;color:${r.favorito ? 'var(--yellow)' : ''}" data-fav="${r.id}" title="${r.favorito ? 'Remover favorito' : 'Favoritar'}">
          ${favIcon}
        </button>
        <button class="btn btn-ghost" style="font-size:12px;padding:6px 10px" data-duplicate="${r.id}" title="Duplicar">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
        <button class="btn btn-ghost" data-edit="${r.id}">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button class="btn btn-danger" data-delete="${r.id}">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          Apagar
        </button>
      </div>
    </div>`
}

function showSkeleton() {
  const grid = $('recordsGrid')
  if (!grid) return
  grid.innerHTML = Array(4).fill(0).map(() => `
    <div class="record-card">
      <div class="skeleton" style="height:20px;width:55%;margin-bottom:10px"></div>
      <div class="skeleton" style="height:13px;width:35%;margin-bottom:14px"></div>
      <div style="display:flex;gap:8px">
        <div class="skeleton" style="height:13px;width:30%"></div>
        <div class="skeleton" style="height:13px;width:25%"></div>
      </div>
    </div>`).join('')
}

export function renderAll() {
  renderStats()
  updateBrands()
  renderRecords()
}

/* ══ MODAL ═══════════════════════════════════════ */
function openModal(id = null) {
  editId = id || null
  const title = $('modalTitle')
  if (title) title.textContent = id ? 'Editar Registro' : 'Novo Registro'

  if (id) {
    const r = records.find(x => x.id === id)
    if (!r) return
    $('fMarca').value  = r.marca          || ''
    $('fModelo').value = r.modelo         || ''
    $('fAnd').value    = r.android        || ''
    $('fData').value   = r.data_servico   || ''
    $('fFerr').value   = r.ferramenta     || ''
    $('fModo').value   = r.modo           || ''
    $('fBin').value    = r.binario        || ''
    $('fObs').value    = r.obs            || ''
    document.querySelectorAll('input[name="st"]').forEach(x => x.checked = false)
    if (r.status) {
      const el = document.querySelector(`input[name="st"][value="${r.status}"]`)
      if (el) el.checked = true
    }
  } else {
    clearForm()
  }

  $('modalOverlay')?.classList.add('on')
  setTimeout(() => $('fMarca')?.focus(), 100)
}

window.__openModal = openModal

function closeModal() {
  $('modalOverlay')?.classList.remove('on')
  editId = null
}

function clearForm() {
  ;['fMarca','fModelo','fAnd','fFerr','fModo','fBin','fObs'].forEach(id => {
    const el = $(id); if (el) el.value = ''
  })
  if ($('fData')) $('fData').value = todayISO()
  document.querySelectorAll('input[name="st"]').forEach(r => r.checked = false)
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'))
}

/* ══ EVENTS ══════════════════════════════════════ */
function bindEvents() {
  $('btnSave')?.addEventListener('click', saveRecord)
  $('btnModalClose')?.addEventListener('click', closeModal)
  $('modalOverlay')?.addEventListener('click', e => {
    if (e.target === $('modalOverlay')) closeModal()
  })

  let searchTimer
  $('srch')?.addEventListener('input', () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(renderRecords, 200)
  })
  $('fSt')?.addEventListener('change', renderRecords)
  $('fBr')?.addEventListener('change', renderRecords)
  $('fSort')?.addEventListener('change', renderRecords)
  $('fFav')?.addEventListener('change', renderRecords)

  $('fObs')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.ctrlKey) saveRecord()
  })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal()
  })
}
