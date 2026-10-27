<div align="center">
  <img src="frontend/public/logo-boru.jpg" alt="Borü Centro de Combate" width="120" style="border-radius: 50%;" />
  <h1>BORÜ CENTRO DE COMBATE</h1>
  <p><strong>Plataforma Integrada de Gestão Marcial, Portal do Aluno & Presença Digital</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-blue?logo=react&style=flat-square" alt="React 18" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
    <img src="https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white&style=flat-square" alt="TailwindCSS" />
    <img src="https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white&style=flat-square" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white&style=flat-square" alt="Express" />
    <img src="https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma&logoColor=white&style=flat-square" alt="Prisma ORM" />
  </p>
</div>

---

## 📌 Sobre o Projeto

O **Borü Centro de Combate** é um ecossistema digital desenvolvido sob medida para academias de artes marciais (Muay Thai, Jiu-Jitsu, Boxe, MMA e Taekwondo). O sistema une a presença institucional moderna da academia a um sistema completo de gestão operacional, frequência em tempo real, acompanhamento pedagógico de graduação e engajamento dos atletas.

Idealizado sob a liderança do mestre **Felipe Borü**, o projeto foi arquitetado com foco em alta performance, experiência mobile-first fluida para os alunos e ferramentas práticas de 1 clique para instrutores e administradores na borda do tatame.

---

## 🌟 Módulos da Plataforma

### 🥊 1. Landing Page Institucional de Alta Conversão
* **Apresentação Oficial:** Filosofia de treino, corpo docente qualificado e estrutura do centro de treinamento.
* **Modalidades Oferecidas:** Apresentação detalhada das artes marciais praticadas no CT (Muay Thai, Boxe, Jiu-Jitsu, MMA e Taekwondo).
* **Agendamento de Aula Experimental:** Captação de novos alunos (leads) diretamente pelo site.
* **Galeria & Identidade Visual:** Galeria dinâmica e imersiva com a identidade e ambiente do dojo.
* **Localização Integrada:** Mapa interativo e coordenadas de acesso facilitado.

### 👤 2. Portal do Aluno (Mobile-First & Gamificado)
* **Design Otimizado para Smartphones:** Navegação inferior ergonômica (*bottom bar*) para acesso rápido a treinos, frequência e mural.
* **Check-in Inteligente:** Confirmação de presença e acompanhamento de treinos na semana.
* **Gamificação Marcial (Streak do Guerreiro):** Contador de semanas consecutivas treinadas, metas de treinos e medalhas marciais desbloqueáveis (*Primeiro Sangue*, *Guerreiro Focado*, *Inabalável*, *Casca Grossa*).
* **Graduação Oficial (Prajied / Faixas):** Acompanhamento visual da evolução técnica e graduação do atleta.
* **Mural de Avisos em Tempo Real:** Comunicados da diretoria e professores sobre exames de faixa, eventos e workshops.
* **Justificativa de Ausência:** Comunicação direta de afastamentos por motivo de saúde ou trabalho.
* **Loja Oficial & Vitrine de Equipamentos:** Catálogo de artigos esportivos (luvas, caneleiras, bandagens e suprimentos) para reserva na recepção.

### 👑 3. Painel Administrativo & Gestão Docente
* **Calendário Geral da Academia:** Grade macro mensal com visualização diária de assiduidade coletiva, faltas e atestados.
* **Chamada Rápida em 1 Clique:** Validação em lote das presenças das turmas na borda do tatame, sem atritos manuais.
* **Indicadores & Métricas de Retenção:**
  * Taxa de assiduidade mensal por aluno com barras de progresso visuais.
  * Identificação proativa de alunos em risco de evasão (&lt; 50% de presença).
  * Canal direto para reengajamento e acolhimento via WhatsApp em 1 clique.
* **Gestão de Planos & Mensalidades:**
  * Suporte a planos mensais recorrentes (2x/semana, 3x/semana, Livre).
  * Suporte completo a planos individuais por passe (Wellhub, TotalPass e Diárias avulsas).
  * Controle de vencimentos e renovação de vigências presenciais no balcão.
* **Gestão do Corpo Docente:** Cadastro e customização de professores por arte marcial, graduação, tempo de docência e horários.
* **Gestão de Leads & Aulas Experimentais:** Funil de conversão de novos visitantes em matrículas ativas.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologias Utilizadas |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Axios |
| **Backend** | Node.js, Express, TypeScript, RESTful API |
| **Banco de Dados & ORM** | SQLite, Prisma ORM |
| **Arquitetura** | Monorepo modularizado com separação clara de responsabilidades |

---

## 📁 Estrutura do Repositório

```text
boru/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Modelagem relacional do banco de dados
│   │   └── seed.ts              # População controlada de dados base
│   ├── src/
│   │   └── server.ts            # Servidor HTTP, regras de negócio e endpoints REST
│   └── package.json
├── frontend/
│   ├── public/                  # Ativos estáticos, fotografias e logos oficiais
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis de interface
│   │   ├── pages/               # Páginas (Landing Page, Portal do Aluno, Painel de Gestão)
│   │   ├── services/            # Integração com API (Axios client)
│   │   └── App.tsx              # Roteador central da aplicação
│   └── package.json
└── package.json                 # Orquestração do projeto
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
* Node.js 18 ou superior instalado.
* Git para clonagem do repositório.

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/Bergamin1234/boru.git
   cd boru
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicialize o banco de dados:
   ```bash
   npm run db:push -w backend
   ```

4. Execute o ambiente de desenvolvimento:
   ```bash
   npm run dev
   ```

* A interface web estará acessível em: `http://localhost:5173`
* A API do servidor estará ativa em: `http://localhost:3001`

---

## 📜 Licença e Direitos

Projeto desenvolvido com exclusividade para o **Borü Centro de Combate**, sob supervisão e coordenação técnica do Mestre **Felipe Borü**. Todos os direitos reservados.
Desenvolvido Por equipe De Desenvolvimento da **Faculdade Unisapiens**
