import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  // Prioritize environment variables, but strictly validate the URL
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  
  const defaultUrl = 'https://cjnagdninashngvpxidc.supabase.co';
  const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbmFnZG5pbmFzaG5ndnB4aWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NjkwMjAsImV4cCI6MjA5MjA0NTAyMH0.0lYZ6a0vJaeb8D00rGBzdoRpJWe2jYU9NJJHl89VC_M';

  // Return the environment variable only if it looks like a valid URL, otherwise use the provided default
  const finalUrl = (envUrl && typeof envUrl === 'string' && envUrl.startsWith('http')) ? envUrl : defaultUrl;
  const finalKey = (envKey && typeof envKey === 'string' && envKey.length > 50) ? envKey : defaultKey;

  return { url: finalUrl, key: finalKey };
};

const { url, key } = getSupabaseConfig();
export const supabase = createClient(url, key);
