# 📋 DOCUMENTAÇÃO COMPLETA DO SISTEMA CT BORÜ COMBAT
**Centro de Treinamento e Academia de Artes Marciais Borü**

---

## 📌 1. Visão Geral do Projeto
O **Sistema CT Borü** é uma plataforma full-stack moderna voltada à gestão integral de centros de treinamento e artes marciais (Muay Thai, Jiu-Jitsu, Boxe, MMA e Taekwondo).
O sistema integra:
- **Landing Page Institucional:** Apresentação da academia, mestre Felipe Borü, modalidades, galeria de fotos reais, planos responsivos e localização interativa.
- **Portal do Aluno:** Autoatendimento com login seguro (CPF/senha), checagem de frequência, situação financeira (mensalidades/Pix), avisos da academia e módulo interativo de gamificação.
- **Painel Administrativo:** Gestão de alunos, turmas, professores, controle de caixa/mensalidades, emissão de cobranças, frequência diária, agendamento de aulas experimentais e painel da Trilha do Nak Muay.
- **Módulo Trilha do Nak Muay (Gamificação):** 6 patentes tradicionais e 30 conquistas desbloqueáveis baseadas em assiduidade, pontualidade e eventos.
- **Checkout Inteligente:** Integração direta com opções de planos mensais (2x, 3x, 5x, Livre) e treino avulso (Diária), além de parcerias com Wellhub e TotalPass.

---

## 🌐 2. URLs de Produção e Ambientes

