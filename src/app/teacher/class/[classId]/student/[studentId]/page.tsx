import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function StudentDetailPage(props: { params: Promise<{ classId: string; studentId: string }> }) {
  const params = await props.params
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get service role to query student data
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const admin = createServerClient(supabaseUrl, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  })

  // Verify teacher owns this class
  const { data: classData } = await admin
    .from('classes')
    .select('name, code')
    .eq('id', params.classId)
    .eq('teacher_id', user.id)
    .single()

  if (!classData) redirect('/teacher/dashboard')

  // Fetch student profile
  const { data: student } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', params.studentId)
    .single()

  if (!student) redirect(`/teacher/class/${params.classId}`)

  // Fetch their sessions with missions, step_answers, and ai_reports
  const { data: sessions } = await admin
    .from('sessions')
    .select(`
      id,
      status,
      created_at,
      missions(title),
      step_answers(step_number, answer_text),
      ai_reports(report_data)
    `)
    .eq('student_id', params.studentId)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/teacher/class/${params.classId}`} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{student.full_name}</h1>
            <p className="text-sm text-slate-500">Kelas: <span className="font-bold">{classData.name}</span></p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {(!sessions || sessions.length === 0) ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            Mahasiswa ini belum memulai misi apapun.
          </div>
        ) : (
          <div className="space-y-8">
            {sessions.map((session: any) => {
              const aiReport = session.ai_reports?.report_data || (Array.isArray(session.ai_reports) ? session.ai_reports[0]?.report_data : null)
              const answers = session.step_answers?.sort((a: any, b: any) => a.step_number - b.step_number) || []

              return (
                <div key={session.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{(session.missions as any)?.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Mulai: {new Date(session.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${session.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {session.status === 'completed' ? 'Selesai' : 'Sedang Dikerjakan'}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Jawaban Mahasiswa */}
                    <div>
                      <h4 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Hasil Pengerjaan
                      </h4>
                      {answers.length === 0 ? (
                        <p className="text-sm text-slate-400 italic">Belum ada jawaban tersimpan.</p>
                      ) : (
                        <div className="space-y-4">
                          {answers.map((ans: any) => (
                            <div key={ans.step_number} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                              <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Langkah {ans.step_number}</h5>
                              <p className="text-sm text-slate-800 whitespace-pre-wrap">{ans.answer_text || <span className="italic text-slate-400">Kosong</span>}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Profil Analitik */}
                    <div>
                      <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Profil Analitik (AI)
                      </h4>
                      
                      {!aiReport ? (
                        <p className="text-sm text-slate-400 italic">
                          {session.status === 'completed' 
                            ? 'Analitik belum tersedia.' 
                            : 'Analitik akan dibuat saat mahasiswa menyelesaikan misi.'}
                        </p>
                      ) : (
                        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 space-y-5">
                          
                          <div>
                            <h5 className="text-xs font-bold text-emerald-800 uppercase mb-2">Ringkasan Naratif</h5>
                            <p className="text-sm text-slate-700 italic">"{aiReport.ringkasan_naratif}"</p>
                          </div>
                          
                          {aiReport.profil_per_indikator && Array.isArray(aiReport.profil_per_indikator) && (
                            <div>
                              <h5 className="text-xs font-bold text-emerald-800 uppercase mb-3">Detail Indikator Kognitif</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {aiReport.profil_per_indikator.map((item: any, idx: number) => {
                                  let badgeColor = 'bg-slate-100 text-slate-700'
                                  if (item.level === 'cakap') badgeColor = 'bg-blue-100 text-blue-700'
                                  if (item.level === 'berkembang') badgeColor = 'bg-amber-100 text-amber-700'
                                  if (item.level === 'perlu_bimbingan') badgeColor = 'bg-rose-100 text-rose-700'
                                  
                                  return (
                                    <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg">
                                      <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-xs text-slate-700 uppercase">{item.indikator}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                                          {item.level.replace('_', ' ')}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500">{item.narasi}</p>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {aiReport.rekomendasi_dosen && (
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mt-4">
                              <h5 className="text-xs font-bold text-amber-800 uppercase mb-1 flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Rekomendasi untuk Dosen
                              </h5>
                              <p className="text-xs text-amber-900">{aiReport.rekomendasi_dosen}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
