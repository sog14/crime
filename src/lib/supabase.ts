import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://evbikphmptlsdoobpvls.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YmlrcGhtcHRsc2Rvb2JwdmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTMyNDYsImV4cCI6MjA4Nzc4OTI0Nn0.hUHDcH9THx2iHxGWnCUagdvozSAzZfjRu4SyNdIgeiQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
