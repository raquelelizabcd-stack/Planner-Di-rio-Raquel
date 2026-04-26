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
export const supabase = createClient(url, key);
