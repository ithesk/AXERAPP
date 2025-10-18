import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();
    
    // Si la ruta comienza con /admin y no hay sesión, redirigir a login
    if (req.nextUrl.pathname.startsWith('/admin') && !session) {
      return NextResponse.redirect(new URL('/signin', req.url));
    }
    
    // Si intenta acceder a páginas de auth estando autenticado, redirigir a admin
    if ((req.nextUrl.pathname === '/signin' || req.nextUrl.pathname === '/signup') && session) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    
    return res;
  } catch (error) {
    console.error('Error:', error);
    return res;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/signin', '/signup']
};