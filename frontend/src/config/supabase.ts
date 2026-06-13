import { createClient } from '@supabase/supabase-js';

// No front você pode usar a chave "anon public" tranquilamente
const supabaseUrl = 'https://ejuqgcdakmrdhvfmpgux.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdXFnY2Rha21yZGh2Zm1wZ3V4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA1NDMzOSwiZXhwIjoyMDk2NjMwMzM5fQ.-84svKQ6zUWL88c8Zu6vtJLTp-ShmBXm3RZfubvI3Uc'; // Copie lá da tela API Keys do Supabase (a primeira chave!)

export const supabase = createClient(supabaseUrl, supabaseAnonKey);