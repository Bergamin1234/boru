const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'src', 'server.ts');
let content = fs.readFileSync(serverFile, 'utf8');

if (!content.includes('GoogleGenAI')) {
  content = "import { GoogleGenAI } from '@google/genai';\n" + content;
}

const newRoutes = 
// ==========================================
// INTELIGÊNCIA ARTIFICIAL E CHATBOT
// ==========================================
app.post('/api/chat', async (req, res) => {
  const { mensagem } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    const respostas = [
      "Para um jab perfeito, mantenha a guarda alta com a mão de trás!",
      "Lembre-se de girar o pé de apoio quando for chutar com a perna de trás.",
      "A respiração é tudo! Solte o ar junto com o golpe."
    ];
    return res.json({ text: "⚠️ [Modo Offline - Insira a chave GEMINI_API_KEY no .env para ativar a IA] Dica: " + respostas[Math.floor(Math.random() * respostas.length)] });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = "Você é um mestre experiente de Muay Thai do CT Borü. Responda perguntas sobre treinos de forma motivadora, curta e direta (máximo 2 parágrafos). Dê dicas técnicas precisas de artes marciais.\\n\\nPergunta do Aluno: " + mensagem;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ erro: 'Erro ao comunicar com a IA', detalhe: error.message });
  }
});

// ==========================================
// INTEGRAÇÃO DE PAGAMENTO (STRIPE / MERCADO PAGO)
// ==========================================
app.post('/api/pagamentos/processar', async (req, res) => {
  const { alunoId, valor, metodoPagamento, cartaoToken } = req.body;
  
  try {
    // -------------------------------------------------------------
    // ATENÇÃO DESENVOLVEDOR: INSERIR CREDENCIAIS E SDK DO GATEWAY AQUI!
    // -------------------------------------------------------------
    // Exemplo de integração com Mercado Pago:
    // import { MercadoPagoConfig, Payment } from 'mercadopago';
    // const client = new MercadoPagoConfig({ accessToken: 'APP_USR-SEU_ACCESS_TOKEN_AQUI' });
    // const payment = new Payment(client);
    //
    // const result = await payment.create({
    //   body: {
    //     transaction_amount: valor,
    //     token: cartaoToken, // Token gerado no frontend
    //     description: 'Mensalidade CT BORÜ',
    //     payment_method_id: metodoPagamento, // 'pix', 'visa', 'master'
    //     payer: { email: "emaildoaluno@gmail.com" }
    //   }
    // });
    // -------------------------------------------------------------

    let dataPagamento = new Date();
    let status = 'PAGO';

    const mensalidade = await prisma.mensalidade.create({
      data: {
        alunoId: alunoId || 'temp_user',
        valor: parseFloat(valor),
        dataVencimento: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
        dataPagamento,
        status
      }
    });

    res.json({ 
      sucesso: true, 
      mensagem: 'Pagamento processado com sucesso!', 
      transacaoId: 'tx_' + Math.random().toString(36).substring(7),
      mensalidade 
    });
  } catch (error) {
    res.status(500).json({ erro: 'Falha no gateway de pagamento' });
  }
});
;

content = content.replace('const PORT = process.env.PORT || 3001;', newRoutes + '\n\nconst PORT = process.env.PORT || 3001;');
fs.writeFileSync(serverFile, content, 'utf8');
console.log('Routes added!');
