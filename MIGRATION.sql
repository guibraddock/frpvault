-- ══════════════════════════════════════════════
-- FRPVault v2.1 — Migration SQL
-- Cole no SQL Editor do Supabase
-- ══════════════════════════════════════════════

-- Adiciona coluna favorito (se ainda não existir)
ALTER TABLE frp_records
  ADD COLUMN IF NOT EXISTS favorito BOOLEAN DEFAULT FALSE;

-- Índice para filtro de favoritos
CREATE INDEX IF NOT EXISTS idx_frp_favorito
  ON frp_records(user_id, favorito)
  WHERE favorito = TRUE;
