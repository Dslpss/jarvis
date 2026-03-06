import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente para uso no Frontend e Backend (segue RLS se configurado)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com privilégios de Admin (apenas para uso no Backend/Server-Side)
export const supabaseAdmin = typeof window === 'undefined' 
  ? createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  : null;
