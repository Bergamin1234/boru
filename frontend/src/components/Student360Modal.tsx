import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface Student360ModalProps {
  studentId: string;
  onClose: () => void;
  onRefreshStudentList?: () => void;
}

export const Student360Modal: React.FC<Student360ModalProps> = ({
  studentId,
  onClose,
  onRefreshStudentList
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<'geral' | 'contratos' | 'financeiro' | 'pontos' | 'graduacoes' | 'loja'>('geral');

  // Modal Novo Contrato Longo
  const [showNovoContrato, setShowNovoContrato] = useState(false);
  const [tipoDuracao, setTipoDuracao] = useState<'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL'>('TRIMESTRAL');
  const [duracaoMeses, setDuracaoMeses] = useState(3);
  const [valorTotalContrato, setValorTotalContrato] = useState('750.00');
  const [nomePlanoContrato, setNomePlanoContrato] = useState('Plano Fidelidade Trimestral');
  const [salvandoContrato, setSalvandoContrato] = useState(false);

  // Modal Nova Graduação
  const [showNovaGraduacao, setShowNovaGraduacao] = useState(false);
  const [novaGraduacaoNome, setNovaGraduacaoNome] = useState('');
  const [modalidadeGrad, setModalidadeGrad] = useState('Muay Thai');
  const [examinador, setExaminador] = useState('Mestre Felipe Borü');
  const [notasExame, setNotasExame] = useState('');
  const [salvandoGrad, setSalvandoGrad] = useState(false);

  // Mensagens
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [erroMsg, setErroMsg] = useState('');

  const carregar360 = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStudent360(studentId);
      setData(res.data);
      if (res.data?.aluno?.modalidade) {
        setModalidadeGrad(res.data.aluno.modalidade);
      }
    } catch (err) {
      console.error('Erro ao carregar Visão 360 do Aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      carregar360();
    }
  }, [studentId]);

  const handleTipoDuracaoChange = (tipo: 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL') => {
    setTipoDuracao(tipo);
    if (tipo === 'TRIMESTRAL') {
      setDuracaoMeses(3);
      setValorTotalContrato('750.00');
      setNomePlanoContrato('Plano Fidelidade Trimestral (3 Meses)');
    } else if (tipo === 'SEMESTRAL') {
      setDuracaoMeses(6);
      setValorTotalContrato('1380.00');
      setNomePlanoContrato('Plano Fidelidade Semestral (6 Meses)');
    } else {
      setDuracaoMeses(12);
      setValorTotalContrato('2520.00');
      setNomePlanoContrato('Plano Fidelidade Anual Guerreiro (12 Meses)');
    }
  };

  const handleSalvarContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvandoContrato(true);
    setErroMsg('');

    try {
      await adminApi.createStudentContract(studentId, {
        nome_plano: nomePlanoContrato,
        tipo_duracao: tipoDuracao,
        duracao_meses: duracaoMeses,
        valor_total: parseFloat(valorTotalContrato.replace(',', '.')) || 0,
        data_inicio: new Date().toISOString()
      });

      setShowNovoContrato(false);
      setSucessoMsg('Contrato longo ativado com sucesso e bônus de Points creditado!');
      setTimeout(() => setSucessoMsg(''), 4000);
      await carregar360();
      onRefreshStudentList?.();
    } catch (err: any) {
      setErroMsg(err.response?.data?.erro || 'Erro ao registrar contrato.');
    } finally {
      setSalvandoContrato(false);
    }
  };

  const handleSalvarGraduacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaGraduacaoNome.trim()) return;
    setSalvandoGrad(true);
    setErroMsg('');

    try {
      await adminApi.registerGraduation(studentId, {
        modalidade: modalidadeGrad,
        graduacao_anterior: data?.aluno?.prajied || data?.aluno?.graduacao || 'Iniciante',
        nova_graduacao: novaGraduacaoNome.trim(),
        professorNome: examinador,
        notas_exame: notasExame.trim() || undefined,
        data_graduacao: new Date().toISOString()
      });

      setShowNovaGraduacao(false);
      setNovaGraduacaoNome('');
      setNotasExame('');
      setSucessoMsg('Graduação oficializada no histórico e pontuada (+50 XP & +25 Points)!');
      setTimeout(() => setSucessoMsg(''), 4000);
      await carregar360();
      onRefreshStudentList?.();
    } catch (err: any) {
      setErroMsg(err.response?.data?.erro || 'Erro ao registrar exame de graduação.');
    } finally {
      setSalvandoGrad(false);
    }
  };

  const handleConfirmarEntrega = async (resgateId: string) => {
    try {
      await adminApi.deliverStoreRedemption(resgateId, 'Recepção / Administrador');
      setSucessoMsg('Entrega física do item confirmada!');
      setTimeout(() => setSucessoMsg(''), 3000);
      await carregar360();
    } catch (err) {
      console.error('Erro ao entregar resgate:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-[#141416] border border-zinc-800 rounded-3xl p-8 max-w-md w-full text-center space-y-3">
          <div className="text-xl animate-spin">🥊</div>
          <div className="text-sm font-bold text-white">Carregando Visão 360° do Aluno...</div>
        </div>
      </div>
    );
  }

  const { aluno, metricas, contratos, mensalidades, extratoPontos, resgatesLoja, historicoGraduacoes } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141416] border border-zinc-700 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER MODAL */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 via-[#18181B] to-[#141416] border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-xl font-black text-red-500">
              {aluno.nome.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-black text-white">{aluno.nome}</h3>
                {aluno.prajied && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {aluno.prajied}
                  </span>
                )}
                {metricas.totalCheckins === 1 || metricas.isPrimeiroCheckin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-black border border-amber-300 shadow-sm">
                    🌟 Fez seu primeiro check-in
                  </span>
                ) : (metricas.totalCheckins || metricas.totalPresencas || 0) > 1 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    🔄 Check-in recorrente • {metricas.totalCheckins || metricas.totalPresencas} acessos
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                    🆕 Aguardando 1º check-in
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-400">
                CPF: {aluno.cpf || 'Não cadastrado'} • {aluno.telefone || 'Sem telefone'} • Plano: {aluno.plano}
                {metricas.dataPrimeiroCheckin
                  ? ` • 1º Check-in em: ${new Date(metricas.dataPrimeiroCheckin).toLocaleDateString('pt-BR')}`
                  : ''}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
          </button>
        </div>

        {sucessoMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
            <span>✓</span>
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* NAVEGAÇÃO ENTRE AS ABAS 360 */}
        <div className="px-6 pt-3 flex gap-2 border-b border-zinc-800 overflow-x-auto scrollbar-none">
          {[
            { id: 'geral', label: 'Visão Geral', icon: '👤' },
            { id: 'contratos', label: `Contratos Longos (${contratos.length})`, icon: '📄' },
            { id: 'financeiro', label: `Financeiro (${mensalidades.length})`, icon: '💳' },
            { id: 'pontos', label: `Points & XP (${aluno.spendable_points} pts)`, icon: '🪙' },
            { id: 'graduacoes', label: `Graduações (${historicoGraduacoes.length})`, icon: '🥋' },
            { id: 'loja', label: `Resgates Loja (${resgatesLoja.length})`, icon: '🛍️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAbaAtiva(tab.id as any)}
              className={`pb-3 px-3 text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
                abaAtiva === tab.id
                  ? 'border-red-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ABA 1: VISÃO GERAL */}
          {abaAtiva === 'geral' && (
            <div className="space-y-6">
              {/* Metricas rápidas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Presenças no Tatame</span>
                  <div className="text-xl font-black text-white">{metricas.totalPresencas}</div>
                </div>
                <div className="bg-zinc-900/60 border border-amber-500/20 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Saldo Points</span>
                  <div className="text-xl font-black text-amber-300">{aluno.spendable_points} pts</div>
                </div>
                <div className="bg-zinc-900/60 border border-red-500/20 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-red-400">XP Vitalício</span>
                  <div className="text-xl font-black text-white">{aluno.total_xp} XP</div>
                </div>
                <div className="bg-zinc-900/60 border border-zinc-800 p-3.5 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Contratos</span>
                  <div className="text-xl font-black text-emerald-400">{contratos.length}</div>
                </div>
              </div>

              {/* Informações cadastrais detalhadas */}
              <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Dados do Cadastro & Perfil
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Modalidade Principal</span>
                    <span className="font-bold text-white">{aluno.modalidade || 'Muay Thai Tradicional'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Prajied / Faixa Atual</span>
                    <span className="font-bold text-white">{aluno.prajied || 'Iniciante'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Data de Matrícula / Adesão</span>
                    <span className="font-bold text-white">
                      {aluno.data_de_adesao
                        ? new Date(aluno.data_de_adesao).toLocaleDateString('pt-BR')
                        : new Date(aluno.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Contrato Digital Assinado?</span>
                    <span className={`font-bold ${aluno.has_signed_contract ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {aluno.has_signed_contract ? '✓ Assinado Digitalmente' : 'Pendente de Assinatura'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: CONTRATOS LONGOS */}
          {abaAtiva === 'contratos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Contratos Fidelidade (3, 6, 12 Meses)</h4>
                  <p className="text-xs text-zinc-400">
                    Adesão a contratos longos concede bônus instantâneo de Points na carteira do aluno.
                  </p>
                </div>
                <button
                  onClick={() => setShowNovoContrato(true)}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-black text-white uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-red-950/40"
                >
                  <span>+</span>
                  <span>Emitir Contrato</span>
                </button>
              </div>

              {contratos.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800">
                  Nenhum contrato longo ativo. O aluno está atualmente no modelo mensal avulso.
                </div>
              ) : (
                <div className="space-y-3">
                  {contratos.map((c: any) => (
                    <div
                      key={c.id}
                      className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">{c.nome_plano}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {c.status}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-400 block">
                          Período: {new Date(c.data_inicio).toLocaleDateString('pt-BR')} até{' '}
                          {new Date(c.data_fim).toLocaleDateString('pt-BR')} ({c.duracao_meses} meses)
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-emerald-400">
                          R$ {c.valor_total.toFixed(2).replace('.', ',')}
                        </div>
                        <span className="text-[10px] text-zinc-500">
                          Competência: R$ {c.valor_mensal_competencia.toFixed(2).replace('.', ',')}/mês
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: HISTÓRICO FINANCEIRO */}
          {abaAtiva === 'financeiro' && (
            <div className="space-y-4">
              <h4 className="text-sm font-black text-white">Mensalidades & Cobranças</h4>
              {mensalidades.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800">
                  Nenhuma fatura registrada.
                </div>
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-zinc-900 text-zinc-400 font-bold border-b border-zinc-800">
                        <th className="p-3">Vencimento</th>
                        <th className="p-3">Valor</th>
                        <th className="p-3">Data Pagamento</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {mensalidades.map((m: any) => (
                        <tr key={m.id} className="hover:bg-zinc-800/30">
                          <td className="p-3 font-mono text-zinc-300">
                            {new Date(m.dataVencimento).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-3 font-bold text-white">
                            R$ {m.valor.toFixed(2).replace('.', ',')}
                          </td>
                          <td className="p-3 text-zinc-400">
                            {m.dataPagamento ? new Date(m.dataPagamento).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                m.status === 'PAGO'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ABA 4: PONTOS & EXTRATO */}
          {abaAtiva === 'pontos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Extrato da Carteira de Pontos</h4>
                  <span className="text-xs text-zinc-400">
                    Saldo Atual: <strong className="text-amber-400">{aluno.spendable_points} Points</strong> • XP Vitalício: <strong className="text-white">{aluno.total_xp} XP</strong>
                  </span>
                </div>
              </div>

              {extratoPontos.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800">
                  Nenhuma movimentação de pontos até o momento.
                </div>
              ) : (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
                  {extratoPontos.map((item: any) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-white">{item.descricao}</div>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(item.criadoEm).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`font-black ${
                            item.points_delta >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {item.points_delta >= 0 ? `+${item.points_delta}` : item.points_delta} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 5: GRADUAÇÕES */}
          {abaAtiva === 'graduacoes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">Histórico de Exames de Faixa / Prajied</h4>
                  <p className="text-xs text-zinc-400">
                    Ao registrar nova graduação, o aluno é promovido e ganha +50 XP e +25 Points.
                  </p>
                </div>
                <button
                  onClick={() => setShowNovaGraduacao(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-xs font-black text-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <span>🥋</span>
                  <span>Registrar Exame</span>
                </button>
              </div>

              {historicoGraduacoes.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800">
                  Nenhuma graduação registrada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {historicoGraduacoes.map((g: any) => (
                    <div
                      key={g.id}
                      className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-red-400">
                          {g.modalidade}
                        </span>
                        <span className="text-zinc-500 font-mono">
                          {new Date(g.data_graduacao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-base font-black text-white">
                        {g.nova_graduacao}
                        {g.graduacao_anterior && (
                          <span className="text-xs text-zinc-500 font-normal ml-2">
                            (Anterior: {g.graduacao_anterior})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-zinc-400 pt-1 border-t border-zinc-800/80">
                        <span>Examinador: {g.professorNome}</span>
                        {g.notas_exame && <span className="italic">"{g.notas_exame}"</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 6: RESGATES DA LOJA */}
          {abaAtiva === 'loja' && (
            <div className="space-y-4">
              <h4 className="text-sm font-black text-white">Vouchers Resgatados na Loja de Points</h4>
              {resgatesLoja.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs bg-zinc-900/40 rounded-2xl border border-zinc-800">
                  Nenhum item resgatado por este aluno.
                </div>
              ) : (
                <div className="space-y-3">
                  {resgatesLoja.map((r: any) => {
                    const pendente = r.status === 'PENDENTE_RETIRADA';
                    return (
                      <div
                        key={r.id}
                        className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={r.item?.imagem_url || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&q=80'}
                            alt={r.item?.nome}
                            className="w-12 h-12 rounded-xl object-cover border border-zinc-700"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">{r.item?.nome}</div>
                            <span className="text-[11px] font-mono text-amber-300 font-black">
                              Voucher: {r.codigo_voucher}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              pendente
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {pendente ? 'Pendente Retirada' : 'Entregue'}
                          </span>

                          {pendente && (
                            <button
                              onClick={() => handleConfirmarEntrega(r.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider transition"
                            >
                              Dar Baixa
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL: NOVO CONTRATO LONGO */}
        {showNovoContrato && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <form
              onSubmit={handleSalvarContrato}
              className="bg-[#141416] border border-zinc-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="text-sm font-black text-white">Emitir Contrato Fidelidade</h4>
                <button
                  type="button"
                  onClick={() => setShowNovoContrato(false)}
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

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Plano de Fidelidade
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['TRIMESTRAL', 'SEMESTRAL', 'ANUAL'] as const).map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => handleTipoDuracaoChange(tipo)}
                        className={`py-2 px-2 rounded-xl text-xs font-black uppercase transition border ${
                          tipoDuracao === tipo
                            ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {tipo === 'TRIMESTRAL' ? '3 Meses' : tipo === 'SEMESTRAL' ? '6 Meses' : '12 Meses'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Valor Total do Contrato (R$)
                  </label>
                  <input
                    type="text"
                    value={valorTotalContrato}
                    onChange={e => setValorTotalContrato(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-black text-white focus:outline-none focus:border-red-500"
                    required
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Competência contábil: R${' '}
                    {((parseFloat(valorTotalContrato.replace(',', '.')) || 0) / duracaoMeses)
                      .toFixed(2)
                      .replace('.', ',')}{' '}
                    / mês
                  </span>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 font-bold flex items-center gap-2">
                  <span>🪙</span>
                  <span>
                    Bônus garantido:{' '}
                    <strong>
                      +{duracaoMeses >= 12 ? '300' : duracaoMeses >= 6 ? '120' : '50'} Points
                    </strong>{' '}
                    creditados ao aluno!
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNovoContrato(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoContrato}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition shadow-lg shadow-red-950/40 disabled:opacity-50"
                >
                  {salvandoContrato ? 'Emitindo...' : 'Ativar Contrato'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: NOVA GRADUAÇÃO */}
        {showNovaGraduacao && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <form
              onSubmit={handleSalvarGraduacao}
              className="bg-[#141416] border border-zinc-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h4 className="text-sm font-black text-white">Registrar Exame de Graduação</h4>
                <button
                  type="button"
                  onClick={() => setShowNovaGraduacao(false)}
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

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Nova Graduação / Faixa Conquistada *
                  </label>
                  <input
                    type="text"
                    value={novaGraduacaoNome}
                    onChange={e => setNovaGraduacaoNome(e.target.value)}
                    placeholder="Ex: Prajied Azul, Faixa Azul 1º Grau, etc."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Modalidade
                  </label>
                  <input
                    type="text"
                    value={modalidadeGrad}
                    onChange={e => setModalidadeGrad(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Mestre / Professor Examinador
                  </label>
                  <input
                    type="text"
                    value={examinador}
                    onChange={e => setExaminador(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Observações / Notas do Exame
                  </label>
                  <textarea
                    value={notasExame}
                    onChange={e => setNotasExame(e.target.value)}
                    placeholder="Ex: Excelente técnica de clinch, chutes fortes e postura exemplar."
                    rows={2}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>O aluno receberá automaticamente +50 XP e +25 Points!</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNovaGraduacao(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoGrad}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-black transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {salvandoGrad ? 'Registrando...' : 'Confirmar Graduação'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
