import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://czpofsdqzrqrhfhalfbw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6cG9mc2RxenJxcmhmaGFsZmJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4Mzc2MjEsImV4cCI6MjA2ODQxMzYyMX0.PQNmMJZKhYF2NR1Zk1ILhxbHHw7B85jtC65ekFcjxEc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
