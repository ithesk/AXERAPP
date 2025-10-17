import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createClient();
  
  // Verificar si el usuario está autenticado
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Si está autenticado, redirigir al dashboard
    if (session) {
      redirect('/dashboard');
    } else {
      // Si no está autenticado, redirigir a la página de inicio de sesión
      redirect('/signin');
    }
  } catch (error) {
    console.error('Error al verificar la sesión:', error);
    // En caso de error, redirigir a la página de inicio de sesión
    redirect('/signin');
  }
}