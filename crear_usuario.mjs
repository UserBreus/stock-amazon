import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUser() {
  console.log('Creando usuario del sistema...');
  const { data, error } = await supabase.auth.signUp({
    email: 'user@nexus.com',
    password: 'vilardebo2031',
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('¡Usuario creado con éxito en auth.users!');
    console.log('El trigger SQL lo asignó a roles_usuario automáticamente como admin.');
  }
}

createUser();
