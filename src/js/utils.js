/* ══════════════════════════════════════════════
   FRPVault v2 — Utilities
   ══════════════════════════════════════════════ */

export function esc(s) {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
}

export function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr + 'T12:00:00')
    .toLocaleDateString('pt-BR')
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function debounce(fn, ms = 300) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}

export function getInitials(email = '') {
  return (email[0] || '?').toUpperCase()
}

export function truncate(str, n = 40) {
  if (!str || str.length <= n) return str
  return str.slice(0, n) + '…'
}

export function strColor(str = '') {
  const colors = ['#00f0a0','#8b5cf6','#22d3ee','#ffd060','#ff5370','#f97316','#a78bfa','#34d399']
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

/** Destaca termo buscado no texto (já escapado) */
export function highlightText(escapedText, query) {
  if (!query || !escapedText) return escapedText
  const safeQ = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re    = new RegExp(`(${safeQ})`, 'gi')
  return escapedText.replace(re, '<mark class="search-hl">$1</mark>')
}
