import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RadarChartClient from './RadarChartClient'

const FACIONE_INDICATORS = ['Interpretasi', 'Analisis', 'Evaluasi', 'Inferensi', 'Eksplanasi', 'Regulasi Diri']

function levelToScore(level: string) {
  switch (level?.toLowerCase()) {
    case 'perlu_bimbingan': return 1
    case 'berkembang': return 2
    case 'cakap': return 3
    case 'mahir': return 4
    default: return 0
  }
}

export default async function TeacherDashboardPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const supabase = await createClient()

  // Ambil Session
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, status, created_at, profiles:student_id(full_name, jenjang), missions:mission_id(title)')
    .eq('id', sessionId)
    .single()

  if (error || !session) notFound()

  // Ambil AI Report
  const { data: aiReportRow } = await supabase
    .from('ai_reports')
    .select('report_data, created_at')
    .eq('session_id', sessionId)
    .single()

  const aiReport = aiReportRow?.report_data as any || null

  // Format data untuk Radar Chart (berdasarkan AI Report)
  const radarData = FACIONE_INDICATORS.map(indicator => {
    const prof = aiReport?.profil_per_indikator?.find((p: any) => p.indikator.toLowerCase() === indicator.toLowerCase())
    return {
      indicator,
      score: prof ? levelToScore(prof.level) : 0,
      level: prof ? prof.level.replace('_', ' ') : 'Belum dinilai'
    }
  })

  // Ambil Activity Logs (untuk Timeline)
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('event_type, created_at, payload')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  // Ambil Jawaban Mentah
  const { data: answers } = await supabase
    .from('step_answers')
    .select('step_number, answer_text, evidence_links')
    .eq('session_id', sessionId)
    .order('step_number')

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin/debug/markers" className="text-sm font-medium text-indigo-600 hover:underline mb-2 inline-block">
              ← Kembali ke Daftar Sesi
            </Link>
            <h1 className="text-3xl font-bold text-slate-900">Dasbor Analitik: {session.profiles?.full_name}</h1>
            <p className="text-slate-500 mt-1">Misi: {session.missions?.title} • Jenjang: {session.profiles?.jenjang} • {new Date(session.created_at).toLocaleString('id-ID')}</p>
          </div>
          <Link href="/admin/export" className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 shadow-sm">
            Unduh Dataset
          </Link>
        </div>

        {!aiReport ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
            <h2 className="text-amber-800 font-bold mb-2">Laporan Belum Tersedia</h2>
            <p className="text-amber-700">Mahasiswa belum menyelesaikan misi ini atau laporan AI sedang diproses.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Kiri: Radar Chart & Narasi */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Profil Kognitif Facione</h2>
                <RadarChartClient data={radarData} />
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Ringkasan Naratif</h2>
                <p className="text-slate-700 text-sm leading-relaxed">{aiReport.ringkasan_naratif}</p>
              </div>

              <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider mb-3">Rekomendasi Intervensi Dosen</h2>
                <p className="text-amber-900 text-sm leading-relaxed">{aiReport.rekomendasi_guru}</p>
              </div>
            </div>

            {/* Kanan: Timeline & Raw Data */}
            <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-800">Timeline Aktivitas</h2>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-mono">{logs?.length || 0} events</span>
                </div>
                <div className="p-6 max-h-[300px] overflow-y-auto">
                  <div className="space-y-4">
                    {logs?.map((log, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-24 flex-shrink-0 text-xs text-slate-400 font-mono mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="w-3 h-3 rounded-full bg-indigo-200 mt-1 flex-shrink-0"></div>
                        <div>
                          <div className="text-sm font-semibold text-slate-700">{log.event_type}</div>
                          {log.payload && Object.keys(log.payload).length > 0 && (
                            <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-50 p-2 rounded border border-slate-100 overflow-x-auto max-w-full">
                              {JSON.stringify(log.payload)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-800">Detail Evaluasi per Langkah</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {FACIONE_INDICATORS.map((indicator, idx) => {
                    const stepNumber = idx + 1
                    const answer = answers?.find(a => a.step_number === stepNumber)
                    const aiProf = aiReport?.profil_per_indikator?.find((p: any) => p.indikator.toLowerCase() === indicator.toLowerCase())
                    
                    return (
                      <div key={idx} className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold text-slate-800">Langkah {stepNumber}: {indicator}</h3>
                          <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                            aiProf?.level === 'mahir' ? 'bg-emerald-100 text-emerald-700' :
                            aiProf?.level === 'cakap' ? 'bg-blue-100 text-blue-700' :
                            aiProf?.level === 'berkembang' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {aiProf?.level?.replace('_', ' ') || 'Belum dinilai'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Jawaban Mahasiswa</div>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                              {answer?.answer_text || <span className="italic text-slate-400">Tidak ada jawaban</span>}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Analisis AI (Evidence-based)</div>
                            <p className="text-sm text-slate-700 mb-2">{aiProf?.narasi}</p>
                            {aiProf?.evidence && aiProf.evidence.length > 0 && (
                              <ul className="text-xs space-y-1 mt-2">
                                {aiProf.evidence.map((ev: string, eIdx: number) => (
                                  <li key={eIdx} className="text-slate-600 pl-3 border-l-2 border-indigo-300">"{ev}"</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
