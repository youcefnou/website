import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isRecoverableAuthError } from '@/lib/auth/safe-auth';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // In development, provide a helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('Supabase environment variables are not configured.');
      console.error(
        'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      );
      console.error('See .env.example for reference');
    }

    // Block admin routes when Supabase is not configured
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
    const isAdminApiRoute = request.nextUrl.pathname.startsWith('/api/admin');
    const isAuthRoute =
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup');
    const isAccountRoute = request.nextUrl.pathname.startsWith('/account');

    if (isAdminRoute || isAdminApiRoute || isAuthRoute || isAccountRoute) {
      if (isAdminApiRoute || request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Service configuration error. Please contact the administrator.' },
          { status: 503 }
        );
      }

      // Redirect to home with error message
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('error', 'service_unavailable');
      return NextResponse.redirect(redirectUrl);
    }

    // Allow access to public routes without authentication
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Check if accessing admin route or admin API route
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isAdminApiRoute = request.nextUrl.pathname.startsWith('/api/admin');

  if (isAdminRoute || isAdminApiRoute) {
    let user = null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        if (isRecoverableAuthError(error.message)) {
          user = null;
        } else {
          throw error;
        }
      } else {
        user = data.user;
      }
    } catch (error) {
      if (!isRecoverableAuthError(error)) {
        throw error;
      }
      user = null;
    }

    // Return 401 for API routes, redirect for page routes
    if (!user) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // Check if user is admin by querying admins table
    const { data: admin, error } = await supabase
      .from('admins')
      .select('user_id, role')
      .eq('user_id', user.id)
      .single();

    // Return 403 for API routes, redirect for page routes
    if (!admin || error) {
      if (isAdminApiRoute) {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      redirectUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(redirectUrl);
    }

    // Add admin role to response headers for use in server components
    response.headers.set('x-admin-role', admin.role);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
