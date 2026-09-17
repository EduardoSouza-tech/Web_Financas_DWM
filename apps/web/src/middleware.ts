import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Verificar se as variáveis de ambiente do Supabase estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Modo offline - apenas permitir acesso sem verificar autenticação
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('xyzcompany') || supabaseUrl.includes('placeholder')) {
    console.log('Modo offline - middleware desabilitado');
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  // Se usuário não está autenticado e tenta acessar rota protegida
  if (!user && (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname === '/profiles')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se usuário está autenticado e tenta acessar login/signup
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/profiles', request.url));
  }

  // Redirecionar raiz para dashboard se autenticado, senão para login
  if (request.nextUrl.pathname === '/') {
    if (user) {
      return NextResponse.redirect(new URL('/profiles', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/profiles', '/login', '/signup'],
};
