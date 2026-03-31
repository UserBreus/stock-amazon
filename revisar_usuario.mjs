import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkUsers() {
  console.log('--- Verificando Auth ---');
  // Attempt to sign in to see if user exists
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'user@nexus.com',
    password: 'vilardebo2031'
  });
  
  if (authError) {
    console.error('Error Auth:', authError.message);
    if (authError.message.includes('Invalid login credentials')) {
       console.log('Intentando registrar de nuevo...');
       const { error: signUpError } = await supabase.auth.signUp({
          email: 'user@nexus.com',
          password: 'vilardebo2031'
       });
       console.log('SignUp Resultado:', signUpError ? signUpError.message : 'Exito');
    }
  } else {
    console.log('Usuario existe y puede loguearse. ID:', authData.user.id);
    
    console.log('--- Verificando Tabla roles_usuario ---');
    const { data: rolesData, error: rolesError } = await supabase
      .from('roles_usuario')
      .select('*')
      .eq('id', authData.user.id);
      
    if (rolesError) {
      console.error('Error roles:', rolesError.message);
    } else {
      console.log('Roles encontrados:', rolesData);
      if (rolesData.length === 0) {
        console.log('¡ERROR! El trigger NO creó el rol. Intentando forzar insert manual...');
        const { error: insertError } = await supabase.from('roles_usuario').insert([{
           id: authData.user.id,
           email: 'user@nexus.com',
           rol: 'admin'
        }]);
        console.log('Insert manual:', insertError ? insertError.message : 'Exito');
      }
    }
  }
}

checkUsers();
