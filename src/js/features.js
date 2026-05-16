/* ══════════════════════════════════════════════
   FRPVault v2 — Features Extra
   · Exportar CSV
   · Duplicar registro
   · Ordenação
   · Atalhos de teclado
   ══════════════════════════════════════════════ */
import { sb }                       from '../supabase/client.js';
import { toastSuccess, toastError } from '../components/toast.js';
import { openModal }                from './dashboard.js';

/* ══ EXPORTAR CSV ════════════════════════════════ */
export function exportToCSV(records) {
  if (!records || !records.length) {
    toastError('Nenhum registro para exportar.');
    return;
  }

  const headers = ['Marca','Modelo','Android','Data Serviço','Ferramenta','Modo','Binário','Status','Observações','Criado em'];
  const rows = records.map(r => [
    r.marca        || '',
    r.modelo       || '',
    r.android      || '',
    r.data_servico || '',
    r.ferramenta   || '',
    r.modo         || '',
    r.binario      || '',
    r.status === 'sim' ? 'Funcionou' : r.status === 'nao' ? 'Não funcionou' : '',
    (r.obs         || '').replace(/"/g, '""'),
    r.created_at   ? new Date(r.created_at).toLocaleString('pt-BR') : '',
  ].map(v => `"${v}"`).join(','));

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href     = url;
  link.download = `frpvault_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toastSuccess(`${records.length} registros exportados!`);
}

/* ══ DUPLICAR REGISTRO ═══════════════════════════ */
export async function duplicateRecord(record, userId) {
  const { id, created_at, ...payload } = record; // remove id e timestamp
  payload.user_id = userId;
  payload.marca   = payload.marca; // mantém igual

  const { error } = await sb.from('frp_records').insert(payload);
  if (error) { toastError('Erro ao duplicar: ' + error.message); return false; }

  toastSuccess('Registro duplicado!');
  return true;
}

/* ══ ORDENAÇÃO ═══════════════════════════════════ */
export const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Mais recentes' },
  { value: 'created_at_asc',  label: 'Mais antigos'  },
  { value: 'marca_asc',       label: 'Marca A→Z'     },
  { value: 'marca_desc',      label: 'Marca Z→A'     },
  { value: 'status_sim',      label: 'Funcionaram primeiro' },
  { value: 'status_nao',      label: 'Falharam primeiro'   },
];

export function sortRecords(records, sortKey) {
  const arr = [...records];
  switch (sortKey) {
    case 'created_at_asc':
      return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case 'marca_asc':
      return arr.sort((a, b) => (a.marca || '').localeCompare(b.marca || ''));
    case 'marca_desc':
      return arr.sort((a, b) => (b.marca || '').localeCompare(a.marca || ''));
    case 'status_sim':
      return arr.sort((a, b) => (b.status === 'sim' ? 1 : -1));
    case 'status_nao':
      return arr.sort((a, b) => (b.status === 'nao' ? 1 : -1));
    default: // created_at_desc
      return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

/* ══ VALIDAÇÃO DE FORMULÁRIO ═════════════════════ */
export function validateRecordForm() {
  const errors = {};
  const marca  = document.getElementById('fMarca')?.value.trim();
  const modelo = document.getElementById('fModelo')?.value.trim();

  if (!marca)  errors.fMarca  = 'Marca é obrigatória';
  if (!modelo) errors.fModelo = 'Modelo é obrigatório';

  // Aplica estados visuais de erro
  Object.keys(errors).forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.classList.add('input-error');
      el.addEventListener('input', () => el.classList.remove('input-error'), { once: true });
    }
  });

  // Mostra mensagem abaixo dos campos
  document.querySelectorAll('.field-error').forEach(el => el.remove());
  Object.entries(errors).forEach(([fieldId, msg]) => {
    const input = document.getElementById(fieldId);
    if (!input) return;
    const errEl = document.createElement('div');
    errEl.className = 'field-error';
    errEl.textContent = msg;
    input.parentNode.appendChild(errEl);
  });

  return Object.keys(errors).length === 0;
}

/* ══ ATALHOS DE TECLADO ══════════════════════════ */
export function initKeyboardShortcuts({ onNewRecord, onExport, onSearch, onToggleHelp }) {
  document.addEventListener('keydown', e => {
    // Ignora quando está digitando em campos
    const tag = document.activeElement.tagName;
    const editing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);

    // ? → Abre painel de ajuda
    if (e.key === '?' && !editing) {
      e.preventDefault();
      onToggleHelp?.();
      return;
    }

    // N → Novo registro
    if (e.key === 'n' && !editing && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      onNewRecord?.();
      return;
    }

    // / → Foca na busca
    if (e.key === '/' && !editing) {
      e.preventDefault();
      onSearch?.();
      return;
    }

    // Ctrl+E → Exportar CSV
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      onExport?.();
      return;
    }
  });
}
