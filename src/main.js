/* ══════════════════════════════════════════════
   FRPVault v2.1 — Entry Point
   ══════════════════════════════════════════════ */
import { initAuth, signOut, setAuthMode } from './js/auth.js'
import { initDashboard, openModal, renderAll } from './js/dashboard.js'
import { initPasswordReset, getPasswordStrength } from './js/passwordReset.js'
import { initCommandPalette } from './components/commandPalette.js'
import { exportToCSV, initKeyboardShortcuts } from './js/features.js'
import { renderAnalytics } from './js/analytics.js'
import { initPWA } from './js/pwa.js'
import { getInitials } from './js/utils.js'

const $ = id => document.getElementById(id)

let currentRecords = []
let currentPage    = 'dashboard'  // 'dashboard' | 'analytics'

/* ══ URL DETECTION ═══════════════════════════════ */
function checkSpecialURL() {
  const hash   = new URLSearchParams(window.location.hash.replace('#', ''))
  const params = new URLSearchParams(window.location.search)
  const type   = params.get('type') || hash.get('type')
  const token  = hash.get('access_token')

  if (type === 'recovery' && token) {
    history.replaceState(null, '', window.location.pathname)
    $('newPassScreen')?.classList.add('on')
    return true
  }
  if (type === 'signup' || type === 'email_change' || (token && type !== 'recovery')) {
    history.replaceState(null, '', window.location.pathname)
    $('confirmedScreen').style.display = 'flex'
    return true
  }
  return false
}

/* ══ APP STATE ═══════════════════════════════════ */
function showAuth() {
  $('app')?.classList.remove('on')
  $('authScreen')?.classList.add('on')
  $('resetScreen')?.classList.remove('on')
}

function showApp(user) {
  $('authScreen')?.classList.remove('on')
  $('resetScreen')?.classList.remove('on')
  $('newPassScreen')?.classList.remove('on')
  $('app')?.classList.add('on')

  const email = user.email || ''
  document.querySelectorAll('.sidebar-avatar').forEach(el => el.textContent = getInitials(email))
  document.querySelectorAll('.sidebar-user-email').forEach(el => el.textContent = email)

  initDashboard(user, recs => {
    currentRecords = recs
    if (currentPage === 'analytics') renderAnalytics(currentRecords, 'analyticsContainer')
  })

  bindAppEvents()
  initPWA()
}

/* ══ NAVEGAÇÃO ═══════════════════════════════════ */
function navigate(page) {
  currentPage = page

  const dashView      = $('dashboardView')
  const analyticsView = $('analyticsView')
  const navDash       = $('navDashboard')
  const navAnalytics  = $('navAnalytics')

  if (page === 'analytics') {
    dashView?.style.setProperty('display', 'none')
    analyticsView?.style.setProperty('display', 'block')
    navDash?.classList.remove('active')
    navAnalytics?.classList.add('active')
    renderAnalytics(currentRecords, 'analyticsContainer')
  } else {
    dashView?.style.setProperty('display', 'block')
    analyticsView?.style.setProperty('display', 'none')
    navDash?.classList.add('active')
    navAnalytics?.classList.remove('active')
  }
  closeSidebar()
}

