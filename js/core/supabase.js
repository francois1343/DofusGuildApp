// =============================================
// CONFIGURATION SUPABASE
// =============================================
const SUPABASE_URL = 'https://kafeinsurjbhtnvxjyiz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthZmVpbnN1cmpiaHRudnhqeWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjM1MjMsImV4cCI6MjA5NjU5OTUyM30._va5SQv5bLMxzKchnnEP8FMbo-USOuX0JCFVa_3Cgeg'; // ← Ta clé régénérée

// On utilise "db" pour éviter le conflit avec l'objet global "supabase" du CDN
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        flowType: 'pkce'
    }
});