| Recurso | URL / Endpoint | Provedor / Hospedagem |
| :--- | :--- | :--- |
| **Frontend Web** | [https://boru-lime.vercel.app](https://boru-lime.vercel.app) | Vercel (Edge Network) |
| **Backend API REST** | [https://boru-api-fhdn.onrender.com](https://boru-api-fhdn.onrender.com) | Render (Web Service Node.js) |
| **Healthcheck API** | [https://boru-api-fhdn.onrender.com/](https://boru-api-fhdn.onrender.com/) | Retorna `{ status: "online", ... }` |
| **Repositório GitHub** | [https://github.com/Bergamin1234/boru](https://github.com/Bergamin1234/boru) | GitHub (Branch: `master`) |
| **Banco de Dados Cloud**| `aws-1-us-west-2.pooler.supabase.com:6543/postgres` | Supabase (PostgreSQL 15) |

---

## 🛠️ 3. Arquitetura e Stack Tecnológica

### Frontend
- **Framework & Ferramentas:** React 18, TypeScript, Vite 5.
- **Estilização & UI:** Tailwind CSS, Lucide Icons, Paleta Dark Combat (Zinc 900/950, Tons Dourados e Vermelhos).
- **Consumo de API:** Axios com fallback automático para a URL do Render em produção.

### Backend
- **Runtime & Servidor:** Node.js, Express, TypeScript.
- **ORM & Banco de Dados:** Prisma ORM com suporte dual:
  - SQLite local (`backend/prisma/dev.db`) para desenvolvimento offline.
  - PostgreSQL no Supabase (com Connection Pooling PgBouncer) para produção.
- **Segurança & Autenticação:** Criptografia BCrypt para senhas e identificação por CPF/matrícula.

---

## 🗄️ 4. Modelagem de Dados (Prisma Schema)

1. **`Usuario`**: Administradores e Professores (Nome, CPF, Senha com hash, Cargo, Modalidade, Prajied/Graduação, Grade de Aulas).
2. **`Aluno`**: Alunos matriculados (Nome, CPF, Email, Telefone, Plano, Modalidade, Prajied, Flag de Primeiro Acesso).
3. **`Mensalidade`**: Controle financeiro (Valor, Data de Vencimento, Data de Pagamento, Status: `PENDENTE`, `PAGO`, `ATRASADO`).
4. **`EventoDeAula` & `AgendamentoPresenca`**: Calendário de turmas e registro de presença com metadados para gamificação (Turno, Chegada adiantada, Condição climática, Foto de comprovante).
5. **`AgendamentoExperimental`**: CRM de leads para novas matrículas (Nome, Telefone, Horário, Status).
6. **`Aviso`**: Mural de recados oficiais da academia com suporte a avisos urgentes ou graduais.
7. **`Produto`**: Catálogo da loja da academia (Equipamentos, Luvas, Bandagens, Suplementos).
8. **`GamificationRank` & `GamificationAchievement` & `UserAchievementProgress`**: Sistema completo da Trilha do Nak Muay com cálculo automático de XP, patentes e medalhas.

---

## 📊 5. Análise de Contribuições e Autoria no GitHub
**Repositório Analisado:** `https://github.com/Bergamin1234/boru`  
**Data da Auditoria:** 27 de Outubro de 2026

### 5.1. Métricas Consolidadas do Git
- **Total de Commits Registrados:** 55 commits.
- **Commits por Colaborador:**
  - **Ítalo Bergamin (`Bergamin` / `Bergamin1234`):** **47 commits (85,45%)**
  - **Wernnon (`WELyZ` / `wernnon`):** **8 commits (14,55%)** *(sendo 3 commits apenas de merges de branches/PRs e 5 de conteúdo direto)*.

### 5.2. Escopo de Trabalho de Cada Autor

#### 👤 Ítalo Bergamin (Autor Principal & Tech Lead)
- **Criação & Arquitetura:** Criou o repositório inicial (`First Commit Project Boru`), estruturou todo o backend Express e o frontend React/Vite.
- **Funcionalidades Centrais:**
  - Sistema de cobrança e checkout Pix/Cartão.
  - Portal do Aluno com fluxo de redefinição de primeiro acesso e autenticação segura.
  - Painel Administrativo completo (gestão de alunos, turmas, presenças, planos e financeiro).
  - Modelagem do banco de dados relacional via Prisma ORM (SQLite & PostgreSQL Supabase).
  - Criação do módulo de Gamificação "Trilha do Nak Muay" (6 patentes, 30 conquistas e motor de cálculo assíncrono).
  - Deploy em nuvem (Vercel + Render + Supabase com connection pooling).
  - Redesign da landing page, modernização da seção de planos e otimização mobile.
- **Participação de Código Fonte Original:** **> 95% do projeto**.

#### 👤 Wernnon (Colaborador Frontend / Documentação)
- **Contribuições:**
  - Ajustes de formatação e estrutura descritiva no `README.md` (Commits `0df41c4`, `16a35ed`, `c14e524`).
  - Apoio pontual na refatoração do frontend em 22/10/2026: extração do componente `NoticeCard.tsx` e pequenos ajustes visuais em `AdminDashboard.tsx` e `PortalAluno.tsx` (Commit `aa318a7`, +163 linhas / -103 linhas).
  - Merges de Pull Requests (`b95b0a7`, `cb122ff`, `4d9add5`).
- **Participação de Código Fonte Original:** **~ 3% a 5% do projeto**.

---

## 💰 6. Proposta de Percentual de Comissão e Divisão de Mérito

Com base nas métricas de código, commits, horas investidas e responsabilidade técnica (arquitetura, backend, banco de dados, regras de negócio e infraestrutura de deploy):

| Colaborador | Papel no Projeto | % de Commits | % de Linhas / Impacto Técnico | % Sugerido de Comissão / Divisão |
| :--- | :--- | :--- | :--- | :--- |
| **Ítalo Bergamin** | Autor Principal, Arquiteto & Full-Stack Lead | **85,5%** | **95,0%** | **90% a 95%** |
| **Wernnon** | Colaborador Pontual (Refatoração & Docs) | **14,5%** | **5,0%** | **5% a 10%** *(ou remuneração fixa de apoio)* |

> **Nota:** Em padrões de engenharia de software e parcerias societárias, colaboradores que atuam em ajustes pontuais de documentação e revisão de componentes costumam receber entre **5% a 10%** do valor total de comissão da entrega, ou um valor pontual acordado por horas de refatoração, cabendo ao arquiteto e desenvolvedor líder a cota majoritária (**90% a 95%**).

---

## 🚀 7. Instruções de Manutenção e Atualização

### Rodar Localmente
```bash
# Na raiz do projeto:
npm install
npm run dev
# Ou executar o arquivo iniciar.bat (Windows)
```

### Publicar Alterações no GitHub / Vercel
```bash
git add .
git commit -m "feat: sua modificacao aqui"
git push origin master
# O deploy na Vercel e no Render ocorre automaticamente via webhook do GitHub.
```
