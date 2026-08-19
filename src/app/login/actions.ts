'use server'

import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Fresh cookie-aware client — built inside the action so cookies() is called at action time
async function getSessionClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

function getAdminClient() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// Return type — never use redirect() inside useActionState actions
export type ActionResult = {
  error?: string | null
  success?: boolean
  redirectTo?: string
}

// ── STUDENT LOGIN ─────────────────────────────────────────────────────────────

export async function loginStudent(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const classCode = (formData.get('classCode') as string | null)?.trim() ?? ''
  const name = (formData.get('name') as string | null)?.trim() ?? ''

  if (!classCode || !name) {
    return { error: 'Kode mata kuliah dan nama harus diisi.' }
  }

  const admin = getAdminClient()

  // 1. Verify class exists
  const { data: cls, error: clsError } = await admin
    .from('classes')
    .select('id, name')
    .eq('code', classCode)
    .single()

  if (clsError || !cls) {
    return { error: `Mata kuliah "${classCode}" tidak ditemukan. Cek kembali kode kelasmu.` }
  }

  // 2. Dummy credentials (deterministic from name + class)
  const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const safeCode = classCode.toLowerCase().replace(/[^a-z0-9]/g, '')
  const dummyEmail = `${safeName}@${safeCode}.student.decida`
  const dummyPassword = `decida-${safeCode}-${safeName}-pwd`

  // 3. Try sign-in first (user may already exist)
  const supabase = await getSessionClient()
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: dummyEmail,
    password: dummyPassword,
  })

  if (signInErr) {
    // Find student by name in this class via profiles table (avoids getUserByEmail which doesn't exist in SDK)
    const { data: existingMember } = await admin
      .from('class_members')
      .select('student_id, profiles!inner(id, full_name)')
      .eq('class_id', cls.id)
      .eq('profiles.full_name', name)
      .maybeSingle()

    if (existingMember?.student_id) {
      // Student exists — update email (format may have changed) and reset password
      const { error: updateErr } = await admin.auth.admin.updateUserById(
        existingMember.student_id,
        { email: dummyEmail, password: dummyPassword }
      )
      if (updateErr) return { error: `Gagal reset akun: ${updateErr.message}` }
    } else {
      // Truly new student — create auth account
      const { data: authUser, error: createErr } = await admin.auth.admin.createUser({
        email: dummyEmail,
        password: dummyPassword,
        email_confirm: true,
      })
      if (createErr || !authUser?.user) {
        return { error: `Gagal membuat akun: ${createErr?.message ?? 'Unknown'}` }
      }
      const studentId = authUser.user.id
      await admin.from('profiles').insert({ id: studentId, role: 'student', full_name: name })
      await admin.from('class_members').insert({ class_id: cls.id, student_id: studentId })
    }

    // Sign in with refreshed credentials
    const { error: signInFinal } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: dummyPassword,
    })
    if (signInFinal) return { error: `Gagal masuk setelah reset: ${signInFinal.message}` }
  }

  // Session cookie now set — tell client to navigate
  return { success: true, redirectTo: '/workspace' }
}

// ── TEACHER LOGIN ─────────────────────────────────────────────────────────────

export async function loginTeacher(_prev: unknown, formData: FormData): Promise<ActionResult> {
  return loginEmail(formData, 'teacher')
}

// ── ADMIN LOGIN ───────────────────────────────────────────────────────────────

export async function loginAdmin(_prev: unknown, formData: FormData): Promise<ActionResult> {
  return loginEmail(formData, 'admin')
}

// ── SHARED EMAIL LOGIN ────────────────────────────────────────────────────────

async function loginEmail(formData: FormData, expectedRole: 'teacher' | 'admin'): Promise<ActionResult> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  if (!email || !password) {
    return { error: 'Email dan password harus diisi.' }
  }

  const supabase = await getSessionClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: 'Email atau password salah.' }
  }

  // Verify role via admin client (bypasses RLS)
  const admin = getAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const role = profile?.role as string | undefined
  if (role !== expectedRole && role !== 'admin') {
    await supabase.auth.signOut()
    return { error: `Akun ini bukan akun ${expectedRole === 'teacher' ? 'dosen' : 'admin'}.` }
  }

  const dest = role === 'admin' || expectedRole === 'admin' ? '/admin/dashboard' : '/teacher/dashboard'
  return { success: true, redirectTo: dest }
}
