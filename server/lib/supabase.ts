import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL || 'https://cgigmuugieqaqxmysgrs.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-supabase-service-role-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);
