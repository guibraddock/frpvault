# FRPVault v2 — Guia de Setup e Deploy

## Por que Vite?

O projeto usa ES Modules (`import/export`). Sem um bundler, o browser
tenta carregar cada arquivo via HTTP separado — o que falha em produção
por restrições de CORS e path resolution. O Vite resolve isso:

- **Dev:** serve os arquivos separados em tempo real (hot reload)
- **Build:** junta tudo em um único bundle otimizado para produção
- Os arquivos continuam separados e organizados no seu editor ✓

---

## Estrutura

```
frpvault-vite/
│
├── index.html              ← HTML da app
├── package.json            ← Dependências (Vite + Supabase)
├── vite.config.js          ← Configuração do Vite
├── vercel.json             ← Configuração do Vercel
├── .env.example            ← Template de variáveis de ambiente
├── .gitignore
│
└── src/
    ├── main.js             ← Entry point — orquestra tudo
    │
    ├── css/
    │   ├── variables.css   ← Design tokens (cores, shadows, etc.)
    │   ├── global.css      ← Reset, grid, scrollbar
    │   ├── animations.css  ← Keyframes + classes .anim-*
    │   ├── components.css  ← Botões, inputs, cards, sidebar, modal
    │   └── pages/
    │       ├── auth.css
    │       ├── dashboard.css
    │       └── reset.css
    │
    ├── js/
    │   ├── auth.js         ← Login, cadastro, Google, sign out
    │   ├── dashboard.js    ← CRUD, filtros, ordenação, render
    │   ├── features.js     ← Export CSV, duplicar, atalhos
    │   ├── passwordReset.js← Recuperação de senha completa
    │   └── utils.js        ← Funções utilitárias puras
    │
    ├── components/
    │   ├── commandPalette.js ← ⌘K com busca e navegação por teclado
    │   └── toast.js          ← Notificações
    │
    └── supabase/
        └── client.js       ← Instância do Supabase (lê do .env)
```

---

## Setup Local (primeira vez)

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar o arquivo .env
```bash
cp .env.example .env
```

Edite o `.env` com suas credenciais:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> Encontre no Supabase: **Project Settings → API**

### 3. Rodar em desenvolvimento
```bash
npm run dev
```

Abre automaticamente em `http://localhost:3000`

---

## Banco de Dados (Supabase)

Cole no **SQL Editor** do seu projeto Supabase:

```sql
-- Tabela principal
CREATE TABLE frp_records (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  marca        TEXT NOT NULL,
  modelo       TEXT NOT NULL,
  android      TEXT,
  data_servico DATE,
  ferramenta   TEXT,
  modo         TEXT,
  binario      TEXT,
  obs          TEXT,
  status       TEXT CHECK (status IN ('sim', 'nao')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security — cada usuário só vê seus próprios registros
ALTER TABLE frp_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_owns_records" ON frp_records
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para performance
CREATE INDEX ON frp_records(user_id, created_at DESC);
```

---

## Deploy no Vercel

### Opção A — Via GitHub (recomendado)

1. Suba o projeto para um repositório GitHub
2. Acesse [vercel.com](https://vercel.com) → **Add New Project**
3. Importe o repositório
4. Em **Environment Variables**, adicione:
   - `VITE_SUPABASE_URL` → sua URL
   - `VITE_SUPABASE_ANON_KEY` → sua chave
5. Clique em **Deploy**

O Vercel detecta o `vercel.json` e roda `npm run build` automaticamente.

### Opção B — Via CLI

```bash
npm run build        # Gera a pasta dist/
npx vercel --prod    # Faz deploy (instale com: npm i -g vercel)
```

---

## Configurar URLs no Supabase (OBRIGATÓRIO para reset de senha)

Após o deploy, vá em **Supabase → Authentication → URL Configuration**:

| Campo           | Valor                                    |
|-----------------|------------------------------------------|
| Site URL        | `https://frpvault.vercel.app`            |
| Redirect URLs   | `https://frpvault.vercel.app/*`          |

> Sem isso, o link de recuperação de senha não vai funcionar.

---

## Atalhos de Teclado

| Tecla   | Ação                  |
|---------|-----------------------|
| `N`     | Novo registro         |
| `/`     | Focar na busca        |
| `⌘K`    | Command Palette       |
| `⌘E`    | Exportar CSV          |
| `?`     | Painel de atalhos     |
| `Esc`   | Fechar modal / paleta |

---

## Features

- ✅ Login / Cadastro / Google OAuth
- ✅ Recuperação de senha por email
- ✅ Password strength meter
- ✅ CRUD completo de registros
- ✅ Busca full-text + filtros + ordenação (6 modos)
- ✅ Exportar CSV (abre corretamente no Excel)
- ✅ Duplicar registro
- ✅ Command Palette com 8 comandos e navegação por teclado
- ✅ Stats: total, funcionaram, falharam, marcas, taxa de sucesso %
- ✅ Skeleton loading + empty states
- ✅ Validação inline de formulário
- ✅ Sidebar responsiva (mobile-first)
- ✅ Scroll to top
- ✅ Animações e estética cyber/neon premium
