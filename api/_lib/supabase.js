// api/_lib/supabase.js
// Service Supabase — service_role key UNIQUEMENT ici
// Ne jamais exposer ce fichier côté client

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;
