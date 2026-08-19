import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function DebugMarkerDetail({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
    redirect('/')
  }

  // Fetch session
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, profiles:student_id(full_name, jenjang), missions:mission_id(title)')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  // Fetch markers
  const { data: markerRow } = await supabase
    .from('markers')
    .select('indicators')
    .eq('session_id', sessionId)
    .single()

  const indicators = markerRow?.indicators || null

  // Fetch AI Report
  const { data: aiReportRow } = await supabase
    .from('ai_reports')
    .select('report_data, created_at, model_version')
    .eq('session_id', sessionId)
    .single()

  const aiReport = aiReportRow?.report_data || null

  async function recalculateMarkers() {
    'use server'
    const sb = await createClient()
    const { aggregateMarkers } = await import('@/lib/markers/aggregate')
    await aggregateMarkers(sessionId, sb)
    revalidatePath(`/admin/debug/markers/${sessionId}`)
  }

  async function regenerateAI() {
    'use server'
    const { generateAIReport } = await import('@/lib/ai/interpreter')
    await generateAIReport(sessionId)
    revalidatePath(`/admin/debug/markers/${sessionId}`)
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin/debug/markers" className="text-sm font-medium text-indigo-600 hover:underline mb-2 inline-block">
              ← Kembali ke Daftar Markers
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              Marker Trace: {(session.profiles as any)?.full_name} ({(session.profiles as any)?.jenjang}) - {(session.missions as any)?.title}
            </h1>
          </div>
          <div className="flex gap-3">
            <form action={recalculateMarkers}>
              <button type="submit" className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded font-medium hover:bg-slate-50">
                Hitung Ulang Rule-Based
              </button>
            </form>
            <form action={regenerateAI}>
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded font-medium hover:bg-indigo-700">
                Regenerate AI Report
              </button>
            </form>
          </div>
        </div>

        {/* AI Report Section */}
        {aiReport && (
          <div className="bg-white rounded-xl shadow border border-indigo-200 overflow-hidden mb-8">
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-indigo-900">✨ AI Interpreter (Gemini)</h2>
              <span className="text-xs text-indigo-500 font-mono">Model: {aiReportRow?.model_version}</span>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Ringkasan Naratif</h3>
                <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{aiReport.ringkasan_naratif}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Rekomendasi untuk Mahasiswa</h3>
                  <p className="text-sm text-slate-700 bg-emerald-50 border border-emerald-100 p-4 rounded-lg">{aiReport.rekomendasi_mahasiswa}</p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Rekomendasi untuk Dosen</h3>
                  <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 p-4 rounded-lg">{aiReport.rekomendasi_dosen}</p>
                </div>
              </div>

              {aiReport.profil_per_indikator && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Penjelasan per Indikator</h3>
                  <div className="space-y-4">
                    {aiReport.profil_per_indikator.map((prof: any, i: number) => (
                      <div key={i} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-800">{prof.indikator}</span>
                          <span className="text-xs font-bold uppercase px-2 py-1 bg-slate-100 rounded text-slate-600">{prof.level}</span>
                        </div>
                        <p className="text-sm text-slate-700 mb-3">{prof.narasi}</p>
                        <div className="text-xs">
                          <span className="font-semibold text-slate-500">Evidence:</span>
                          <ul className="mt-1 space-y-1">
                            {prof.evidence.map((ev: string, j: number) => (
                              <li key={j} className="text-slate-600 pl-4 border-l-2 border-indigo-200">{ev}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-slate-800 mb-4">Rule-Based Behavioral Markers (Raw Output)</h2>

        {!indicators ? (
          <div className="bg-amber-50 border border-amber-200 rounded p-6 text-center text-amber-700">
            Sesi ini belum memiliki marker. Silakan tekan Hitung Ulang.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(indicators).map(([key, data]: [string, any]) => (
              <div key={key} className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden flex flex-col h-full">
                {/* Header Marker */}
                <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 capitalize">{key.replace('_', ' ')}</h3>
                  <div className="flex gap-3 items-center">
                    <span className="text-xs font-mono text-slate-500">
                      Score: {data.raw_score} / {data.max_score}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                      ${data.level === 'mahir' ? 'bg-emerald-100 text-emerald-700' :
                        data.level === 'cakap' ? 'bg-blue-100 text-blue-700' :
                        data.level === 'berkembang' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                      {data.level}
                    </span>
                  </div>
                </div>

                {/* Body Evidence */}
                <div className="p-6 flex-1 bg-slate-50">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Evidence Mentah:</h4>
                  {data.evidence && data.evidence.length > 0 ? (
                    <ul className="space-y-3">
                      {data.evidence.map((ev: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-700">
                          <span className="text-indigo-500 font-bold">✓</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-400 italic flex items-center gap-2">
                      <span>✕</span> Tidak ada *evidence* yang memadai.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
