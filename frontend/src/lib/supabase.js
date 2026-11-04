import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://axpjsozhyypeqeycafql.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cGpzb3poeXlwZXFleWNhZnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNTI0MzMsImV4cCI6MjEwMTkyODQzM30.5F7uB7DcP1_7Fz1l3mxOMjNXPctr8PJhRGjuDBgLuIc";

/**
 * Singleton Supabase Client for Frontend.
 * Handles Native Auth, Storage, and Realtime Subscriptions.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
