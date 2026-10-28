import { createClient } from '@supabase/supabase-js';
import { readConfig } from './config';
export const configuration = readConfig(import.meta.env);
const client = configuration.error ? null : createClient(configuration.url, configuration.key);
export function getSupabase() {
  if (!client) throw new Error(configuration.error ?? 'Supabase is not configured.');
  return client;
}
