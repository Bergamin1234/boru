import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface TeacherCommissionConfig {
  professorId: string;
  nome: string;
  modalidade?: string;
  graduacao?: string;
  modelo: 'POR_ALUNO_PRESENTE' | 'POR_MATRICULADO_ATIVO' | 'HIBRIDO';
  valor_por_presenca: number;
  valor_por_matriculado: number;
  bonus_conversao_lead: number;
}

interface TeacherCommissionReportItem {
  professorId: string;
  nome: string;
  modalidade: string;
  mes: number;
  ano: number;
  modelo: string;
  total_presencas: number;
  total_matriculados: number;
  total_conversoes: number;
  valor_comissao_presenca: number;
  valor_comissao_matriculados: number;
  valor_bonus_conversoes: number;
  valor_total: number;
}

export const TeacherCommissionsTab: React.FC = () => {
  const [configs, setConfigs] = useState<TeacherCommissionConfig[]>([]);
  const [relatorio, setRelatorio] = useState<TeacherCommissionReportItem[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Modal de Edição de Regras
  const [configEditando, setConfigEditando] = useState<TeacherCommissionConfig | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [confRes, relRes] = await Promise.all([
        adminApi.getTeacherCommissionConfigs().catch(() => ({ data: [] })),
        adminApi.getTeacherCommissionReport({ mes: mesSelecionado, ano: anoSelecionado }).catch(() => ({ data: [] }))
      ]);

      if (Array.isArray(confRes.data)) {
        setConfigs(confRes.data);
      }
      if (Array.isArray(relRes.data)) {
        setRelatorio(relRes.data);
      }
    } catch (err) {
      console.error('Erro ao carregar comissões:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [mesSelecionado, anoSelecionado]);

  const handleSalvarConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configEditando) return;
    setSalvando(true);
    setErroMsg('');

    try {
      await adminApi.saveTeacherCommissionConfig({
        professorId: configEditando.professorId,
        modelo: configEditando.modelo,
        valor_por_presenca: Number(configEditando.valor_por_presenca) || 0,
        valor_por_matriculado: Number(configEditando.valor_por_matriculado) || 0,
        bonus_conversao_lead: Number(configEditando.bonus_conversao_lead) || 0
      });

      setConfigEditando(null);
      setSucessoMsg('Configuração de comissão atualizada com sucesso!');
      setTimeout(() => setSucessoMsg(''), 4000);
      await carregarDados();
    } catch (err: any) {
      setErroMsg(err.response?.data?.erro || 'Erro ao salvar regras de comissão.');
    } finally {
      setSalvando(false);
    }
  };

  const totalComissoesGeral = relatorio.reduce((acc, curr) => acc + curr.valor_total, 0);
  const totalPresencasGeral = relatorio.reduce((acc, curr) => acc + curr.total_presencas, 0);
  const totalConversoesGeral = relatorio.reduce((acc, curr) => acc + curr.total_conversoes, 0);

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      {/* HEADER DO MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141416] border border-zinc-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🥋</span>
            <span>Comissionamento Dinâmico de Professores</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Cálculo automatizado por presença em tatame, volume de matriculados e bonificação por conversão de leads.
          </p>
        </div>

        {/* Filtro Mês / Ano */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
          <select
            value={mesSelecionado}
            onChange={e => setMesSelecionado(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-white px-2 py-1 outline-none cursor-pointer"
          >
            {mesesNomes.map((nome, i) => (
              <option key={i} value={i + 1} className="bg-zinc-900 text-white">
                {nome}
              </option>
            ))}
          </select>

          <select
            value={anoSelecionado}
            onChange={e => setAnoSelecionado(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-white px-2 py-1 outline-none cursor-pointer"
          >
            {[2025, 2026, 2027].map(ano => (
              <option key={ano} value={ano} className="bg-zinc-900 text-white">
                {ano}
              </option>
            ))}
          </select>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
          <span>✓</span>
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* METRICAS CONSOLIDADAS DO MÊS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141416] border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Total Comissões a Pagar ({mesesNomes[mesSelecionado - 1]})
          </span>
          <div className="text-2xl font-black text-emerald-400">
            R$ {totalComissoesGeral.toFixed(2).replace('.', ',')}
          </div>
          <span className="text-[11px] text-zinc-500">Repasse da folha de instrutores</span>
        </div>

        <div className="bg-[#141416] border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Presenças Computadas no Mês
          </span>
          <div className="text-2xl font-black text-white">
            {totalPresencasGeral}
          </div>
          <span className="text-[11px] text-zinc-500">Treinos ministrados em tatame</span>
        </div>

        <div className="bg-[#141416] border border-zinc-800 p-5 rounded-2xl space-y-1 shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Leads Experimentais Convertidos
          </span>
          <div className="text-2xl font-black text-amber-400">
            {totalConversoesGeral}
          </div>
          <span className="text-[11px] text-zinc-500">Novas matrículas geradas</span>
        </div>
      </div>

      {/* TABELA DE REPASSE POR PROFESSOR */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white">Folha de Comissões do Mês</h3>
          <span className="text-xs text-zinc-400">
            {relatorio.length} instrutor(es) ativo(s)
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs">Calculando comissões...</div>
        ) : relatorio.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs bg-[#141416] rounded-2xl border border-zinc-800">
            Nenhum professor cadastrado para comissionamento.
          </div>
        ) : (
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                    <th className="p-3.5">Professor</th>
                    <th className="p-3.5">Modalidade</th>
                    <th className="p-3.5">Modelo</th>
                    <th className="p-3.5">Presenças</th>
                    <th className="p-3.5">Matriculados</th>
                    <th className="p-3.5">Conversões</th>
                    <th className="p-3.5">Total Comissão</th>
                    <th className="p-3.5 text-right">Regras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {relatorio.map(item => {
                    const conf = configs.find(c => c.professorId === item.professorId);
                    return (
                      <tr key={item.professorId} className="hover:bg-zinc-900/40 transition">
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {item.nome}
                        </td>
                        <td className="p-3.5 text-zinc-300 whitespace-nowrap">
                          {item.modalidade || 'Muay Thai'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-zinc-800 text-zinc-300">
                            {item.modelo === 'POR_ALUNO_PRESENTE'
                              ? 'Presença'
                              : item.modelo === 'POR_MATRICULADO_ATIVO'
                              ? 'Matriculados'
                              : 'Híbrido'}
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-200 whitespace-nowrap">
                          {item.total_presencas}{' '}
                          <span className="text-[10px] text-zinc-500">
                            (R$ {item.valor_comissao_presenca.toFixed(2).replace('.', ',')})
                          </span>
                        </td>
                        <td className="p-3.5 text-zinc-200 whitespace-nowrap">
                          {item.total_matriculados}{' '}
                          <span className="text-[10px] text-zinc-500">
                            (R$ {item.valor_comissao_matriculados.toFixed(2).replace('.', ',')})
                          </span>
                        </td>
                        <td className="p-3.5 text-amber-400 font-bold whitespace-nowrap">
                          {item.total_conversoes}{' '}
                          <span className="text-[10px] text-amber-500/80">
                            (+R$ {item.valor_bonus_conversoes.toFixed(2).replace('.', ',')})
                          </span>
                        </td>
                        <td className="p-3.5 text-emerald-400 font-black text-sm whitespace-nowrap">
                          R$ {item.valor_total.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              if (conf) {
                                setConfigEditando(conf);
                              } else {
                                setConfigEditando({
                                  professorId: item.professorId,
                                  nome: item.nome,
                                  modalidade: item.modalidade,
                                  modelo: 'POR_ALUNO_PRESENTE',
                                  valor_por_presenca: 3.0,
                                  valor_por_matriculado: 5.0,
                                  bonus_conversao_lead: 30.0
                                });
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-white transition"
                          >
                            Configurar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CONFIGURAÇÃO DE COMISSÃO POR PROFESSOR */}
      {configEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <form
            onSubmit={handleSalvarConfig}
            className="bg-[#141416] border border-zinc-700 rounded-3xl p-6 sm:p-7 max-w-md w-full space-y-5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="text-base font-black text-white">Regras de Comissão</h3>
                <span className="text-xs text-zinc-400 font-bold">{configEditando.nome}</span>
              </div>
              <button
                type="button"
                onClick={() => setConfigEditando(null)}
                className="text-zinc-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            {erroMsg && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-400 font-bold">
                {erroMsg}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Modelo de Remuneração
                </label>
                <select
                  value={configEditando.modelo}
                  onChange={e => setConfigEditando({ ...configEditando, modelo: e.target.value as any })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                >
                  <option value="POR_ALUNO_PRESENTE">Por Aluno Presente na Aula</option>
                  <option value="POR_MATRICULADO_ATIVO">Por Aluno Matriculado na Modalidade</option>
                  <option value="HIBRIDO">Híbrido (Presença + Matriculados)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Valor por Aluno Presente (R$)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={configEditando.valor_por_presenca}
                  onChange={e => setConfigEditando({ ...configEditando, valor_por_presenca: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Valor por Aluno Matriculado Ativo (R$)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={configEditando.valor_por_matriculado}
                  onChange={e => setConfigEditando({ ...configEditando, valor_por_matriculado: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Bônus por Lead Convertido em Matrícula (R$)
                </label>
                <input
                  type="number"
                  step="5"
                  value={configEditando.bonus_conversao_lead}
                  onChange={e => setConfigEditando({ ...configEditando, bonus_conversao_lead: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-red-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3">
              <button
                type="button"
                onClick={() => setConfigEditando(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-950/40 disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar Regras'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
