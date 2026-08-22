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

export async function removeStudentAction(classId: string, studentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const admin = getAdmin()
  
  // Verify ownership
  const { data: cls } = await admin.from('classes').select('teacher_id').eq('id', classId).single()
  if (!cls || cls.teacher_id !== user.id) {
    throw new Error('Unauthorized')
  }

  // Delete from class_members
  const { error: membersErr } = await admin
    .from('class_members')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId)
    
  if (membersErr) throw new Error(membersErr.message)
  
  // Find all missions in this class
  const { data: missions } = await admin.from('missions').select('id').eq('class_id', classId)
  
  if (missions && missions.length > 0) {
    const missionIds = missions.map(m => m.id)
    
    // Delete their sessions for those missions
    await admin
      .from('sessions')
      .delete()
      .in('mission_id', missionIds)
      .eq('student_id', studentId)
  }

  revalidatePath(`/teacher/class/${classId}`)
}
