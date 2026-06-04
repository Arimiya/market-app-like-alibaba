import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseConfigurationMessage = isSupabaseConfigured
  ? ""
  : import.meta.env.DEV
    ? "Account services are not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local .env file."
    : "Account services are temporarily unavailable. Please try again later.";

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
