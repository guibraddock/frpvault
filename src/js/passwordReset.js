/* ══════════════════════════════════════════════
   FRPVault v2 — Password Reset Module

   Fluxo completo:
   1. "Esqueci a senha" → abre resetScreen
   2. Digita email → sendResetEmail() → Supabase envia link
   3. Usuário clica no link → volta com type=recovery no hash
   4. app.js detecta e abre newPassScreen
   5. updatePassword() → senha atualizada → reload
   ══════════════════════════════════════════════ */
import { sb }                       from '../supabase/client.js';
import { toastSuccess, toastError } from '../components/toast.js';

const $ = id => document.getElementById(id);

/* ── Password strength score 0–4 ── */
export function getPasswordStrength(pass = '') {
  if (!pass) return 0;
  let s = 0;
  if (pass.length >= 8)           s++;
  if (pass.length >= 12)          s++;
  if (/[A-Z]/.test(pass))         s++;
  if (/[0-9]/.test(pass))         s++;
  if (/[^a-zA-Z0-9]/.test(pass)) s++;
  return Math.min(4, s);
}

/* ── Init (chama uma vez no boot) ── */
export function initPasswordReset() {
  // Abrir tela de reset
  $('btnForgotPassword')?.addEventListener('click', showForgotPassword);

  // Voltar para login
  $('btnResetBack')?.addEventListener('click', () => {
    $('resetScreen')?.classList.remove('on');
    $('authScreen')?.classList.add('on');
    resetFormToInitialState();
  });

  // Enviar email
  $('btnSendReset')?.addEventListener('click', sendResetEmail);
  $('resetEmail')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendResetEmail();
  });

  // Salvar nova senha (tela após link do email)
  $('btnUpdatePass')?.addEventListener('click', updatePassword);
  $('newPassConfirm')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') updatePassword();
  });
}

function showForgotPassword() {
  // Pré-preenche com o email já digitado
  const authEmail = $('authEmail')?.value.trim();
  if (authEmail) { const el = $('resetEmail'); if (el) el.value = authEmail; }

  $('authScreen')?.classList.remove('on');
  $('resetScreen')?.classList.add('on');
  clearErr('resetErr');

  setTimeout(() => $('resetEmail')?.focus(), 100);
}

async function sendResetEmail() {
  const email = $('resetEmail')?.value.trim();
  const btn   = $('btnSendReset');
  clearErr('resetErr');

  if (!email)              { showErr('resetErr', 'Digite seu email.'); return; }
  if (!isValidEmail(email)){ showErr('resetErr', 'Email inválido.'); return; }

  btn.disabled    = true;
  btn.innerHTML   = '<span class="spinner"></span> Enviando...';

  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname,
  });

  btn.disabled    = false;
  btn.textContent = 'Enviar link de recuperação';

  if (error) { showErr('resetErr', error.message); return; }

  // Mostra tela de sucesso
  const formView    = $('resetFormView');
  const successView = $('resetSuccessView');
  if (formView)    formView.style.display    = 'none';
  if (successView) successView.style.display = 'flex';
}

async function updatePassword() {
  const newPass = $('newPassInput')?.value;
  const confirm = $('newPassConfirm')?.value;
  const btn     = $('btnUpdatePass');
  clearErr('newPassErr');

  if (!newPass || newPass.length < 6) {
    showErr('newPassErr', 'A senha deve ter pelo menos 6 caracteres.');
    return;
  }
  if (newPass !== confirm) {
    showErr('newPassErr', 'As senhas não coincidem.');
    $('newPassConfirm')?.classList.add('input-error');
    return;
  }

  btn.disabled    = true;
  btn.innerHTML   = '<span class="spinner"></span> Salvando...';

  const { error } = await sb.auth.updateUser({ password: newPass });

  btn.disabled    = false;
  btn.textContent = 'Salvar nova senha';

  if (error) { showErr('newPassErr', error.message); return; }

  toastSuccess('Senha atualizada com sucesso!');
  $('newPassScreen')?.classList.remove('on');

  // Dá um tempo para o toast aparecer, depois recarrega
  setTimeout(() => window.location.reload(), 1800);
}

/* ── Helpers ── */
function showErr(id, msg) {
  const el = $(id);
  if (el) { el.textContent = msg; el.classList.add('show'); }
}
function clearErr(id) {
  const el = $(id);
  if (el) el.classList.remove('show');
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function resetFormToInitialState() {
  const formView    = $('resetFormView');
  const successView = $('resetSuccessView');
  if (formView)    formView.style.display    = '';
  if (successView) successView.style.display = 'none';
  clearErr('resetErr');
  const emailEl = $('resetEmail');
  if (emailEl) emailEl.value = '';
}
