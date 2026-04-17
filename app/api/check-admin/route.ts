import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/supabaseServerClient';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({
        isAdmin: false,
        userId: null,
        error: 'Failed to get user: ' + userError.message,
      });
    }

    if (!user) {
      return NextResponse.json({
        isAdmin: false,
        userId: null,
        error: 'Not authenticated',
      });
    }

    // Check admin table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('user_id, role')
      .eq('user_id', user.id)
      .single();

    if (adminError) {
      return NextResponse.json({
        isAdmin: false,
        userId: user.id,
        error: 'Admin check error: ' + adminError.message,
        adminError: adminError,
      });
    }

    return NextResponse.json({
      isAdmin: !!admin,
      userId: user.id,
      email: user.email,
      role: admin?.role || null,
    });
  } catch (error) {
    return NextResponse.json({
      isAdmin: false,
      userId: null,
      error: 'Unexpected error: ' + (error instanceof Error ? error.message : 'Unknown error'),
    }, { status: 500 });
  }
}