/* ══ EVENTOS DO APP ══════════════════════════════ */
function bindAppEvents() {
  const doExport = () => exportToCSV(currentRecords)

  // Topbar
  $('btnNewRecord')?.addEventListener('click', () => openModal())
  $('btnOpenPalette')?.addEventListener('click', () => {
    $('cmdOverlay')?.classList.add('on')
    setTimeout(() => $('cmdInput')?.focus(), 50)
  })

  // Sidebar nav
  $('navDashboard')?.addEventListener('click', e => { e.preventDefault(); navigate('dashboard') })
  $('navAnalytics')?.addEventListener('click', e => { e.preventDefault(); navigate('analytics') })

  // Sidebar ações
  $('sidebarBtnNew')?.addEventListener('click', () => { closeSidebar(); openModal() })
  $('sidebarBtnSearch')?.addEventListener('click', () => { closeSidebar(); $('srch')?.focus() })
  $('sidebarBtnExport')?.addEventListener('click', () => { closeSidebar(); doExport() })
  $('sidebarBtnHelp')?.addEventListener('click', () => { closeSidebar(); $('helpOverlay')?.classList.add('on') })

  // Toolbar
  $('btnExportCSV')?.addEventListener('click', doExport)
  $('fSort')?.addEventListener('change', e => {
    window.__frpSortKey = e.target.value
    renderAll()
  })

  // Modal
  $('btnModalCancel')?.addEventListener('click', () => $('modalOverlay')?.classList.remove('on'))
  $('btnCloseHelp')?.addEventListener('click', () => $('helpOverlay')?.classList.remove('on'))
  $('btnSignOut')?.addEventListener('click', signOut)

  // Mobile
  $('btnMenuToggle')?.addEventListener('click', toggleSidebar)
  $('sidebarOverlay')?.addEventListener('click', closeSidebar)

  // Scroll to top
  $('scrollTop')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
  window.addEventListener('scroll', () => {
    $('scrollTop')?.classList.toggle('show', window.scrollY > 300)
  })

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $('helpOverlay')?.classList.remove('on')
      $('cmdOverlay')?.classList.remove('on')
    }
  })

  initKeyboardShortcuts({
    onNewRecord:  () => openModal(),
    onExport:     () => doExport(),
    onSearch:     () => { navigate('dashboard'); $('srch')?.focus() },
    onToggleHelp: () => $('helpOverlay')?.classList.toggle('on'),
  })
}

/* ══ SIDEBAR ═════════════════════════════════════ */
function toggleSidebar() {
  $('sidebar')?.classList.toggle('open')
  $('sidebarOverlay')?.classList.toggle('on')
}
function closeSidebar() {
  $('sidebar')?.classList.remove('open')
  $('sidebarOverlay')?.classList.remove('on')
}

/* ══ AUTH TABS ═══════════════════════════════════ */
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.mode
    setAuthMode(mode)
    $('passStrengthWrap').style.display = mode === 'register' ? 'block' : 'none'
    $('forgotWrap').style.display       = mode === 'login'    ? 'block' : 'none'
  })
})

/* ══ SHOW/HIDE SENHA ═════════════════════════════ */
document.querySelectorAll('[data-toggle-pass]').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = $(btn.dataset.togglePass)
    if (!input) return
    const show = input.type === 'password'
    input.type = show ? 'text' : 'password'
    btn.innerHTML = show
      ? `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10 10 0 0112 20c-7 0-11-8-11-8a18 18 0 015.06-5.94"/><path d="M9.9 4.24A9 9 0 0112 4c7 0 11 8 11 8a18 18 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
  })
})

/* ══ STRENGTH METER ══════════════════════════════ */
function bindStrengthMeter(inputId, segIds, labelId) {
  const input  = $(inputId)
  const label  = $(labelId)
  const segs   = segIds.map(id => $(id))
  const cls    = ['', 's1', 's2', 's3', 's4']
  const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
  input?.addEventListener('input', () => {
    const s = getPasswordStrength(input.value)
    segs.forEach((el, i) => { if (el) el.className = 'strength-seg ' + (i < s ? cls[s] : '') })
    if (label) label.textContent = input.value ? labels[s] : ''
  })
}
bindStrengthMeter('authPass',     ['seg1','seg2','seg3','seg4'], 'strengthLabel')
bindStrengthMeter('newPassInput', ['nps1','nps2','nps3','nps4'], 'newPassStrengthLabel')

/* ══ CONFIRMAÇÃO DE EMAIL ════════════════════════ */
$('btnGoToLogin')?.addEventListener('click', () => {
  window.location.href = window.location.pathname
})

/* ══ BOOT ════════════════════════════════════════ */
if (!checkSpecialURL()) {
  initAuth({ onSignedIn: showApp, onSignedOut: showAuth })
  initPasswordReset()
  initCommandPalette()
}
