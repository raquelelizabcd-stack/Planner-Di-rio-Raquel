import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  // Prioritize environment variables, but strictly validate the URL
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  
  const defaultUrl = 'https://cjnagdninashngvpxidc.supabase.co'; // Base URL para o client JS
  const defaultKey = 'sb_publishable__Pn9EN9UXSnPAYhL4X86nA_E8jqveLM';

  // Return the environment variable only if it looks like a valid URL, otherwise use the provided default
  const finalUrl = (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) ? envUrl : defaultUrl;
  const finalKey = (envKey && typeof envKey === 'string' && envKey.length > 50) ? envKey : defaultKey;

  return { url: finalUrl, key: finalKey };
};

const { url, key } = getSupabaseConfig();
console.log('Supabase carregado com URL:', url);
if (typeof window !== 'undefined') {
  (window as any).__SUPABASE_URL = url;
  (window as any).__SUPABASE_KEY_SET = !!key;
}
// Storage volátil em memória (RAM) - impede armazenamento em localStorage, sessionStorage ou cookies
const memorySessionStore: Record<string, string> = {};

const volatileStorage = {
  getItem: (key: string): string | null => {
    return memorySessionStore[key] ?? null;
  },
  setItem: (key: string, value: string): void => {
    memorySessionStore[key] = value;
  },
  removeItem: (key: string): void => {
    delete memorySessionStore[key];
  },
};

// Limpeza defensiva preventiva de resíduos de autenticação legados
if (typeof window !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') || k.includes('supabase.auth') || k.includes('auth-token'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('sb-') || k.includes('supabase.auth') || k.includes('auth-token'))) {
        sessionKeysToRemove.push(k);
      }
    }
    sessionKeysToRemove.forEach(k => sessionStorage.removeItem(k));
  } catch (err) {
    console.warn('Erro ao limpar storages legados:', err);
  }
}

export const supabase = createClient(url, key, {
  auth: {
    storage: volatileStorage,
    persistSession: true, // Mantém a sessão ativa na memória RAM apenas durante o ciclo de vida da aba
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;
}
