import { createClient } from "@supabase/supabase-js";

// Get these from Supabase → Project Settings → API
const supabaseUrl = "https://yharxzsfwkeyrylqtuqj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloYXJ4enNmd2tleXJ5bHF0dXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODg4ODAsImV4cCI6MjA3Mjc2NDg4MH0.lf-b4nqrY3BD4fa2gZxH5FPcDxOy8DAl1X2GCGnsJIY";

export const supabase = createClient(supabaseUrl, supabaseKey);
