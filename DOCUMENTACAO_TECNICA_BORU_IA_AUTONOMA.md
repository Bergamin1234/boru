# 🐺 DOCUMENTAÇÃO TÉCNICA E OPERACIONAL
## BORÜ IA AUTÔNOMA — INTELLIGENT OPERATIONS

**Site Oficial:** [https://www.borucentrodecombate.com](https://www.borucentrodecombate.com)  
**WhatsApp Comercial:** `(69) 99238-4491`  
**Instagram:** `@borucentrodecombate`  

---

## 1. Visão Geral da Arquitetura

A plataforma **BORÜ IA AUTÔNOMA — INTELLIGENT OPERATIONS** é a camada de inteligência artificial operacional integrada nativamente ao ecossistema do **BORÜ Centro de Combate**.

### Módulos Backend (`backend/src/ai/`)
* **`boruAiKnowledge.ts`**: Base de conhecimento oficial do CT BORÜ (planos, valores reais, convênios Wellhub/TotalPass/OAB-RO, grade horária oficial do Mestre Felipe Borü, localização em Porto Velho - RO e instruções de sistema com proteção anti-Prompt Injection).
* **`boruAiTools.ts`**: Implementação das **13 ferramentas autorizadas (Function Calling)** com validação de permissões e registro em log de auditoria (`AiOperationAuditLog`):
  1. `consultar_aluno`
  2. `consultar_plano`
  3. `consultar_financeiro`
  4. `consultar_horarios`
  5. `consultar_disponibilidade`
  6. `cadastrar_interessado`
  7. `agendar_aula_experimental`
  8. `atualizar_crm`
  9. `registrar_solicitacao`
  10. `enviar_cobranca_autorizada`
  11. `consultar_pagamento`
  12. `registrar_atendimento`
  13. `transferir_atendimento_humano`
* **`boruAiBrain.ts`**: Motor de compreensão de linguagem natural (texto, transcrição de áudio, gírias brasileiras, abreviações), identificação 360° do contato (`ALUNO`, `EX_ALUNO`, `RESPONSAVEL`, `LEAD`), integração `@google/genai` com orquestrador NLU nativo determinístico e gatilhos automáticos de segurança/handoff.
* **`whatsappService.ts`**: Controlador central de estado no backend (`ATIVAR IA` / `DESATIVAR IA` e modos `IA_AUTONOMA`, `IA_ASSISTIDA`, `MODO_MANUAL`), cliente de envio e parser de Webhook da **WhatsApp Business Cloud API** com controle de idempotência (`externalMessageId`).
* **`followUpEngine.ts`**: Motor de follow-up inteligente com controle de janela comercial, limite de tentativas e respeito imediato a `opt-out` (`PARAR` / `SAIR`).
* **`boruAiRoutes.ts`**: Rotas REST para Webhook WhatsApp, Painel de Controle ON/OFF, Inbox Ao Vivo, Aprovação Assistida, Relatórios Exportáveis (CSV/JSON) e Simulador Sandbox.

---

## 2. Controle Centralizado de Estado (Botão Único ON/OFF)

O estado global da automação é persistido na tabela `AiAutomationConfig` no PostgreSQL (Supabase) e verificado antes de qualquer operação:

* **Quando o Administrador clica em `ATIVAR IA` (`enabled = true`):**
  * No modo **`IA_AUTONOMA`**: A IA recebe mensagens, identifica o contato, consulta dados reais, executa as tools permitidas e responde pelo WhatsApp automaticamente.
  * No modo **`IA_ASSISTIDA`**: A IA processa a mensagem e prepara a resposta com `statusEnvio = 'PENDING_APPROVAL'` para o atendente humano aprovar ou editar com 1 clique.
* **Quando o Administrador clica em `DESATIVAR IA` (`enabled = false` ou `mode = 'MODO_MANUAL'`):**
  * Interrompe imediatamente qualquer resposta automática ou envio de follow-up no backend.
  * Continua registrando as mensagens recebidas no histórico (`WhatsAppMessage`) para que os atendentes humanos assumam sem perda de informações.

---

## 3. Guia de Conexão em Produção (Fase 7 — WhatsApp Business Cloud API)

1. Acesse o portal **Meta for Developers** (`developers.facebook.com`) > Seu App WhatsApp Business.
2. Em **WhatsApp > Configuração (Webhook)**, configure:
   * **URL de Callback:** `https://boru-api-fhdn.onrender.com/api/whatsapp/webhook`
   * **Verificar Token (Verify Token):** `boru_ia_webhook_verify_2026` (ou o token configurado na aba *Conexão WhatsApp* do Painel Admin).
   * Assine o campo **`messages`**.
3. Nas variáveis de ambiente do serviço Backend no **Render** (`boru-api-fhdn`), adicione:
   * `WHATSAPP_ACCESS_TOKEN`: Token permanente do usuário do sistema na Meta.
   * `WHATSAPP_PHONE_NUMBER_ID`: ID do número `(69) 99238-4491` na Cloud API.
   * `WHATSAPP_VERIFY_TOKEN`: `boru_ia_webhook_verify_2026`
   * `GEMINI_API_KEY`: Chave da API Google Gemini (`@google/genai`).
