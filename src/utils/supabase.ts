import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vcqwgecpjoponkohptip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcXdnZWNwam9wb25rb2hwdGlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MzU0MjQsImV4cCI6MjA2NzQxMTQyNH0.9folYV_P3J8CHhmGh9GWpUzlOWkKPKPdkh3cT33waX8';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handleApiError = (error: any, setSnackbar: (snackbar: any) => void, defaultMessage: string) => {
  console.error('API Error:', error);
  setSnackbar({
    open: true,
    message: error?.message || defaultMessage,
    severity: 'error'
  });
};

export const logDebug = (message: string, data?: any) => {
  console.log(`[DEBUG] ${message}`, data);
};