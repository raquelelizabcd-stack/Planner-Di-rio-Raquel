import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  Trash2, 
  Activity, 
  Clock, 
  Coins, 
  Layers, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  Database,
  Cpu,
  Lock,
  Globe,
  Terminal,
  Filter,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { agenteSeguranca, BLOCKED_SECURITY_MESSAGE } from '../agents/seguranca';
import { SecurityDetectionLog, SecurityLayer } from '../agents/seguranca/types';
import { supabase } from '../lib/supabase';

interface ConsoleSegurancaGuardianProps {
  accentColor?: string;
  borderRadius?: number;
}

export const ConsoleSegurancaGuardian: React.FC<ConsoleSegurancaGuardianProps> = ({
  accentColor = '#6a5acd',
  borderRadius = 24
}) => {
  const [logs, setLogs] = useState<SecurityDetectionLog[]>(() => agenteSeguranca.obterUltimosBloqueios());
  const [stats, setStats] = useState(() => agenteSeguranca.obterEstatisticas());
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<string>('all');
  const [supabaseLogs, setSupabaseLogs] = useState<any[]>([]);
  const [loadingSupabase, setLoadingSupabase] = useState(false);
  const [supabaseActionFilter, setSupabaseActionFilter] = useState<'all' | 'login_bloqueado'>('all');

  // Estados do Simulador Interativo
  const [simText, setSimText] = useState('Exemplo: Configurar API_KEY = AIzaSyD98f79a8sd7f6as9df87 e senha: secretPassword123');
  const [simLayer, setSimLayer] = useState<SecurityLayer>('ia');
  const [simResult, setSimResult] = useState<any | null>(null);

  const refreshLogs = () => {
    setLogs(agenteSeguranca.obterUltimosBloqueios());
    setStats(agenteSeguranca.obterEstatisticas());
  };

  useEffect(() => {
    refreshLogs();

    const handleBlockEvent = (event: any) => {
      refreshLogs();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('security-guardian-block', handleBlockEvent);
      return () => window.removeEventListener('security-guardian-block', handleBlockEvent);
    }
  }, []);

  const fetchSupabaseAuditLogs = async () => {
    setLoadingSupabase(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('agent_name', 'AgenteSeguranca')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (!error && data) {
        setSupabaseLogs(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar audit_logs do Supabase:', e);
    } finally {
      setLoadingSupabase(false);
    }
  };

  useEffect(() => {
    fetchSupabaseAuditLogs();
  }, []);

  const handleSimulate = () => {
    if (!simText.trim()) return;
    const res = agenteSeguranca.simularDeteccao(simLayer, simText);
    setSimResult(res);
    refreshLogs();
  };

  const handleClearLocal = () => {
    agenteSeguranca.limparLogsLocais();
    refreshLogs();
    setSimResult(null);
  };

  const filteredLogs = selectedLayerFilter === 'all'
    ? logs
    : logs.filter(l => l.camada === selectedLayerFilter);

  const getLayerBadge = (camada: SecurityLayer) => {
    switch (camada) {
      case 'frontend':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Frontend</span>;
      case 'backend':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Backend</span>;
      case 'banco':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Banco Supabase</span>;
      case 'auth':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">Autenticação</span>;
      case 'ia':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Saída IA</span>;
      case 'api':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">API Externa</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400">{camada}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho do Guardião Global */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-purple-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-xl shadow-red-500/10">
              <ShieldAlert size={30} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-display font-bold text-white tracking-tight">
                  Guardião Global de Segurança
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Ativo & Monitorando
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Inspeção seletiva em tempo real: Frontend • Backend • Supabase • Auth • IA • APIs Externas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSupabaseAuditLogs}
              disabled={loadingSupabase}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingSupabase ? 'animate-spin' : ''} />
              Sincronizar Supabase
            </button>
            <button
              onClick={handleClearLocal}
              className="px-3.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-red-500/20 cursor-pointer"
              title="Limpar histórico da sessão atual"
            >
              <Trash2 size={14} />
              Limpar Local
            </button>
          </div>
        </div>

        {/* Métricas / KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Bloqueios Ativos</span>
              <ShieldAlert size={16} className="text-red-400" />
            </div>
            <p className="text-2xl md:text-3xl font-display font-bold text-white">
              {stats.totalBloqueios}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Risco real interceptado</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Tokens Poupados</span>
              <Coins size={16} className="text-amber-400" />
            </div>
            <p className="text-2xl md:text-3xl font-display font-bold text-amber-400">
              {stats.tokensEconomizadosTotal}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Economia em requisições de IA</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Tempo de Resposta</span>
              <Clock size={16} className="text-emerald-400" />
            </div>
            <p className="text-2xl md:text-3xl font-display font-bold text-emerald-400">
              {stats.tempoMedioMs}ms
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Inspeção seletiva instantânea</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">Camadas Cobertas</span>
              <Layers size={16} className="text-purple-400" />
            </div>
            <p className="text-2xl md:text-3xl font-display font-bold text-purple-400">
              6 / 6
            </p>
            <p className="text-[10px] text-slate-500 mt-1">100% do ecossistema blindado</p>
          </div>
        </div>
      </div>

      {/* Simulador Interativo do Guardião Global */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-base font-display font-bold text-white">
              Simulador de Inspeção Seletiva em Tempo Real
            </h3>
            <p className="text-xs text-slate-400">
              Teste as regras de detecção: conteúdos normais passam livres; dados sensíveis são mascarados e registrados.
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Texto ou Payload para Inspecionar
              </label>
              <textarea
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Insira um texto ou payload de teste..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500/50 transition-all font-mono resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Camada Alvo
              </label>
              <select
                value={simLayer}
                onChange={(e) => setSimLayer(e.target.value as SecurityLayer)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-3 text-xs text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
              >
                <option value="frontend">Frontend (UI/Input)</option>
                <option value="backend">Backend (Rotas/Payload)</option>
                <option value="banco">Banco (Supabase)</option>
                <option value="auth">Autenticação (OAuth/Email)</option>
                <option value="ia">Respostas da IA (LLM)</option>
                <option value="api">APIs Externas</option>
              </select>

              <button
                onClick={handleSimulate}
                className="w-full mt-3 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 rounded-2xl text-xs font-bold transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Play size={14} /> Inspecionar Agora
              </button>
            </div>
          </div>

          {/* Exemplos Rápidos */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Exemplos de Teste:</span>
            <button
              onClick={() => { setSimText('Texto seguro: O usuário realizou login e visualizou seus hábitos do dia.'); setSimLayer('frontend'); }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-[11px] transition-colors border border-white/5"
            >
              Conteúdo Normal (Passa Livre)
            </button>
            <button
              onClick={() => { setSimText('Prompt: Gerar relatório usando API_KEY = AIzaSyD98f79a8sd7f6as9df87'); setSimLayer('ia'); }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-red-300 rounded-lg text-[11px] transition-colors border border-white/5"
            >
              API Key Google
            </button>
            <button
              onClick={() => { setSimText('Tentativa de registro: CPF = 123.456.789-00 com senha: MinhaSenhaSuperSecreta'); setSimLayer('banco'); }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-amber-300 rounded-lg text-[11px] transition-colors border border-white/5"
            >
              CPF & Senha
            </button>
            <button
              onClick={() => { setSimText('Cartão para renovar plano: 4111 2222 3333 4444'); setSimLayer('api'); }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-purple-300 rounded-lg text-[11px] transition-colors border border-white/5"
            >
              Cartão de Crédito
            </button>
          </div>

          {/* Resultado do Teste */}
          {simResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                simResult.bloqueado
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold flex items-center gap-1.5">
                  {simResult.bloqueado ? (
                    <>
                      <ShieldAlert size={16} className="text-red-400" />
                      Risco Detectado e Interceptado com Sucesso!
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} className="text-emerald-400" />
                      Conteúdo 100% Seguro — Liberado sem interferência.
                    </>
                  )}
                </span>
                <span className="text-[10px] text-slate-400">
                  {simResult.tempoMs.toFixed(2)}ms • {simResult.tokensEconomizados} tokens poupados
                </span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl font-mono text-[11px] break-all border border-white/5 text-slate-200">
                {typeof simResult.conteudoSanitizado === 'string'
                  ? simResult.conteudoSanitizado
                  : JSON.stringify(simResult.conteudoSanitizado, null, 2)}
              </div>
              {simResult.dadosDetectados.length > 0 && (
                <p className="text-[10px] mt-2 text-red-300">
                  Padrões interceptados: <span className="font-bold">{simResult.tiposDetectados.join(', ')}</span>
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Histórico dos Últimos Bloqueios (Memória em Tempo Real) */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">
                Últimos Bloqueios Registrados (Tempo Real)
              </h3>
              <p className="text-xs text-slate-400">
                Sessão em memória volátil — interceptações protegidas sem salvar credenciais
              </p>
            </div>
          </div>

          {/* Filtro por camada */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <select
              value={selectedLayerFilter}
              onChange={(e) => setSelectedLayerFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-red-500/50 cursor-pointer"
            >
              <option value="all">Todas as Camadas ({logs.length})</option>
              <option value="frontend">Frontend ({stats.porCamada.frontend})</option>
              <option value="backend">Backend ({stats.porCamada.backend})</option>
              <option value="banco">Banco Supabase ({stats.porCamada.banco})</option>
              <option value="auth">Tentativas de login ({stats.porCamada.auth})</option>
              <option value="ia">Saída IA ({stats.porCamada.ia})</option>
              <option value="api">APIs Externas ({stats.porCamada.api})</option>
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
            <ShieldCheck size={36} className="text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-white">Nenhum dado sensível detectado no filtro atual</p>
            <p className="text-xs text-slate-500 mt-1">O sistema está operando em conformidade total de segurança.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">Camada</th>
                  <th className="px-4 py-3">Padrão Detectado</th>
                  <th className="px-4 py-3">Conteúdo Protegido</th>
                  <th className="px-4 py-3">Tokens Poupados</th>
                  <th className="px-4 py-3">Tempo Resposta</th>
                  <th className="px-4 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getLayerBadge(log.camada)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-[11px] text-red-300 font-semibold">
                        {log.tipo_dado}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-400 font-mono text-[11px]">
                      {log.camada === 'auth' ? `Tentativa: ${log.valor_detectado}` : log.conteudo_mascarado}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-amber-400 font-semibold">
                      +{log.tokens_economizados}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-emerald-400">
                      {log.tempo_resposta_ms}ms
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabela do Supabase audit_logs */}
      <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">
                Auditoria Persistida no Supabase (audit_logs)
              </h3>
              <p className="text-xs text-slate-400">
                Registros com agent_name: "AgenteSeguranca" e action: "detecção_global"
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {supabaseLogs.length} registros sincronizados
            <select
              value={supabaseActionFilter}
              onChange={(e) => setSupabaseActionFilter(e.target.value as 'all' | 'login_bloqueado')}
              className="ml-3 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as ações</option>
              <option value="login_bloqueado">Somente tentativas de login</option>
            </select>
          </span>
        </div>

        {supabaseLogs.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl text-xs text-slate-500">
            Nenhum alerta remoto registrado ainda ou tabela recém-inicializada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-white/5 text-[10px] uppercase font-bold text-slate-400 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">Agente</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3">Camada</th>
                  <th className="px-4 py-3">Detalhes</th>
                  <th className="px-4 py-3">Data e Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {supabaseLogs.filter(l => supabaseActionFilter === 'all' || l.action === supabaseActionFilter).map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-semibold text-purple-300 whitespace-nowrap">
                      {log.agent_name}
                    </td>
                    <td className="px-4 py-3 text-red-300 font-mono text-[11px] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.details?.camada ? getLayerBadge(log.details.camada) : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] max-w-sm truncate">
                      {log.details?.email_tentativa
                        ? `Tentativa: ${log.details.email_tentativa} • status: ${log.details.status || 'bloqueado'}`
                        : (log.details?.valor_detectado || JSON.stringify(log.details))}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[10px] whitespace-nowrap">
                      {new Date(log.timestamp || log.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsoleSegurancaGuardian;
