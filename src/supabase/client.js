/* ══════════════════════════════════════════════
   FRPVault v2 — Supabase Client
   As credenciais vêm do arquivo .env (local)
   e das Environment Variables do Vercel (prod).
   ══════════════════════════════════════════════ */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('⚠ FRPVault: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos.')
  console.error('Crie um arquivo .env na raiz do projeto. Veja .env.example.')
}

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
