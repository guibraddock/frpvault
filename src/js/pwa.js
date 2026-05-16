/* ══════════════════════════════════════════════
   FRPVault v2 — PWA Install Prompt
   ══════════════════════════════════════════════ */

let deferredPrompt = null

export function initPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault()
    deferredPrompt = e
    showInstallBanner()
  })
  window.addEventListener('appinstalled', () => {
    hideBanner()
  })
}

function showInstallBanner() {
  if (document.getElementById('pwaBanner')) return

  const banner = document.createElement('div')
  banner.id = 'pwaBanner'
  banner.className = 'pwa-banner'
  banner.innerHTML = `
    <span style="font-size:22px">📱</span>
    <span class="pwa-banner-text"><strong>FRPVault</strong> pode ser instalado como app</span>
    <button class="btn btn-primary" id="btnPWAInstall" type="button" style="padding:8px 14px;font-size:13px">Instalar</button>
    <button class="btn btn-ghost" id="btnPWADismiss" type="button" style="padding:8px 10px;font-size:13px">✕</button>
  `
  document.body.appendChild(banner)

  document.getElementById('btnPWAInstall')?.addEventListener('click', async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    hideBanner()
  })

  document.getElementById('btnPWADismiss')?.addEventListener('click', hideBanner)
}

function hideBanner() {
  const b = document.getElementById('pwaBanner')
  if (b) b.remove()
}
