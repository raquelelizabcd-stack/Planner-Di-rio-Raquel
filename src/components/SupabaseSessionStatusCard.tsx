import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Mail, 
  Key, 
  Clock, 
  Database, 
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dataService } from '../services/dataService';

interface SupabaseSessionStatusCardProps {
  onNotify?: (msg: string) => void;
}

export const SupabaseSessionStatusCard: React.FC<SupabaseSessionStatusCardProps> = ({ onNotify }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [revalidating, setRevalidating] = useState<boolean>(false);
  const [testingConn, setTestingConn] = useState<boolean>(false);

  // Informações de autenticação e sessão
  const [provider, setProvider] = useState<string>('Carregando...');
  const [email, setEmail] = useState<string>('Carregando...');
  const [sessionStatus, setSessionStatus] = useState<'Ativa' | 'Expirada'>('Ativa');
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<Date | null>(null);

  // Status de conexão
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Função central de verificação
  const runCheck = useCallback(async (isManualRefresh = false) => {
    if (!isManualRefresh) {
      setLoading(true);
    }
    try {
      // 1. Verificar Sessão no Supabase Auth
      const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
      
      const nowSeconds = Math.floor(Date.now() / 1000);
      const isExpired = session ? (session.expires_at ? session.expires_at <= nowSeconds : false) : true;
      const active = !!session && !isExpired && !sessionErr;

      setIsSessionActive(active);
      setSessionStatus(active ? 'Ativa' : 'Expirada');

      if (session?.user) {
        setEmail(session.user.email || 'Email não disponível');
        
        // Determinar provedor de login (Google, Email, etc.)
        const rawProvider = session.user.app_metadata?.provider || 
                            session.user.identities?.[0]?.provider || 
                            'google';
        const formattedProvider = rawProvider.charAt(0).toUpperCase() + rawProvider.slice(1);
        setProvider(formattedProvider);

        if (session.expires_at) {
          setTokenExpiresAt(new Date(session.expires_at * 1000));
        }
      } else {
        setEmail('Nenhuma sessão autenticada');
        setProvider('Não autenticado');
        setTokenExpiresAt(null);
      }

      // 2. Testar Conexão Supabase (Ping / Leitura)
      const pingStart = performance.now();
      const testRes = await dataService.testConnection();
      const pingDuration = Math.round(performance.now() - pingStart);

      setLatencyMs(pingDuration);
      setIsOnline(testRes.success);
      setLastChecked(new Date());

    } catch (err) {
      console.error('Erro na checagem de status Supabase:', err);
      setIsSessionActive(false);
      setSessionStatus('Expirada');
      setIsOnline(false);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  // Botão 1: Revalidar Sessão (renovar token JWT)
  const handleRevalidateSession = async () => {
    setRevalidating(true);
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Erro ao revalidar sessão:', error);
        onNotify?.(`Erro ao revalidar sessão: ${error.message}`);
      } else if (data?.session) {
        onNotify?.('Token JWT revalidado com sucesso!');
      } else {
        onNotify?.('Sessão revalidada.');
      }
      await runCheck(true);
    } catch (err: any) {
      console.error('Falha na renovação da sessão:', err);
      onNotify?.(`Falha na revalidação: ${err?.message || 'Erro inesperado'}`);
      await runCheck(true);
    } finally {
      setRevalidating(false);
    }
  };

  // Botão 2: Testar Conexão (pingar Supabase)
  const handleTestConnection = async () => {
    setTestingConn(true);
    try {
      const pingStart = performance.now();
      const res = await dataService.testConnection();
      const pingDuration = Math.round(performance.now() - pingStart);

      setLatencyMs(pingDuration);
      setIsOnline(res.success);
      setLastChecked(new Date());

      if (res.success) {
        onNotify?.(`Conexão Supabase Online! Latência: ${pingDuration}ms`);
      } else {
        onNotify?.(`Falha de conexão com Supabase: ${res.error || 'Offline'}`);
      }
    } catch (err: any) {
      console.error('Erro ao testar conexão:', err);
      setIsOnline(false);
      setLastChecked(new Date());
      onNotify?.(`Erro de conexão: ${err?.message || 'Offline'}`);
    } finally {
      setTestingConn(false);
    }
  };

  // Atualização automática a cada 30 minutos
  useEffect(() => {
    runCheck();

    // 30 minutos = 30 * 60 * 1000 ms
    const THIRTY_MINUTES_MS = 30 * 60 * 1000;
    const interval = setInterval(() => {
      runCheck(true);
    }, THIRTY_MINUTES_MS);

    return () => clearInterval(interval);
  }, [runCheck]);

  // Mensagem de estado consolidado
  const isHealthy = isSessionActive && isOnline;

  const formattedTimestamp = lastChecked
    ? lastChecked.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }) + ' (' + lastChecked.toLocaleDateString('pt-BR') + ')'
    : 'Aguardando verificação...';

  return (
    <div className="glass-card p-6 md:p-8 rounded-3xl space-y-6 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div 
        className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          isHealthy ? 'bg-emerald-500/10' : 'bg-amber-500/10'
        }`} 
      />

      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-roxo-suave/10 rounded-xl text-roxo-suave border border-roxo-suave/20">
              <Activity size={22} className={revalidating || testingConn ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white tracking-tight">
                Status de Sessão e Conexão
              </h3>
              <p className="text-xs text-slate-400">
                Monitoramento em tempo real da autenticação e infraestrutura Supabase
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem de Status Requerida */}
        <div 
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-bold transition-all shadow-lg ${
            isHealthy 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-emerald-500/5' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-amber-500/5'
          }`}
        >
          {isHealthy ? (
            <>
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              <span>✅ Sessão ativa e conexão estável</span>
            </>
          ) : (
            <>
              <AlertTriangle size={16} className="text-amber-400 shrink-0" />
              <span>⚠️ Sessão expirada ou conexão instável</span>
            </>
          )}
        </div>
      </div>

      {/* Grid de Informações de Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Provedor de Login */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Provedor de Login
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm font-display font-bold text-white truncate">
                {loading ? 'Verificando...' : provider}
              </p>
              {provider.toLowerCase().includes('google') && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                  OAuth
                </span>
              )}
            </div>
          </div>
        </div>

        {/* E-mail Autenticado */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-3.5">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
            <Mail size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              E-mail Autenticado
            </p>
            <p className="text-sm font-display font-bold text-white truncate mt-0.5" title={email}>
              {loading ? 'Carregando...' : email}
            </p>
          </div>
        </div>

        {/* Status da Sessão */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            isSessionActive 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            <Key size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Status da Sessão
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isSessionActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <p className={`text-sm font-display font-bold ${isSessionActive ? 'text-emerald-400' : 'text-red-400'}`}>
                {sessionStatus}
              </p>
            </div>
            {tokenExpiresAt && isSessionActive && (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                Expira: {tokenExpiresAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        </div>

        {/* Status da Conexão Supabase */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Conexão Supabase
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <p className={`text-sm font-display font-bold ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
              {latencyMs !== null && isOnline && (
                <span className="text-[10px] text-slate-400 font-mono">
                  ({latencyMs}ms)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Última Verificação */}
        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-3.5 sm:col-span-2 lg:col-span-2">
          <div className="p-2.5 bg-roxo-suave/10 text-roxo-suave rounded-xl border border-roxo-suave/20 shrink-0">
            <Clock size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Última Verificação
              </p>
              <span className="text-[10px] text-slate-500 font-medium bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                Auto-refresh: 30 min
              </span>
            </div>
            <p className="text-sm font-display font-bold text-white mt-0.5 truncate">
              {loading ? 'Atualizando...' : formattedTimestamp}
            </p>
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
        {/* Botão: Revalidar Sessão */}
        <button
          onClick={handleRevalidateSession}
          disabled={revalidating || loading}
          className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs bg-roxo-suave text-white hover:bg-roxo-suave/90 active:scale-95 transition-all shadow-lg shadow-roxo-suave/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Renova o token JWT de acesso junto ao Supabase Auth"
        >
          <RefreshCw size={16} className={revalidating ? 'animate-spin' : ''} />
          <span>{revalidating ? 'Renovando JWT...' : 'Revalidar Sessão'}</span>
        </button>

        {/* Botão: Testar Conexão */}
        <button
          onClick={handleTestConnection}
          disabled={testingConn || loading}
          className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-2xl font-bold text-xs bg-white/10 text-white hover:bg-white/20 active:scale-95 border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          title="Envia requisição de teste para o banco de dados Supabase"
        >
          <Zap size={16} className={`text-amber-400 ${testingConn ? 'animate-bounce' : ''}`} />
          <span>{testingConn ? 'Testando Conexão...' : 'Testar Conexão'}</span>
        </button>
      </div>
    </div>
  );
};
