import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/']
const DEMO_COOKIE = 'ftth_demo'

const ROLE_ROUTES: Record<string, string[]> = {
  '/invoices': ['admin', 'project_manager', 'finance'],
  '/contract': ['admin', 'project_manager', 'finance'],
  '/teams': ['admin', 'project_manager'],
  '/settings': ['admin'],
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow static assets and API routes through
  if (isPublicPath(pathname)) {
    return NextResponse.next({ request })
  }

  const isDemo = request.cookies.get(DEMO_COOKIE)?.value === '1'
  if (isDemo) return NextResponse.next({ request })

  // Guard: if env vars are missing, skip auth check to avoid redirect loops
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const loginUrl = new URL('/login', request.url)
      // Prevent redirect loop: if already heading to login, let through
      if (pathname === '/login') return NextResponse.next({ request })
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated user on login page → send to dashboard
    if (pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Role-based access control
    const matchedRoute = Object.keys(ROLE_ROUTES).find((route) => pathname.startsWith(route))
    if (matchedRoute) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile) {
        const allowedRoles = ROLE_ROUTES[matchedRoute]!
        if (!allowedRoles.includes(profile.role)) {
          return NextResponse.redirect(new URL('/', request.url))
        }
      }
    }
  } catch {
    // Auth error — let the request through to avoid redirect loops
    return NextResponse.next({ request })
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
