import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const logs: string[] = []

  try {
    const { email, password, expectedRole } = await request.json()
    logs.push(`Mencoba login untuk email: ${email}, expectedRole: ${expectedRole}`)

    if (!email || !password) {
      logs.push('Error: Email atau password kosong')
      return NextResponse.json({ error: 'Email dan password harus diisi.', logs }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Sign in and set cookies on the response
    const response = NextResponse.json({ ok: true, logs })

    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
          logs.push(`${cookies.length} cookies di-set`)
        },
      },
    })

    logs.push('Memanggil supabase.auth.signInWithPassword...')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error || !data.user) {
      logs.push(`Sign-in error: ${error?.message || 'No user returned'}`)
      return NextResponse.json({ error: 'Email atau password salah.', logs, rawError: error }, { status: 401 })
    }

    logs.push(`Sign-in berhasil, User ID: ${data.user.id}`)

    // Verify role via admin client
    const admin = createAdminSupabase(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    logs.push('Mengecek role dari tabel profiles...')
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileErr) {
      logs.push(`Profile fetch error: ${profileErr.message}`)
    } else {
      logs.push(`Profile ditemukan, role: ${profile?.role}`)
    }

    const role = profile?.role as string | undefined
    if (role !== expectedRole && role !== 'admin') {
      logs.push(`Role tidak sesuai. Diharapkan: ${expectedRole}, Aktual: ${role}. Melakukan sign out.`)
      await supabase.auth.signOut()
      return NextResponse.json({
        error: `Akun ini bukan akun ${expectedRole === 'teacher' ? 'Dosen' : 'admin'}.`,
        logs
      }, { status: 403 })
    }

    const dest = role === 'admin' || expectedRole === 'admin' ? '/admin/dashboard' : '/teacher/dashboard'
    logs.push(`Redirecting ke: ${dest}`)
    
    // We need to recreate the response object to include the final logs since we appended to it
    const finalResponse = NextResponse.json({ ok: true, redirectTo: dest, logs })
    // Copy cookies from the old response
    response.cookies.getAll().forEach(cookie => {
        finalResponse.cookies.set(cookie.name, cookie.value)
    })

    return finalResponse
  } catch (err: any) {
    logs.push(`Exception: ${err.message}`)
    return NextResponse.json({ error: err.message, logs }, { status: 500 })
  }
}

