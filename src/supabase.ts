import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const missingConfigMessage =
  'Supabase no esta configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.';

function createUnavailableClient() {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(missingConfigMessage);
      },
    },
  ) as any;
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : createUnavailableClient();

export function handleSupabaseError(error: unknown, context: string) {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  console.error(`Supabase error at ${context}:`, error);
  alert(`Error (${context}): ${message}`);
}
