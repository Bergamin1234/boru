# 🥋 BORÜ Centro de Combate — Relatório de Produção & Manual de Manutenção Futura

Este documento reúne o **Relatório Oficial de Entrega para Produção** e o **Tutorial Completo de Manutenção** para que você possa editar textos, preços, senhas, regras de negócio ou banco de dados no futuro com total segurança.

---

## 📋 1. Relatório de Entrega (Estado Atual do Sistema)

### 1.1. Limpeza Completa de Dados de Teste (Produção Limpa)
O banco de dados em nuvem (**Supabase PostgreSQL**) e o banco local de fallback foram integralmente higienizados para entrega ao cliente, mantendo **100% da estrutura das tabelas intacta**:

| Tabela / Módulo | Registros Atuais | Observação |
| :--- | :---: | :--- |
| **`Usuario` (Equipe)** | **1** | Apenas o Administrador Master (`BrgAdmin`) |
| **`Aluno`** | **0** | Todos os alunos fictícios de teste foram removidos |
| **`Mensalidade`** | **0** | Histórico financeiro zerado para início da operação |
| **`AgendamentoPresenca`** | **0** | Chamadas e check-ins de teste removidos |
| **`EventoDeAula`** | **0** | Grade limpa para operação real |
| **`AgendamentoExperimental`** | **0** | Leads de teste removidos |
| **`Aviso` (Mural)** | **0** | Comunicados fictícios removidos |
| **`Produto` (Loja)** | **0** | Produtos de demonstração removidos |
| **`UserAchievementProgress`** | **0** | Progresso de conquistas zerado |
| **`GamificationRank`** | **6** | Estrutura oficial de patentes da *Trilha do Nak Muay* preservada |
| **`GamificationAchievement`** | **30** | Catálogo oficial de 30 medalhas/conquistas ativo |

### 1.2. Segurança na Tela de Login (`/admin`)
- O texto de dica (*placeholder*) do campo de login em [`frontend/src/pages/AdminDashboard.tsx`](frontend/src/pages/AdminDashboard.tsx) foi alterado de `"Usuário (BrgAdmin) ou CPF do Professor"` para **`"Usuário ou CPF do Professor"`**, garantindo que visitantes não vejam o login do Administrador Master exposto na tela.

### 1.3. Infraestrutura Conectada (Arquitetura em Nuvem)
- **Frontend (Hospedagem Web):** Publicado na **Vercel** (`boru-lime.vercel.app`), com roteamento SPA configurado (`vercel.json`).
- **Backend (API Node.js + Express + Prisma):** Publicado no **Render** (`boru-api-fhdn.onrender.com`), com endpoint de healthcheck ativo (`GET /`) e CORS configurado.
- **Banco de Dados (PostgreSQL):** Hospedado no **Supabase** (`us-west-2`), utilizando *Transaction Pooler* (porta `6543`) para execução rápida e *Session Pooler* (porta `5432`) para migrações do Prisma.

---

## 🔐 2. Credenciais e Fluxos de Acesso

1. **Administrador Master (`/admin`):**
   - **Login:** `BrgAdmin` *(ou `brgadmin@boru.com`)*
   - **Senha:** `BoruCentroDeCombate98490@!`
   - **Permissões:** Acesso total a todas as abas, gestão financeira, cadastro/exclusão de professores, redefinição de senhas de professores, loja, avisos e configuração da Gamificação.

2. **Professores (`/admin`):**
   - **Como criar:** O Administrador acessa a aba **Equipe / Professores** e cadastra o professor informando Nome, **CPF** (obrigatório), Modalidade, Graduação e Senha inicial.
   - **Como logar:** O professor acessa `/admin` digitando apenas o seu **CPF** e a senha criada pelo Administrador.

3. **Alunos (`/portal`):**
   - **Como criar:** Cadastrados pelo Admin/Professor na aba **Alunos** (ou convertidos a partir de uma Aula Experimental). O sistema gera uma senha temporária de 6 dígitos.
   - **Como logar:** O aluno acessa `/portal` com seu **CPF** e senha temporária; no primeiro acesso, o próprio sistema solicita que ele defina sua senha definitiva.

---

## 🛠️ 3. Tutorial: Como Modificar o Sistema Futuramente

### 3.1. Mapa de Arquivos do Projeto
Sempre que quiser alterar algo específico, consulte este mapa direto:

