/* ══════════════════════════════════════════════
   FRPVault v2 — Toast Component
   ══════════════════════════════════════════════ */

let container

function getContainer() {
  if (!container) {
    container = document.createElement('div')
    container.id = 'toast-container'
    document.body.appendChild(container)
  }
  return container
}

export function toast(msg, type = 'success', duration = 3500) {
  const c  = getContainer()
  const el = document.createElement('div')
  el.className = `toast-item toast-${type}`
  el.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`
  c.appendChild(el)

  setTimeout(() => {
    el.classList.add('toast-out')
    el.addEventListener('animationend', () => el.remove(), { once: true })
  }, duration)
}

export const toastSuccess = (msg, d) => toast(msg, 'success', d)
export const toastError   = (msg, d) => toast(msg, 'error', d)
