import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  // Inicializar la respuesta
  const res = NextResponse.next();

  // Crear un cliente de Supabase para el middleware
  const supabase = createMiddlewareClient({ req, res });

  // Verificar sesión
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Configurar redireccionamientos basados en la autenticación
  const isLandingPage = req.nextUrl.pathname === '/';
  const isAuthRoute = req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/signup';
  const isPublicRoute = isLandingPage || isAuthRoute || req.nextUrl.pathname.startsWith('/error-');

  // Si no hay sesión y no es una ruta pública, redirigir a landing page
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Si hay sesión e intenta acceder a landing o páginas de autenticación, redirigir a dashboard
  if ((isLandingPage || isAuthRoute) && session) {
    return NextResponse.redirect(new URL('/entradas', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};