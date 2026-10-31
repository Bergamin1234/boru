import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface AdminRedemption {
  id: string;
  codigo_voucher: string;
  status: 'PENDENTE_RETIRADA' | 'ENTREGUE';
  pontos_gastos: number;
  criadoEm: string;
  entregueEm?: string;
  entreguePor?: string;
  aluno: {
    id: string;
    nome: string;
    cpf?: string;
    telefone?: string;
  };
  item: {
    id: string;
    nome: string;
    categoria: string;
    custo_points: number;
    imagem_url?: string;
  };
}

export const AdminStoreRedemptionsTab: React.FC<{ usuarioLogado: any }> = ({ usuarioLogado }) => {
  const [resgates, setResgates] = useState<AdminRedemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');
  const [sucessoMsg, setSucessoMsg] = useState('');
  const [entregandoId, setEntregandoId] = useState<string | null>(null);

  const carregarResgates = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getStoreRedemptions(filtroStatus === 'TODOS' ? undefined : filtroStatus);
      if (Array.isArray(res.data)) {
        setResgates(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar resgates da loja:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarResgates();
  }, [filtroStatus]);

  const handleEntregar = async (id: string) => {
    setEntregandoId(id);
    try {
      const operador = usuarioLogado?.nome || 'Recepção CT Borü';
      await adminApi.deliverStoreRedemption(id, operador);
      setSucessoMsg('Item entregue e voucher validado com sucesso!');
      setTimeout(() => setSucessoMsg(''), 4000);
      await carregarResgates();
    } catch (err) {
      console.error('Erro ao dar baixa no resgate:', err);
    } finally {
      setEntregandoId(null);
    }
  };

  const resgatesFiltrados = resgates.filter(r => {
    const termo = busca.toLowerCase();
    const matchBusca =
      !busca ||
      r.codigo_voucher.toLowerCase().includes(termo) ||
      r.aluno?.nome?.toLowerCase().includes(termo) ||
      r.item?.nome?.toLowerCase().includes(termo);
    return matchBusca;
  });

  const totalPendentes = resgates.filter(r => r.status === 'PENDENTE_RETIRADA').length;
  const totalEntregues = resgates.filter(r => r.status === 'ENTREGUE').length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141416] border border-zinc-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <span>🎟️</span>
            <span>Validação de Vouchers & Entrega de Recompensas</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Controle de retiradas físicas de produtos resgatados com Points no balcão da recepção.
          </p>
        </div>

        {/* Filtros e Busca */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por código BORU-... ou aluno"
            className="bg-zinc-900 border border-zinc-700 text-xs font-bold text-white px-3 py-2 rounded-xl outline-none focus:border-red-500 w-56"
          />

          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-xs font-bold text-white px-3 py-2 rounded-xl outline-none"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE_RETIRADA">⏳ Pendente Retirada</option>
            <option value="ENTREGUE">✓ Entregues</option>
          </select>
        </div>
      </div>

      {sucessoMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2">
          <span>✓</span>
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* METRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#141416] border border-amber-500/20 p-4 rounded-xl space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-amber-400">Aguardando Retirada</span>
          <div className="text-2xl font-black text-amber-300">{totalPendentes}</div>
          <span className="text-[10px] text-zinc-500">Alunos aguardando produto físico</span>
        </div>

        <div className="bg-[#141416] border border-emerald-500/20 p-4 rounded-xl space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Total Entregues</span>
          <div className="text-2xl font-black text-emerald-300">{totalEntregues}</div>
          <span className="text-[10px] text-zinc-500">Recompensas retiradas na recepção</span>
        </div>

        <div className="bg-[#141416] border border-zinc-800 p-4 rounded-xl space-y-1 shadow-lg">
          <span className="text-[10px] uppercase font-bold text-zinc-400">Total de Resgates</span>
          <div className="text-2xl font-black text-white">{resgates.length}</div>
          <span className="text-[10px] text-zinc-500">Movimentações no catálogo de Points</span>
        </div>
      </div>

      {/* LISTAGEM DE VOUCHERS */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-xs">Carregando vouchers...</div>
        ) : resgatesFiltrados.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-xs bg-[#141416] rounded-2xl border border-zinc-800">
            Nenhum voucher encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="bg-[#141416] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-zinc-900/80 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800">
                    <th className="p-3.5">Código Voucher</th>
                    <th className="p-3.5">Aluno</th>
                    <th className="p-3.5">Produto Resgatado</th>
                    <th className="p-3.5">Points</th>
                    <th className="p-3.5">Data do Resgate</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {resgatesFiltrados.map(r => {
                    const pendente = r.status === 'PENDENTE_RETIRADA';
                    return (
                      <tr key={r.id} className="hover:bg-zinc-900/40 transition">
                        <td className="p-3.5 font-mono font-black text-amber-300 text-sm whitespace-nowrap">
                          {r.codigo_voucher}
                        </td>
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {r.aluno?.nome}
                          {r.aluno?.telefone && (
                            <span className="text-[10px] text-zinc-500 block font-normal">
                              {r.aluno.telefone}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-zinc-200 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <img
                              src={r.item?.imagem_url || 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&q=80'}
                              alt={r.item?.nome}
                              className="w-7 h-7 rounded-lg object-cover border border-zinc-700"
                            />
                            <span>{r.item?.nome}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-amber-400 font-bold whitespace-nowrap">
                          🪙 {r.pontos_gastos} pts
                        </td>
                        <td className="p-3.5 text-zinc-400 whitespace-nowrap">
                          {new Date(r.criadoEm).toLocaleDateString('pt-BR')}{' '}
                          <span className="text-[10px] text-zinc-500">
                            {new Date(r.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              pendente
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {pendente ? 'Pendente Retirada' : 'Entregue'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {pendente ? (
                            <button
                              onClick={() => handleEntregar(r.id)}
                              disabled={entregandoId === r.id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-md shadow-emerald-950/40 disabled:opacity-50"
                            >
                              {entregandoId === r.id ? 'Baixando...' : 'Confirmar Entrega'}
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-500 italic">
                              Entregue por {r.entreguePor || 'Recepção'}
                            </span>
                          )}
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
    </div>
  );
};
