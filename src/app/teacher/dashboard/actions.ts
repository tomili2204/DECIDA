'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function createClassAction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = getAdmin()
  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const jenjang = (formData.get('jenjang') as string) || 'SMA'

  if (!name || !code) throw new Error('Data tidak lengkap')

  const { error } = await admin.from('classes').insert({
    name,
    code,
    jenjang,
    teacher_id: user.id
  })

  if (error) throw new Error(error.message)

  revalidatePath('/teacher/dashboard')
}

export async function deleteClassAction(classId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = getAdmin()
  
  // Verify ownership
  const { data: cls } = await admin.from('classes').select('teacher_id').eq('id', classId).single()
  if (!cls || cls.teacher_id !== user.id) {
    throw new Error('Unauthorized')
  }

  const { error } = await admin.from('classes').delete().eq('id', classId)
  if (error) throw new Error(error.message)

  revalidatePath('/teacher/dashboard')
}
