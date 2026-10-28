import React, { useState } from 'react';
import { studentApi } from '../services/api';

interface ContractProps {
  aluno: any;
  onContractSigned: (alunoAtualizado: any, assinaturaPayload: any) => void;
}

export const ContractDocumentContent: React.FC<{
  aluno: any;
  assinaturaPayload?: any;
}> = ({ aluno, assinaturaPayload }) => {
  let payload = assinaturaPayload;
  if (!payload && aluno?.contract_signature_payload) {
    try {
      payload = JSON.parse(aluno.contract_signature_payload);
    } catch {
      payload = null;
    }
  }

  const dataAdesao = aluno?.data_de_adesao
    ? new Date(aluno.data_de_adesao)
    : new Date();
  const diaVencimento = dataAdesao.getDate();

  return (
    <div className="bg-[#0E0E11] border border-zinc-800 rounded-2xl p-5 sm:p-7 text-zinc-300 text-xs sm:text-sm leading-relaxed space-y-4">
      <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
            Instrumento Particular de Adesão e Prestação de Serviços
          </span>
          <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
            CONTRATO OFICIAL DE MATRÍCULA — BORÜ CENTRO DE COMBATE 🐺
          </h3>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-zinc-900 border border-zinc-700 text-zinc-300 self-start">
          Via Eletrônica Auditável
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#151519] border border-zinc-800/90 rounded-xl p-3.5 text-xs">
        <div>
          <span className="text-zinc-500 block text-[10px] uppercase font-bold">Contratante (Aluno)</span>
          <strong className="text-white">{aluno?.nome}</strong>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px] uppercase font-bold">CPF Registrado</span>
          <strong className="text-white font-mono">{aluno?.cpf || 'Registrado na Secretaria'}</strong>
        </div>
        <div>
          <span className="text-zinc-500 block text-[10px] uppercase font-bold">Plano & Vencimento Fixo</span>
          <strong className="text-amber-400">
            {aluno?.is_bolsista
              ? 'Bolsista Integral (Isento)'
              : `${aluno?.plano || '2x na semana'} • Todo dia ${String(diaVencimento).padStart(2, '0')}`}
          </strong>
        </div>
      </div>

      <div className="space-y-3 text-xs text-zinc-300 max-h-[340px] overflow-y-auto pr-2">
        <p>
          <strong>CLÁUSULA 1ª — DO OBJETO:</strong> O presente contrato tem por objeto a prestação de serviços de instrução e treinamento esportivo na modalidade de <strong>{aluno?.modalidade || 'Muay Thai'}</strong> pelo <strong>BORÜ CENTRO DE COMBATE</strong>, localizado na Rua Doutor Agenor de Carvalho, n° 1168, Bairro Agenor de Carvalho, Porto Velho - RO.
        </p>
        <p>
          <strong>CLÁUSULA 2ª — DA DATA DE ADESÃO E VENCIMENTO FINANCEIRO:</strong> A data oficial de adesão do(a) ALUNO(A) fixa o dia <strong>{String(diaVencimento).padStart(2, '0')}</strong> de cada mês como data base de vencimento das mensalidades subsequentes, conforme o plano contratado (<strong>{aluno?.plano || '2x na semana'}</strong>). Alunos contemplados com bolsa esportiva (<em>Bolsistas</em>) possuem isenção enquanto vigente o benefício.
        </p>
        <p>
          <strong>CLÁUSULA 3ª — DA FREQUÊNCIA, CHECK-IN E CONDUTA MARCIAL:</strong> O(A) ALUNO(A) compromete-se a realizar o registro de presença (Check-in Rápido ou confirmação na chamada do professor) em todas as aulas frequentadas, respeitar as normas de disciplina, higiene, uso de equipamentos de proteção (luvas, caneleiras, bandagens e protetor bucal) e acatar as orientações técnicas dos Professores e Mestres do CT Borü.
        </p>
        <p>
          <strong>CLÁUSULA 4ª — DA APTIDÃO FÍSICA E COMUNICAÇÃO DE AUSÊNCIAS:</strong> O(A) ALUNO(A) declara estar apto(a) para a prática de atividades físicas de contato e combate, comprometendo-se a informar imediatamente à equipe técnica qualquer restrição médica ou lesão, utilizando o Portal do Aluno para justificar ausências por motivo de saúde quando necessário.
        </p>
        <p>
          <strong>CLÁUSULA 5ª — DA VALIDADE DA ASSINATURA ELETRÔNICA:</strong> Nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020, o aceite eletrônico mediante autenticação individual por CPF e senha no Portal do Aluno constitui assinatura eletrônica válida, plena e auditável.
        </p>
      </div>

      {/* CARIMBO DIGITAL E AUDITORIA (RENDERIZADO VISUALMENTE NO FINAL DO DOCUMENTO) */}
      {aluno?.has_signed_contract && (
        <div className="mt-4 pt-4 border-t-2 border-dashed border-emerald-500/40 bg-emerald-950/20 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-black">
                  ✓ ASSINADO ELETRONICAMENTE — CARIMBO DE AUDITORIA
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-1">
                Assinante: <span className="text-emerald-300">{payload?.nomeAssinante || aluno?.nome}</span> • CPF: <span className="font-mono text-emerald-300">{payload?.cpfAssinante || aluno?.cpf}</span>
              </p>
              <p className="text-[11px] text-zinc-400">
                Data/Hora do Carimbo (Timestamp):{' '}
                <strong className="text-zinc-200">
                  {payload?.assinadoEmFormatado ||
                    (aluno?.contract_signed_at
                      ? new Date(aluno.contract_signed_at).toLocaleString('pt-BR')
                      : new Date().toLocaleString('pt-BR'))}
                </strong>
              </p>
              <p className="text-[11px] text-zinc-400">
                Data de Adesão Vinculada:{' '}
                <strong className="text-amber-300">
                  {aluno?.data_de_adesao
                    ? new Date(aluno.data_de_adesao).toLocaleDateString('pt-BR')
                    : new Date().toLocaleDateString('pt-BR')}{' '}
                  (Vencimento fixado todo dia {String(diaVencimento).padStart(2, '0')})
                </strong>
              </p>
            </div>

            <div className="bg-black/50 border border-emerald-500/30 rounded-lg p-3 text-left sm:text-right font-mono">
              <span className="text-[9px] uppercase text-zinc-500 block">Hash de Autenticidade</span>
              <span className="text-xs font-bold text-emerald-400">
                {payload?.hashAutenticidade || `BORU-DOC-${String(aluno?.id || '').slice(0, 12).toUpperCase()}`}
              </span>
              <span className="text-[9px] text-zinc-500 block mt-0.5">
                BORÜ CENTRO DE COMBATE • VERIFICADO
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Middleware de Bloqueio Fullscreen no Portal do Aluno quando has_signed_contract == false
 */
export const ContractBlockingModal: React.FC<ContractProps> = ({ aluno, onContractSigned }) => {
  const [aceito, setAceito] = useState(false);
  const [assinando, setAssinando] = useState(false);
  const [erro, setErro] = useState('');

  if (!aluno || aluno.has_signed_contract) return null;

  const handleAssinar = async () => {
    if (!aceito) {
      setErro('Por favor, marque a caixa de seleção confirmando que leu e concorda com o contrato.');
      return;
    }
    setErro('');
    setAssinando(true);
    try {
      const res = await studentApi.signContract(aluno.id, { aceitoTermos: true });
      onContractSigned(res.data.aluno, res.data.assinatura);
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Erro ao registrar assinatura eletrônica. Tente novamente.');
    } finally {
      setAssinando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#141416] border-2 border-red-600/60 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-500/40">
              🔒 Etapa Obrigatória de Onboarding
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
              Leia seu contrato para prosseguir
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Para liberar seu acesso completo ao Portal do Aluno e registrar sua data oficial de adesão, revise e assine eletronicamente seu contrato abaixo.
            </p>
          </div>
        </div>

        <ContractDocumentContent aluno={aluno} />

        {erro && (
          <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-bold">
            {erro}
          </div>
        )}

        <div className="bg-[#1A1A1E] border border-zinc-800 rounded-2xl p-4 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={aceito}
              onChange={(e) => setAceito(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-red-600 rounded"
            />
            <span className="text-xs sm:text-sm text-zinc-200 font-semibold leading-snug">
              Li integralmente e concordo com os termos do Contrato de Prestação de Serviços Esportivos do{' '}
              <strong className="text-white">Borü Centro de Combate</strong>, autorizando a gravação do carimbo eletrônico com meu Nome ({aluno.nome}), CPF ({aluno.cpf || 'registrado'}) e Data/Hora atual.
            </span>
          </label>

          <button
            type="button"
            disabled={!aceito || assinando}
            onClick={handleAssinar}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 disabled:opacity-40 text-white font-black text-xs sm:text-sm uppercase tracking-wider transition shadow-lg shadow-red-600/25"
          >
            {assinando ? 'Gravando Carimbo Eletrônico...' : '✍️ Assinar Contrato Eletrônico e Liberar Painel'}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Aba "Meus Contratos" no Portal do Aluno para consulta permanente
 */
export const MyContractsTab: React.FC<{ aluno: any }> = ({ aluno }) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="bg-[#151518] border border-zinc-800/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            Módulo de Documentos & Auditoria
          </span>
          <h2 className="text-xl font-black text-white mt-0.5">📄 Meus Contratos</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Consulte seu contrato de matrícula assinado eletronicamente, carimbo digital e dia fixo de vencimento.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold border border-zinc-700 transition self-start"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>

      <ContractDocumentContent aluno={aluno} />
    </div>
  );
};
