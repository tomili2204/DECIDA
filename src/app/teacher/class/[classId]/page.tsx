import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MissionPreviewList from './MissionPreviewList'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function ClassDetailPage(props: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  
  const page = parseInt(searchParams.page || '1', 10)
  const limit = parseInt(searchParams.limit || '10', 10)

  const supabase = await createClient()
  const admin = getAdmin()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') redirect('/login')

  // Fetch class details
  const { data: classData } = await admin
    .from('classes')
    .select('*')
    .eq('id', params.classId)
    .eq('teacher_id', user.id)
    .single()

  if (!classData) redirect('/teacher/dashboard')

  // Fetch students with pagination
  const { data: members, count, error: membersErr } = await admin
    .from('class_members')
    .select('student_id, profiles(full_name)', { count: 'exact' })
    .eq('class_id', params.classId)
    .range((page - 1) * limit, page * limit - 1)

  if (membersErr) {
    console.error('Error fetching members:', membersErr)
  }
  
  // Fetch available missions
  const { data: missions, error: missionsErr } = await admin
    .from('missions')
    .select('id, title, scenario, difficulty')
    .eq('class_id', params.classId)
    .order('created_at', { ascending: true })

  if (missionsErr) {
    console.error('Error fetching missions:', missionsErr)
  }

  const totalItems = count || 0
  const totalPages = Math.ceil(totalItems / limit)

  // Fetch latest AI report for each student
  const studentIds = members?.map(m => m.student_id) || []
  let aiReportsMap: Record<string, any> = {}
  
  if (studentIds.length > 0) {
    const { data: latestSessions } = await admin
      .from('sessions')
      .select('student_id, ai_reports(report_data)')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })

    if (latestSessions) {
      latestSessions.forEach((s: any) => {
        const reportData = Array.isArray(s.ai_reports) ? s.ai_reports[0]?.report_data : s.ai_reports?.report_data
        if (!aiReportsMap[s.student_id] && reportData) {
          aiReportsMap[s.student_id] = reportData
        }
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/teacher/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{classData.name}</h1>
            <p className="text-sm text-slate-500">
              Kode Kelas: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{classData.code}</span>
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        
        {/* Missions / Kasus Soal */}
        <MissionPreviewList 
          missions={missions || []} 
        />

        {/* Student List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-slate-800 text-lg">Daftar Mahasiswa</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Tampilkan:</span>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {[10, 15, 20, 30, 50].map(size => (
                  <Link 
                    key={size}
                    href={`/teacher/class/${params.classId}?page=1&limit=${size}`}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${limit === size ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {size}
                  </Link>
                ))}
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-sm rounded-full border border-indigo-100">
                {totalItems} Mahasiswa
              </span>
            </div>
          </div>

          {members && members.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="py-3 px-4 font-semibold text-sm text-slate-500 whitespace-nowrap">Nama Lengkap</th>
                      <th className="py-3 px-4 font-semibold text-sm text-slate-500 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 font-semibold text-xs text-slate-400 text-center" title="Interpretasi">INT</th>
                      <th className="py-3 px-4 font-semibold text-xs text-slate-400 text-center" title="Analisis">ANA</th>
                      <th className="py-3 px-4 font-semibold text-xs text-slate-400 text-center" title="Evaluasi">EVA</th>
                      <th className="py-3 px-4 font-semibold text-xs text-slate-400 text-center" title="Inferensi">INF</th>
                      <th className="py-3 px-4 font-semibold text-xs text-slate-400 text-center" title="Eksplanasi">EKS</th>
                      <th className="py-3 px-4 font-semibold text-xs text-slate-400 text-center" title="Regulasi Diri">REG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m: any, i: number) => {
                      const aiReport = aiReportsMap[m.student_id]
                      
                      const renderBadge = (indicatorName: string) => {
                        if (!aiReport || !aiReport.profil_per_indikator) return <span className="text-slate-300">-</span>
                        const ind = aiReport.profil_per_indikator.find((x: any) => x.indikator.toLowerCase() === indicatorName.toLowerCase())
                        if (!ind) return <span className="text-slate-300">-</span>
                        
                        const levelStr = ind.level.toLowerCase().trim()
                        
                        let badgeColor = 'bg-purple-100 text-purple-700' // Default for Mahir or unknown
                        if (levelStr === 'cakap') badgeColor = 'bg-blue-100 text-blue-700'
                        if (levelStr === 'berkembang') badgeColor = 'bg-amber-100 text-amber-700'
                        if (levelStr === 'perlu_bimbingan') badgeColor = 'bg-rose-100 text-rose-700'
                        
                        const initials = levelStr === 'perlu_bimbingan' ? 'PB' : levelStr === 'berkembang' ? 'B' : levelStr === 'cakap' ? 'C' : 'M'
                        
                        return (
                          <span className={`px-2 py-1 text-[10px] font-bold rounded ${badgeColor}`} title={ind.level.replace('_', ' ')}>
                            {initials}
                          </span>
                        )
                      }

                      return (
                        <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 text-slate-900 font-medium whitespace-nowrap">
                            <Link href={`/teacher/class/${params.classId}/student/${m.student_id}`} className="hover:text-indigo-600 hover:underline">
                              {(m.profiles as any)?.full_name}
                            </Link>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Aktif
                            </span>
                          </td>
                          <td className="py-4 px-2 text-center">{renderBadge('Interpretasi')}</td>
                          <td className="py-4 px-2 text-center">{renderBadge('Analisis')}</td>
                          <td className="py-4 px-2 text-center">{renderBadge('Evaluasi')}</td>
                          <td className="py-4 px-2 text-center">{renderBadge('Inferensi')}</td>
                          <td className="py-4 px-2 text-center">{renderBadge('Eksplanasi')}</td>
                          <td className="py-4 px-2 text-center">{renderBadge('Regulasi Diri')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-4">
                  <span className="text-sm text-slate-500">
                    Menampilkan <span className="font-medium">{(page - 1) * limit + 1}</span> - <span className="font-medium">{Math.min(page * limit, totalItems)}</span> dari <span className="font-medium">{totalItems}</span>
                  </span>
                  <div className="flex gap-1">
                    <Link 
                      href={`/teacher/class/${params.classId}?page=${Math.max(1, page - 1)}&limit=${limit}`}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${page === 1 ? 'border-slate-200 text-slate-400 pointer-events-none' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      Sebelumnya
                    </Link>
                    <Link 
                      href={`/teacher/class/${params.classId}?page=${Math.min(totalPages, page + 1)}&limit=${limit}`}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border ${page === totalPages ? 'border-slate-200 text-slate-400 pointer-events-none' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                    >
                      Selanjutnya
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-2">Belum ada mahasiswa yang bergabung ke kelas ini.</p>
              <p className="text-sm text-slate-400">Berikan kode kelas <strong className="text-indigo-600">{classData.code}</strong> kepada mahasiswa Anda.</p>
            </div>
          )}

          {members && members.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Keterangan Indikator & Skor</h4>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="text-slate-600"><strong className="text-slate-800">INT:</strong> Interpretasi</div>
                    <div className="text-slate-600"><strong className="text-slate-800">INF:</strong> Inferensi</div>
                    <div className="text-slate-600"><strong className="text-slate-800">ANA:</strong> Analisis</div>
                    <div className="text-slate-600"><strong className="text-slate-800">EKS:</strong> Eksplanasi</div>
                    <div className="text-slate-600"><strong className="text-slate-800">EVA:</strong> Evaluasi</div>
                    <div className="text-slate-600"><strong className="text-slate-800">REG:</strong> Regulasi Diri</div>
                  </div>
                </div>
                <div className="w-px bg-slate-200 hidden sm:block"></div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div className="flex items-center gap-2"><span className="w-5 text-center px-1 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[10px]">M</span> <span className="text-slate-600">Mahir</span></div>
                    <div className="flex items-center gap-2"><span className="w-5 text-center px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-bold text-[10px]">C</span> <span className="text-slate-600">Cakap</span></div>
                    <div className="flex items-center gap-2"><span className="w-5 text-center px-1 py-0.5 rounded bg-amber-100 text-amber-700 font-bold text-[10px]">B</span> <span className="text-slate-600">Berkembang</span></div>
                    <div className="flex items-center gap-2"><span className="w-5 text-center px-1 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">PB</span> <span className="text-slate-600">Perlu Bimbingan</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
