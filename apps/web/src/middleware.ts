import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que não precisam de autenticação
const publicRoutes = ['/login', '/']

// Rotas que precisam de autenticação
const protectedRoutes = ['/dashboard', '/cadastros', '/comercial', '/financeiro', '/producao', '/estoque', '/chat', '/admin', '/configuracoes', '/superadmin']

// Rotas especiais que não devem ser protegidas
const specialRoutes = ['/access-denied']

// Função para verificar se o token está válido (básico)
function isValidToken(token: string): boolean {
  if (!token) return false
  
  try {
    // Decodificar JWT básico para verificar expiração
    const payload = JSON.parse(atob(token.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    
    // Verificar se não expirou
    return payload.exp > now
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Permitir arquivos estáticos e API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // arquivos com extensão
  ) {
    return NextResponse.next()
  }

  // Verificar se é rota especial
  const isSpecialRoute = specialRoutes.some(route => pathname.startsWith(route))
  
  // Se for rota especial, permitir sempre
  if (isSpecialRoute) {
    return NextResponse.next()
  }
  
  // Verificar se é rota pública
  const isPublicRoute = publicRoutes.some(route => 
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  )
  
  // Verificar se é rota protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Obter token do cookie ou header
  const authToken = request.cookies.get('auth-token')?.value ||
                   request.headers.get('authorization')?.replace('Bearer ', '')

  // Se estiver em rota protegida sem token válido
  if (isProtectedRoute && !isValidToken(authToken || '')) {
    // Redirecionar para login com redirect URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Se estiver logado e tentar acessar login, redirecionar para dashboard
  if (pathname === '/login' && isValidToken(authToken || '')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirecionar root para dashboard se autenticado, senão para login
  if (pathname === '/') {
    if (isValidToken(authToken || '')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}