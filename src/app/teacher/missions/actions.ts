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

export async function deleteMission(missionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authorized')

  const admin = getAdmin()
  const { error } = await admin
    .from('missions')
    .delete()
    .eq('id', missionId)
    .eq('teacher_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/teacher/missions')
  revalidatePath('/teacher/class/[classId]', 'page')
}

export async function saveMission(missionId: string | null, payload: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authorized')

  const admin = getAdmin()
  const dataToSave = {
    ...payload,
    teacher_id: user.id
  }

  let error;

  if (missionId) {
    // Update
    const res = await admin
      .from('missions')
      .update(dataToSave)
      .eq('id', missionId)
      .eq('teacher_id', user.id)
    error = res.error
  } else {
    // Insert
    const res = await admin
      .from('missions')
      .insert(dataToSave)
    error = res.error
  }

  if (error) throw new Error(error.message)
  
  revalidatePath('/teacher/missions')
  revalidatePath('/teacher/class/[classId]', 'page')
}
