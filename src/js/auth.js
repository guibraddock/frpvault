/* ══════════════════════════════════════════════
   FRPVault v2 — Auth Module
   ══════════════════════════════════════════════ */
import { sb }          from '../supabase/client.js';
import { toastError }  from '../components/toast.js';
let authMode = 'login';

/* ── Traduz erros comuns do Supabase para português ── */
function translateAuthError(msg = '') {
  if (msg.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
  if (msg.includes('Email not confirmed'))        return 'Confirme seu email antes de entrar.';
  if (msg.includes('User already registered'))    return 'Este email já está cadastrado.';
  if (msg.includes('Password should be at least')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (msg.includes('Unable to validate'))         return 'Credenciais inválidas.';
  if (msg.includes('rate limit'))                 return 'Muitas tentativas. Aguarde um momento.';
  return msg;
}  // 'login' | 'register'

/* ── DOM refs ── */
const $ = id => document.getElementById(id);

function showErr(msg) {
  const el = $('authErr');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
}
function clearErr() {
  const el = $('authErr');
  if (el) el.classList.remove('show');
}

export function initAuth({ onSignedIn, onSignedOut }) {
  /* ── Auth state listener ── */
  sb.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      onSignedIn(session.user);
    } else {
      onSignedOut();
    }
  });

  /* ── Tab toggle ── */
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      setAuthMode(tab.dataset.mode);
    });
  });

  /* ── Email/pass submit ── */
  $('btnAuthSubmit')?.addEventListener('click', doEmailAuth);
  $('authPass')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doEmailAuth();
  });

  /* ── Google OAuth ── */
  $('btnGoogle')?.addEventListener('click', doGoogle);
}

export function setAuthMode(mode) {
  authMode = mode;
  clearErr();

  document.querySelectorAll('.auth-tab').forEach(t => {
    t.classList.toggle('on', t.dataset.mode === mode);
  });

  const nameGroup = $('authNameGroup');
  if (nameGroup) nameGroup.style.display = mode === 'register' ? 'block' : 'none';

  const titles = { login: 'Bem-vindo de volta', register: 'Criar conta' };
  const subs   = { login: 'Entre na sua conta',  register: 'Preencha os dados' };
  const btns   = { login: 'Entrar',              register: 'Criar conta' };

  if ($('authTitle'))     $('authTitle').textContent = titles[mode];
  if ($('authSub'))       $('authSub').textContent   = subs[mode];
  if ($('btnAuthSubmit')) $('btnAuthSubmit').textContent = btns[mode];
}

async function doEmailAuth() {
  const email = $('authEmail')?.value.trim();
  const pass  = $('authPass')?.value;
  const btn   = $('btnAuthSubmit');

  clearErr();
  if (!email || !pass) { showErr('Preencha email e senha.'); return; }

  btn.disabled  = true;
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span>';

  try {
    let res;
    if (authMode === 'login') {
      res = await sb.auth.signInWithPassword({ email, password: pass });
    } else {
      res = await sb.auth.signUp({ email, password: pass });
    }

    if (res.error) {
      showErr(translateAuthError(res.error.message));
    } else if (authMode === 'register' && res.data.user && !res.data.session) {
      showErr('✉ Verifique seu email para ativar a conta!');
    }
  } catch (e) {
    showErr(e.message || 'Erro desconhecido');
  } finally {
    btn.disabled    = false;
    btn.textContent = authMode === 'login' ? 'Entrar' : 'Criar conta';
  }
}

async function doGoogle() {
  const { error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
  if (error) showErr(error.message);
}

export async function signOut() {
  await sb.auth.signOut();
}