```text
boru/
├── frontend/
│   ├── index.html                           # Página Inicial (Landing Page, fotos, textos, horários e WhatsApp)
│   ├── vercel.json                          # Configuração de rotas da Vercel (evita erro 404 ao dar F5)
│   └── src/
│       ├── services/api.ts                  # Conexão Axios com a URL da API (VITE_API_URL)
│       ├── pages/
│       │   ├── AdminDashboard.tsx           # Painel Administrativo e de Professores (/admin)
│       │   ├── PortalAluno.tsx              # Portal do Aluno (/portal)
│       │   ├── AgendarAula.tsx              # Página de Agendamento Experimental (/agendar)
│       │   └── Checkout.tsx                 # Página de Pré-Matrícula (/checkout)
│       └── components/
│           ├── AdminGamificationTab.tsx     # Aba de Gestão da Gamificação (Admin/Professor)
│           └── StudentGamificationTab.tsx   # Aba "Trilha do Nak Muay" dentro do Portal do Aluno
│
└── backend/
    ├── .env                                 # Variáveis secretas locais (DATABASE_URL e DIRECT_URL do Supabase)
    ├── prisma/
    │   ├── schema.prisma                    # Estrutura de todas as tabelas do Banco de Dados
    │   └── seed.ts                          # Script de limpeza/reset para estado limpo de produção
    └── src/
        ├── server.ts                        # Servidor principal Express, rotas da API, Login Admin e Planos
        ├── gamificationRoutes.ts            # Rotas de API da Gamificação
        └── gamificationService.ts           # Regras das 30 conquistas, 6 ranks e cálculo de XP/Streaks
```

---

### 3.2. Cenários Comuns de Modificação

#### A) Como alterar o Login ou a Senha do Administrador Master (`BrgAdmin`)
1. Abra o arquivo [`backend/src/server.ts`](backend/src/server.ts) por volta da **linha 50**:
   ```typescript
   const isAdminLogin = (termoLower === 'brgadmin' || termoLower === 'brgadmin@boru.com' ...);
   if (isAdminLogin) {
     if (senha !== 'BoruCentroDeCombate98490@!') { ... }
   ```
2. Substitua `'BoruCentroDeCombate98490@!'` pela nova senha desejada nas linhas correspondentes (linhas 54, 74, 80 e 85).

#### B) Como alterar Preços dos Planos
1. **Na Vitrine do Site (Landing Page):** Edite os valores exibidos nos cards de planos dentro de [`frontend/index.html`](frontend/index.html).
2. **Na Regra do Sistema (Backend):** Abra [`backend/src/server.ts`](backend/src/server.ts) (por volta da linha 765) onde ficam os valores padrão de criação de mensalidade:
   ```typescript
   if (plano === '2x na semana') valorFinal = 130.00;
   else if (plano === '3x na semana') valorFinal = 160.00;
   else if (plano === 'Todos os Horários') valorFinal = 280.00;
   else if (plano === 'Diária') valorFinal = 40.00;
   ```

#### C) Como alterar Números de WhatsApp, Textos ou Fotos da Página Inicial
1. Abra [`frontend/index.html`](frontend/index.html).
2. Use `Ctrl + F` para buscar o texto atual ou número de telefone (`5569...`) e substitua pelo novo.
3. As imagens públicas ficam na pasta `frontend/public/` (ex: `logo-boru.jpg`). Para trocar uma imagem mantendo o mesmo nome, basta substituir o arquivo dentro de `frontend/public/`.

#### D) Como adicionar ou modificar Ranks e Conquistas da Gamificação
1. **Pelo próprio Painel (Sem programar):** Acesse `/admin` com `BrgAdmin`, clique na aba **🏆 Gamificação**, e use os botões de criar/editar conquistas ou patentes diretamente pela tela.
2. **Pelo Código (Padrões de Fábrica):** Edite as listas `DEFAULT_RANKS` e `DEFAULT_ACHIEVEMENTS` em [`backend/src/gamificationService.ts`](backend/src/gamificationService.ts).

#### E) Como criar um novo campo ou tabela no Banco de Dados (Supabase)
1. Edite o arquivo [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma).
2. Abra o terminal na pasta `backend` e execute:
   ```bash
   npx prisma db push
   ```
   *(Isso atualizará as tabelas no Supabase automaticamente sem apagar os dados existentes).*

---

### 3.3. Como Publicar Suas Alterações na Web (Deploy Automático)

Como o seu **Render** (Backend) e a sua **Vercel** (Frontend) estão conectados ao repositório `Bergamin1234/boru` no GitHub, **você não precisa refazer configurações de nuvem quando alterar o código**.

Sempre que fizer qualquer modificação no VS Code:

1. Teste se o código compila sem erros rodando na raiz do projeto:
   ```bash
   npm run build
   ```
2. Envie para o GitHub com os 3 comandos abaixo:
   ```bash
   git add .
   git commit -m " descreva aqui o que voce alterou "
   git push origin master
   ```
3. **Pronto!** Em menos de 1 minuto:
   - A **Vercel** detecta o `git push` e atualiza o site automaticamente.
   - O **Render** detecta o `git push` e atualiza a API automaticamente.

---

### 3.4. Como Conectar o Domínio `.com.br` Oficial na Vercel
Quando o cliente tiver o domínio `.com.br` (ex: `borucentrodecombate.com.br` no Registro.br):
1. No painel da **Vercel**, entre no projeto -> aba **Settings** -> **Domains**.
2. Digite o domínio `seudominio.com.br` e clique em **Add**.
3. A Vercel mostrará dois registros DNS (um tipo **A** apontando para o IP da Vercel e um **CNAME** para `www`).
4. Basta colar esses dois registros no painel do Registro.br e o certificado HTTPS (cadeado de segurança) será gerado automaticamente!
