import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const logs: string[] = []

  try {
    const { classCode, name } = await request.json()
    if (!classCode || !name) {
      return NextResponse.json({ error: 'Kode kelas dan nama harus diisi.', logs }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const admin = createAdminSupabase(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // 1. Find class
    const { data: cls, error: clsErr } = await admin.from('classes').select('id').eq('code', classCode).single()
    if (clsErr || !cls) {
      return NextResponse.json({ error: `Kelas "${classCode}" tidak ditemukan.`, logs }, { status: 404 })
    }
    logs.push(`Kelas ditemukan: ${cls.id}`)

    // 2. Deterministic email & password
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const safeCode = classCode.toLowerCase().replace(/[^a-z0-9]/g, '')
    const email = `${safeName}@${safeCode}.decida.local`
    const password = `pwd-${safeCode}-${safeName}-2026`
    logs.push(`Email: ${email}`)

    // 3. Prepare response (cookies will be set on this)
    const response = NextResponse.json({ ok: true, logs })
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name: n, value, options }) => {
            response.cookies.set(n, value, options)
          })
          logs.push(`${cookies.length} cookies di-set`)
        },
      },
    })

    // 4. Try sign in first (fastest path for returning users)
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })

    if (!signInErr) {
      logs.push('Login berhasil (user sudah ada)')
      // Ensure profile & membership exist
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await admin.from('profiles').upsert({ id: user.id, role: 'student', full_name: name }, { onConflict: 'id' })
        await admin.from('class_members').upsert(
          { class_id: cls.id, student_id: user.id },
          { onConflict: 'class_id,student_id' }
        )
      }
      return response
    }

    logs.push(`Sign-in gagal: ${signInErr.message} → buat user baru`)

    // 5. Create new user
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createErr) {
      logs.push(`Create error: ${createErr.message}`)

      // If "already registered", the password format changed. Use GoTrue REST API to find & update.
      if (createErr.message.includes('already been registered')) {
        logs.push('User sudah ada tapi password salah. Mencari via REST API...')

        // Use GoTrue admin REST API directly to find user by email
        const searchRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?filter=email%20eq%20${encodeURIComponent(email)}`, {
          headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
        })
        const searchData = await searchRes.json()
        const users = searchData?.users ?? searchData ?? []
        logs.push(`REST search result: ${JSON.stringify(users).substring(0, 200)}`)

        // If we found the user, update password
        const foundUser = Array.isArray(users) ? users.find((u: any) => u.email === email) : null
        if (foundUser) {
          logs.push(`User ditemukan via REST: ${foundUser.id}`)
          const { error: updateErr } = await admin.auth.admin.updateUserById(foundUser.id, { password })
          if (updateErr) {
            return NextResponse.json({ error: `Gagal update password: ${updateErr.message}`, logs }, { status: 500 })
          }
          // Try sign in again
          const { error: retryErr } = await supabase.auth.signInWithPassword({ email, password })
          if (retryErr) {
            return NextResponse.json({ error: `Gagal login setelah update: ${retryErr.message}`, logs }, { status: 500 })
          }
          logs.push('Login berhasil setelah password update!')
          await admin.from('profiles').upsert({ id: foundUser.id, role: 'student', full_name: name }, { onConflict: 'id' })
          await admin.from('class_members').upsert(
            { class_id: cls.id, student_id: foundUser.id },
            { onConflict: 'class_id,student_id' }
          )
          return response
        }

        return NextResponse.json({ error: 'User ada di auth tapi tidak bisa ditemukan.', logs }, { status: 500 })
      }

      return NextResponse.json({ error: `Gagal buat akun: ${createErr.message}`, logs }, { status: 500 })
    }

    // 6. User created successfully
    const studentId = newUser.user.id
    logs.push(`User dibuat: ${studentId}`)

    await admin.from('profiles').insert({ id: studentId, role: 'student', full_name: name })
    await admin.from('class_members').insert({ class_id: cls.id, student_id: studentId })
    logs.push('Profile & membership dibuat')

    // 7. Sign in
    const { error: finalSignInErr } = await supabase.auth.signInWithPassword({ email, password })
    if (finalSignInErr) {
      return NextResponse.json({ error: `Login gagal setelah create: ${finalSignInErr.message}`, logs }, { status: 500 })
    }
    logs.push('Login berhasil!')

    return response
  } catch (err: any) {
    logs.push(`Exception: ${err.message}`)
    return NextResponse.json({ error: err.message, logs }, { status: 500 })
  }
}
