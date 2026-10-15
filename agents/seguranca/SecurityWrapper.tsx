import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, ShieldCheck, X, Eye } from 'lucide-react';
import { agenteSeguranca, BLOCKED_SECURITY_MESSAGE } from './index';
import { SecurityDetectionLog, SecurityLayer } from './types';

/**
 * Hook do Guardião Global para o ecossistema React
 */
export function useSecurityGuardian() {
  const [ultimoBloqueio, setUltimoBloqueio] = useState<SecurityDetectionLog | null>(null);
  const [bloqueiosRecentes, setBloqueiosRecentes] = useState<SecurityDetectionLog[]>(() => 
    agenteSeguranca.obterUltimosBloqueios()
  );
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);

  useEffect(() => {
    const handleSecurityBlock = (event: any) => {
      const detail: SecurityDetectionLog = event.detail;
      setUltimoBloqueio(detail);
      setBloqueiosRecentes(agenteSeguranca.obterUltimosBloqueios());
      setShowNotificationBadge(true);

      // Auto-oculta o badge após 8 segundos
      const timer = setTimeout(() => {
        setShowNotificationBadge(false);
      }, 8000);

      return () => clearTimeout(timer);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('security-guardian-block', handleSecurityBlock);
      return () => window.removeEventListener('security-guardian-block', handleSecurityBlock);
    }
  }, []);

  const validarTexto = useCallback((texto: string, camada: SecurityLayer = 'frontend'): string => {
    return agenteSeguranca.inspecionarCamada(camada, texto).conteudoSanitizado;
  }, []);

  const validarInput = useCallback((valor: string, onBlock?: () => void): string => {
    const res = agenteSeguranca.inspecionarFrontend(valor, { type: 'input' });
    if (res.includes(BLOCKED_SECURITY_MESSAGE) && onBlock) {
      onBlock();
    }
    return res;
  }, []);

  const dismissBadge = useCallback(() => {
    setShowNotificationBadge(false);
  }, []);

  return {
    validarTexto,
    validarInput,
    ultimoBloqueio,
    bloqueiosRecentes,
    showNotificationBadge,
    dismissBadge,
    estatisticas: agenteSeguranca.obterEstatisticas()
  };
}

/**
 * Badge vermelho discreto exigido:
 * “🛡️ Segurança: dado sensível bloqueado.”
 */
export const SecurityBadge: React.FC<{
  onOpenConsole?: () => void;
  className?: string;
  forceShow?: boolean;
}> = ({ onOpenConsole, className = '', forceShow = false }) => {
  const { ultimoBloqueio, showNotificationBadge, dismissBadge } = useSecurityGuardian();
  const visible = forceShow || showNotificationBadge;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className={`fixed top-4 right-4 z-[99999] max-w-sm bg-red-950/90 border border-red-500/40 text-red-200 shadow-2xl backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-3 ${className}`}
        >
          <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <ShieldAlert size={18} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                {ultimoBloqueio?.camada === 'auth' ? '🛡️ Acesso não autorizado bloqueado' : '🛡️ Segurança: dado sensível bloqueado.'}
              </span>
            </div>
            {ultimoBloqueio && (
              <p className="text-[10px] text-red-300/80 truncate mt-0.5">
                Camada <span className="font-semibold uppercase text-red-200">[{ultimoBloqueio.camada}]</span> • {ultimoBloqueio.tipo_dado}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onOpenConsole && (
              <button
                onClick={onOpenConsole}
                title="Abrir Console de Segurança"
                className="p-1 hover:bg-white/10 rounded-lg text-red-300 hover:text-white transition-colors cursor-pointer text-[10px] font-bold underline px-1.5"
              >
                Ver
              </button>
            )}
            <button
              onClick={dismissBadge}
              className="p-1 hover:bg-white/10 rounded-lg text-red-300/70 hover:text-white transition-colors cursor-pointer"
              title="Fechar alerta"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Componente Wrapper para envolver inputs, labels, tooltips ou blocos de texto
 */
export const SecurityWrapper: React.FC<{
  children?: React.ReactNode;
  text?: string;
  camada?: SecurityLayer;
  type?: 'input' | 'label' | 'placeholder' | 'render';
  className?: string;
}> = ({ children, text, camada = 'frontend', type = 'render', className = '' }) => {
  if (text) {
    const sanitizado = agenteSeguranca.inspecionarFrontend(text, { type });
    const foiBloqueado = sanitizado.includes(BLOCKED_SECURITY_MESSAGE);

    return (
      <span className={`${className} ${foiBloqueado ? 'text-amber-400 font-semibold' : ''}`}>
        {sanitizado}
      </span>
    );
  }

  return <div className={`relative ${className}`}>{children}</div>;
};

/**
 * Renderiza o conteúdo apenas se o e-mail for o da conta autorizada
 */
export const AuthGuard: React.FC<{
  email?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ email, children, fallback = null }) => (
  agenteSeguranca.emailAutorizado(email) ? <>{children}</> : <>{fallback}</>
);

export default SecurityWrapper;
