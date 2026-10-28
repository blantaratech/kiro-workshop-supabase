export interface PublicConfig { url: string; key: string; error: string | null }
export function readConfig(env: Record<string, string | undefined>): PublicConfig {
  const url = (env.VITE_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  const fail = (error: string): PublicConfig => ({url:'',key:'',error});
  if (!url || !key) return fail('Add your Supabase project URL and publishable key to frontend/.env.local, then restart the app.');
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/' || /YOUR_|PROJECT_REF/i.test(url)) {
      return fail('Use the HTTPS Project URL from Supabase Connect, without /rest/v1 or other extra paths.');
    }
  } catch { return fail('The Supabase Project URL is not a valid HTTPS address.'); }
  if (key.startsWith('sb_secret_')) return fail('A secret key must never be used in the frontend. Copy the publishable key instead.');
  if (key.startsWith('sb_publishable_') && key.length > 20) return {url,key,error:null};
  if (key.startsWith('eyJ')) {
    try {
      const part = key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      const payload = JSON.parse(atob(part)) as {role?:string};
      if (payload.role === 'service_role') return fail('The service_role key is secret. Use the publishable key or legacy anon key.');
      if (payload.role === 'anon') return {url,key,error:null};
    } catch { /* A malformed key is handled by the message below. */ }
  }
  return fail('Copy the full Supabase publishable key (sb_publishable_...) or the legacy anon key.');
}
