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

export async function saveMarkerRulesAction(missionId: string, rules: any) {
  const admin = getAdmin()
  
  const { data: existing } = await admin.from('marker_rules').select('id').eq('mission_id', missionId).single()
  
  if (existing) {
    const { error } = await admin.from('marker_rules').update({ rules }).eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await admin.from('marker_rules').insert({ mission_id: missionId, rules })
    if (error) throw new Error(error.message)
  }

  revalidatePath(`/admin/missions/${missionId}/markers`)
}
