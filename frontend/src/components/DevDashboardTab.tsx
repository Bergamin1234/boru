import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/api';

interface DevDashboardTabProps {
  usuarioLogado: any;
}

export const DevDashboardTab: React.FC<DevDashboardTabProps> = ({ usuarioLogado }) => {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [novoLogMsg, setNovoLogMsg] = useState('');
  const [novoLogLevel, setNovoLogLevel] = useState('INFO');
  const [filtroLevel, setFiltroLevel] = useState('TODOS');

  const carregarDevDashboard = async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await adminApi.getDevDashboard(usuarioLogado?.email, usuarioLogado?.id);
      setDados(res.data);
    } catch (err: any) {
      setErro(err.response?.data?.erro || 'Falha ao carregar telemetria do Dev Dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDevDashboard();
  }, []);

  const handleDispararLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoLogMsg.trim()) return;
    try {
      await adminApi.createDevLog({
        level: novoLogLevel,
        service: 'BRG_ADMIN_DEV',
        message: novoLogMsg.trim(),
        metadata: { author: usuarioLogado?.nome || 'Ítalo Bergamin' },
      });
      setNovoLogMsg('');
      await carregarDevDashboard();
    } catch {
      alert('Erro ao registrar evento de log.');
    }
  };

  const handleLimparLogs = async () => {
    if (!window.confirm('Deseja limpar o histórico de logs de auditoria do Dev Dashboard?')) return;
    try {
      await adminApi.clearDevLogs();
      await carregarDevDashboard();
    } catch {
      alert('Erro ao limpar logs.');
    }
  };

  if (loading && !dados) {
    return (
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-10 text-center text-zinc-400">
        ⚡ Carregando telemetria em tempo real do Dev Dashboard (AdminDev — Ítalo Bergamin)...
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-6 text-red-300 text-sm font-bold">
        {erro}
      </div>
    );
  }

  const logsFiltrados = (dados?.logs || []).filter(
    (l: any) => filtroLevel === 'TODOS' || l.level === filtroLevel
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* HEADER ADMIN DEV */}
      <div className="bg-gradient-to-r from-cyan-950/50 via-[#141416] to-purple-950/40 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              🛡️ Acesso Exclusivo AdminDev / BrgAdmin
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              ● {dados?.status || 'ONLINE'} • Latência DB: {dados?.infraestrutura?.dbLatencyMs ?? 12}ms
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
            💻 Dev Dashboard — Monitoramento, Logs & Webhooks (Ítalo Bergamin)
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Painel de engenharia com telemetria de hospedagem (Vercel + Render + Supabase), auditoria de eventos e links de APIs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={carregarDevDashboard}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider transition shadow-lg shadow-cyan-600/20"
          >
            🔄 Atualizar Telemetria
          </button>
          <a
            href="https://github.com/Bergamin1234/boru"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 transition"
          >
            🐙 Repositório GitHub
          </a>
        </div>
      </div>

      {/* MONITORAMENTO DE HOSPEDAGEM E INFRAESTRUTURA */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase text-cyan-400">Frontend (Vercel Edge)</span>
          <p className="text-lg font-black text-white mt-1">boru-lime.vercel.app</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">● SSL Ativo • CDN Global</p>
        </div>

        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase text-purple-400">Backend API (Render)</span>
          <p className="text-lg font-black text-white mt-1">
            Node {dados?.infraestrutura?.nodeVersion} ({dados?.infraestrutura?.platform})
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Uptime: <strong className="text-white">{Math.floor((dados?.infraestrutura?.uptimeSeconds || 0) / 60)} min</strong> • RAM RSS: <strong className="text-white">{dados?.infraestrutura?.memoryRssMB} MB</strong>
          </p>
        </div>

        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase text-emerald-400">Banco de Dados (Supabase)</span>
          <p className="text-lg font-black text-white mt-1">PostgreSQL 15 Pooler</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Ping: <strong className="text-emerald-400">{dados?.infraestrutura?.dbLatencyMs} ms</strong> • Região: AWS US-West-2
          </p>
        </div>

        <div className="bg-[#141416] border border-zinc-800 rounded-xl p-4">
          <span className="text-[10px] font-bold uppercase text-amber-400">Storage & Contratos</span>
          <p className="text-lg font-black text-white mt-1">
            {dados?.contagensBanco?.contratosAssinados || 0} Contratos • {dados?.contagensBanco?.bolsistas || 0} Bolsistas
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Total Registros DB: <strong className="text-white">
              {(dados?.contagensBanco?.alunos || 0) +
                (dados?.contagensBanco?.mensalidades || 0) +
                (dados?.contagensBanco?.presencas || 0) +
                (dados?.contagensBanco?.aulasExperimentais || 0)}
            </strong>
          </p>
        </div>
      </div>

      {/* CONTADORES DE TABELAS DO SUPABASE */}
      <div className="bg-[#141416] border border-zinc-800 rounded-2xl p-5">
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-300 mb-3">
          🗄️ Estado Atual das Tabelas no Banco de Produção (Supabase PostgreSQL)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
          {[
            { label: 'Usuários RBAC', val: dados?.contagensBanco?.usuarios },
            { label: 'Alunos Ativos', val: dados?.contagensBanco?.alunos },
            { label: 'Bolsistas', val: dados?.contagensBanco?.bolsistas },
            { label: 'Contratos Digital', val: dados?.contagensBanco?.contratosAssinados },
            { label: 'Faturas', val: dados?.contagensBanco?.mensalidades },
            { label: 'Check-ins', val: dados?.contagensBanco?.presencas },
            { label: 'Experimentais', val: dados?.contagensBanco?.aulasExperimentais },
            { label: 'Conquistas', val: dados?.contagensBanco?.gamificationAchievements },
          ].map((item) => (
            <div key={item.label} className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3">
              <span className="text-xl font-black text-white block">{item.val ?? 0}</span>
              <span className="text-[10px] text-zinc-400 font-semibold">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PAINEL DIVIDIDO: CHAVES/WEBHOOKS/APIS + LOGS DO SISTEMA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GERENCIAMENTO DE CHAVES, WEBHOOKS E LINKS DE APIS */}
        <div className="lg:col-span-5 bg-[#141416] border border-zinc-800 rounded-2xl p-5 space-y-4 h-fit">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>🔑</span>
              <span>Gerenciamento de Chaves, Webhooks & Rotas de API</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Endpoints de produção injetados e integrações ativas do ecossistema Borü.
            </p>
          </div>

          <div className="space-y-2.5">
            {(dados?.apisEWebhooks || []).map((apiItem: any, idx: number) => (
              <div
                key={idx}
                className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-white">{apiItem.nome}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {apiItem.metodo} • {apiItem.status}
                  </span>
                </div>
                <code className="text-[11px] text-cyan-400 font-mono">{apiItem.rota}</code>
                <p className="text-[11px] text-zinc-400">{apiItem.descricao}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#1A1A1E] border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-400 block">
              Variáveis & Chaves de Ambiente (Mascaradas)
            </span>
            <div className="text-[11px] font-mono text-zinc-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-500">DATABASE_URL:</span>
                <span className="text-emerald-400">postgresql://postgres.rznj***@aws-1-us-west-2:5432</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">STORAGE_DRIVER:</span>
                <span className="text-cyan-400">LOCAL_DISKS + PERSISTENT_DATA_URI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">WHATSAPP_GATEWAY:</span>
                <span className="text-emerald-400">wa.me/encodeURIComponent (ATIVO)</span>
              </div>
            </div>
          </div>
        </div>

        {/* VISUALIZADOR DE LOGS E ERROS DO SISTEMA */}
        <div className="lg:col-span-7 bg-[#141416] border border-zinc-800 rounded-2xl p-5 flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>📡</span>
                <span>Console de Logs, Auditoria e Erros do Sistema</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Monitoramento em tempo real de check-ins, assinaturas de contratos, uploads e webhooks.
              </p>
            </div>
            <button
              onClick={handleLimparLogs}
              className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/40 transition self-start"
            >
              🗑️ Limpar Logs
            </button>
          </div>

          {/* Filtros de Nível de Log */}
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {['TODOS', 'INFO', 'WEBHOOK', 'WARN', 'ERROR'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFiltroLevel(lvl)}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filtroLevel === lvl
                    ? 'bg-cyan-600 text-white'
                    : 'bg-[#1A1A1E] text-zinc-400 border border-zinc-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Form para injetar Log de Teste / Evento */}
          <form onSubmit={handleDispararLog} className="flex gap-2">
            <select
              value={novoLogLevel}
              onChange={(e) => setNovoLogLevel(e.target.value)}
              className="bg-[#1A1A1E] border border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-white font-bold"
            >
              <option value="INFO">INFO</option>
              <option value="WEBHOOK">WEBHOOK</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
            <input
              type="text"
              value={novoLogMsg}
              onChange={(e) => setNovoLogMsg(e.target.value)}
              placeholder="Registrar anotação técnica ou testar disparo de log..."
              className="flex-1 bg-[#1A1A1E] border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black"
            >
              Registrar
            </button>
          </form>

          {/* Lista de Logs */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 font-mono">
            {logsFiltrados.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                Nenhum log encontrado para este filtro.
              </div>
            ) : (
              logsFiltrados.map((log: any) => (
                <div
                  key={log.id}
                  className="bg-[#101012] border border-zinc-800/90 rounded-xl p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          log.level === 'ERROR'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : log.level === 'WARN'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : log.level === 'WEBHOOK'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-300">[{log.service}]</span>
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(log.criadoEm).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-zinc-200 text-xs leading-relaxed font-sans">{log.message}</p>
                  {log.metadata && (
                    <pre className="text-[10px] text-zinc-500 bg-black/40 p-1.5 rounded overflow-x-auto">
                      {log.metadata}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
