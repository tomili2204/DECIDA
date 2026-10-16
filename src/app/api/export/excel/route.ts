import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { generateStudentAssessmentExcel } from '@/lib/exportExcel'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdmin()
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId') || undefined

    // Validasi Keamanan: Dosen HANYA boleh unduh kelas miliknya sendiri
    if (profile.role === 'teacher') {
      if (!classId) {
        return NextResponse.json({ error: 'Dosen wajib menentukan ID kelas yang diampu.' }, { status: 400 })
      }
      const { data: cls } = await admin.from('classes').select('teacher_id').eq('id', classId).single()
      if (!cls || cls.teacher_id !== user.id) {
        return NextResponse.json({ error: 'Anda tidak memiliki hak akses untuk mengunduh laporan kelas ini.' }, { status: 403 })
      }
    }

    const excelBuffer = await generateStudentAssessmentExcel(classId)
    const fileName = classId ? `Laporan-Asesmen-Kelas-${classId.slice(0, 8)}.xlsx` : `Laporan-Asesmen-Semua-Kelas.xlsx`

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error: any) {
    console.error('Export Excel Error:', error)
    return NextResponse.json({ error: error.message || 'Gagal membuat file excel' }, { status: 500 })
  }
}
