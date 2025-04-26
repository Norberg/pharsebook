import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pymzmxwikuxsxwlwgmpe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bXpteHdpa3V4c3h3bHdnbXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDEyNDQsImV4cCI6MjA2MTE3NzI0NH0.DqaKxHMDbsoi9XJ_sxyoKlJnGglEG00DIKhxLCUkFGU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);