import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
   import { NextRequest, NextResponse } from 'next/server';
   import { Database } from '@/types/supabase';

   export async function middleware(req: NextRequest) {
     const res = NextResponse.next();
     const supabase = createMiddlewareClient<Database>({ req, res });
     
     // Refresh session if expired
     const {
       data: { session },
     } = await supabase.auth.getSession();

     // Rutas protegidas que requieren autenticación
     const protectedRoutes = ['/dashboard'];
     
     // Rutas de autenticación a las que no se debe acceder si ya se está autenticado
     const authRoutes = ['/signin', '/signup', '/reset-password'];

     const path = req.nextUrl.pathname;
     
     // Si la ruta está protegida y no hay sesión, redirigir a login
     if (protectedRoutes.some(route => path.startsWith(route)) && !session) {
       return NextResponse.redirect(new URL('/signin', req.url));
     }
     
     // Si ya está autenticado e intenta acceder a páginas de auth, redirigir al dashboard
     if (authRoutes.some(route => path.startsWith(route)) && session) {
       return NextResponse.redirect(new URL('/dashboard', req.url));
     }

     return res;
   }

   // Especifica en qué rutas se ejecutará el middleware
   export const config = {
     matcher: [
       // Rutas protegidas
       '/dashboard/:path*',
       // Rutas de autenticación
       '/signin',
       '/signup', 
       '/reset-password'
     ],
   };