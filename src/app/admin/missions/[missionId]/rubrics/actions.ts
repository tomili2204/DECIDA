'use server'

import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function saveRubricsAction(missionId: string, payload: any) {
  const admin = getAdmin()
  
  // payload is expected to be an object mapping jenjang -> indicators
  // e.g. { 'SD': { interpretasi: {...} }, 'SMP': {...}, 'SMA': {...} }
  
  for (const [jenjang, indicators] of Object.entries(payload)) {
    // Upsert the rubric for this mission and jenjang
    const { data: existing } = await admin.from('rubrics').select('id').eq('mission_id', missionId).eq('jenjang', jenjang).single()
    
    if (existing) {
      const { error } = await admin.from('rubrics').update({ indicators }).eq('id', existing.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await admin.from('rubrics').insert({ mission_id: missionId, jenjang, indicators })
      if (error) throw new Error(error.message)
    }
  }

  revalidatePath(`/admin/missions/${missionId}/rubrics`)
}
