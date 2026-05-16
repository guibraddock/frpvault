/* ══════════════════════════════════════════════
   FRPVault v2 — Analytics Module
   ══════════════════════════════════════════════ */
import { esc, strColor } from './utils.js'

export function renderAnalytics(records, containerId = 'analyticsContainer') {
  const el = document.getElementById(containerId)
  if (!el) return

  if (!records.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Sem dados ainda</div><div class="empty-desc">Adicione registros para ver os gráficos.</div></div>`
    return
  }

  // — Por marca
  const byBrand = {}
  records.forEach(r => {
    if (!r.marca) return
    if (!byBrand[r.marca]) byBrand[r.marca] = { ok: 0, fail: 0, total: 0 }
    byBrand[r.marca].total++
    if (r.status === 'sim') byBrand[r.marca].ok++
    if (r.status === 'nao') byBrand[r.marca].fail++
  })
  const brands = Object.entries(byBrand).sort((a, b) => b[1].total - a[1].total).slice(0, 8)
  const maxBrand = Math.max(...brands.map(b => b[1].total), 1)

  // — Por mês (últimos 6)
  const byMonth = {}
  records.forEach(r => {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    if (!byMonth[key]) byMonth[key] = 0
    byMonth[key]++
  })
  const months = Object.entries(byMonth).sort((a,b) => a[0].localeCompare(b[0])).slice(-6)
  const maxMonth = Math.max(...months.map(m => m[1]), 1)

  // — Por ferramenta
  const byTool = {}
  records.forEach(r => {
    if (!r.ferramenta) return
    byTool[r.ferramenta] = (byTool[r.ferramenta] || 0) + 1
  })
  const tools = Object.entries(byTool).sort((a,b) => b[1]-a[1]).slice(0, 6)
  const maxTool = Math.max(...tools.map(t => t[1]), 1)

  // — Taxa por marca
  const rateByBrand = brands.map(([name, d]) => ({
    name,
    rate: d.total > 0 ? Math.round((d.ok / d.total) * 100) : 0,
  }))

  el.innerHTML = `
    <div class="analytics-grid">

      <div class="chart-card">
        <div class="chart-title">Registros por marca</div>
        ${brands.length ? brands.map(([name, d]) => `
          <div class="bar-row">
            <span class="bar-label" title="${esc(name)}">${esc(name)}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(d.total/maxBrand)*100}%;background:${strColor(name)}"></div>
            </div>
            <span class="bar-val">${d.total}</span>
          </div>`).join('') : '<div style="color:var(--txt3);font-size:13px">Sem dados</div>'}
      </div>

      <div class="chart-card">
        <div class="chart-title">Taxa de sucesso por marca</div>
        ${rateByBrand.length ? rateByBrand.map(({ name, rate }) => `
          <div class="bar-row">
            <span class="bar-label" title="${esc(name)}">${esc(name)}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${rate}%;background:${rate>=70?'var(--ac)':rate>=40?'var(--yellow)':'var(--red)'}"></div>
            </div>
            <span class="bar-val">${rate}%</span>
          </div>`).join('') : '<div style="color:var(--txt3);font-size:13px">Sem dados</div>'}
      </div>

      <div class="chart-card">
        <div class="chart-title">Registros por mês</div>
        ${months.length ? months.map(([key, count]) => {
          const [yr, mo] = key.split('-')
          const label = new Date(+yr, +mo-1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
          return `
          <div class="bar-row">
            <span class="bar-label">${label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(count/maxMonth)*100}%;background:var(--ac2)"></div>
            </div>
            <span class="bar-val">${count}</span>
          </div>`}).join('') : '<div style="color:var(--txt3);font-size:13px">Sem dados</div>'}
      </div>

      <div class="chart-card">
        <div class="chart-title">Top ferramentas</div>
        ${tools.length ? tools.map(([name, count]) => `
          <div class="bar-row">
            <span class="bar-label" title="${esc(name)}">${esc(name)}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:${(count/maxTool)*100}%;background:var(--ac3)"></div>
            </div>
            <span class="bar-val">${count}</span>
          </div>`).join('') : '<div style="color:var(--txt3);font-size:13px">Sem dados</div>'}
      </div>

    </div>
  `
}
