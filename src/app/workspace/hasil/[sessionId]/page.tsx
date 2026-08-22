import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import AutoRefresh from '@/components/workspace/AutoRefresh'
import CognitiveRadarChart from '@/components/workspace/CognitiveRadarChart'

interface Props {
  params: Promise<{ sessionId: string }>
}

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const FACIONE_INDICATORS = ['Interpretasi', 'Analisis', 'Evaluasi', 'Inferensi', 'Eksplanasi', 'Regulasi Diri']
const STEP_ICONS = ['🔍', '🔬', '⚖️', '🎯', '📝', '🔄']

const LEVEL_COLORS: Record<string, string> = {
  perlu_bimbingan: 'bg-rose-50 text-rose-700 border-rose-200',
  berkembang: 'bg-amber-50 text-amber-700 border-amber-200',
  cakap: 'bg-blue-50 text-blue-700 border-blue-200',
  mahir: 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

const LEVEL_LABELS: Record<string, string> = {
  perlu_bimbingan: 'Perlu Bimbingan',
  berkembang: 'Berkembang',
  cakap: 'Cakap',
  mahir: 'Mahir'
}

export default async function HasilPage({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()
  const admin = getAdmin()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session, error } = await admin
    .from('sessions')
    .select('id, status, student_id, missions(title, jenjang)')
    .eq('id', sessionId)
    .single()

  if (error || !session || session.student_id !== user.id) notFound()

  const { data: answers } = await admin
    .from('step_answers')
    .select('step_number, answer_text, evidence_links')
    .eq('session_id', sessionId)
    .order('step_number')

  // Cek AI Report
  const { data: aiReportRow } = await admin
    .from('ai_reports')
    .select('report_data')
    .eq('session_id', sessionId)
    .single()

  let aiReport = aiReportRow?.report_data as any || null

  // Fallback: Jika report belum ada padahal sesi sudah selesai (misal karena proses background terputus)
  if (!aiReport && session.status === 'completed') {
    console.log("TRIGGERING FALLBACK FOR AI REPORT:", sessionId)
    
    // Pastikan markers sudah di-generate
    const { data: markers } = await admin.from('markers').select('session_id').eq('session_id', sessionId).single()
    if (!markers) {
       console.log("MARKERS MISSING, GENERATING MARKERS FIRST...")
       const { createAdminClient } = await import('@/lib/supabase/admin')
       const supabaseAdmin = createAdminClient()
       const { aggregateMarkers } = await import('@/lib/markers/aggregate')
       await aggregateMarkers(sessionId, supabaseAdmin)
    }

    const { generateAIReport } = await import('@/lib/ai/interpreter')
    const result = await generateAIReport(sessionId)
    console.log("FALLBACK RESULT:", result)
    if (result && result.data) {
      aiReport = result.data
    }
  }
  const mission = session.missions as any
  const filledSteps = (answers ?? []).filter((a) => (a.answer_text ?? '').trim().length > 0).length

  let radarData: any[] = []
  if (aiReport && aiReport.profil_per_indikator) {
    radarData = FACIONE_INDICATORS.map(indicator => {
      const prof = aiReport.profil_per_indikator.find((p: any) => p.indikator.toLowerCase() === indicator.toLowerCase())
      const level = prof?.level || 'perlu_bimbingan'
      const numericLevel = level === 'mahir' ? 4 : level === 'cakap' ? 3 : level === 'berkembang' ? 2 : 1
      return {
        subject: indicator,
        A: numericLevel,
        fullMark: 4
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-slate-900 font-bold">DECIDA</span>
          </div>
          <Link href="/workspace" className="text-indigo-600 hover:text-indigo-800 text-sm transition-colors font-medium">
            ← Kembali ke Misi
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Success banner */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Profil Analitik Mahasiswa</h1>
          <p className="text-slate-600 text-lg">Misi: <span className="text-slate-900 font-semibold">{mission?.title}</span></p>
          <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
            <span className="text-emerald-700 font-bold text-lg">{filledSteps}/6</span>
            <span className="text-emerald-600 text-sm">langkah terisi</span>
          </div>
        </div>

        {/* AI Report Profile Card */}
        {aiReport ? (
          <div className="mb-12">
            <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-4 text-center">Profil Kognitifmu</h2>
            
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-indigo-50/50">
                <p className="text-slate-700 text-lg leading-relaxed text-center italic">
                  "{aiReport.ringkasan_naratif}"
                </p>
              </div>
              
              <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50">
                {FACIONE_INDICATORS.map((indicator, i) => {
                  const prof = aiReport.profil_per_indikator?.find((p: any) => p.indikator.toLowerCase() === indicator.toLowerCase())
                  const level = prof?.level || 'perlu_bimbingan'
                  const colorClass = LEVEL_COLORS[level] || LEVEL_COLORS['perlu_bimbingan']
                  const label = LEVEL_LABELS[level] || level

                  return (
                    <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col items-center text-center shadow-sm">
                      <span className="text-2xl mb-2">{STEP_ICONS[i]}</span>
                      <span className="text-slate-600 text-xs font-semibold uppercase tracking-wider mb-2">{indicator}</span>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colorClass}`}>
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Radar Chart Section */}
              <div className="p-6 bg-white border-t border-slate-100">
                <h3 className="text-center font-semibold text-indigo-600 text-sm tracking-widest mb-2 uppercase">Peta Sebaran Kognitif</h3>
                <CognitiveRadarChart data={radarData} />
              </div>

              <div className="p-6 bg-indigo-50 border-t border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-indigo-600 text-xl">💡</span>
                  </div>
                  <div>
                    <h3 className="text-indigo-800 font-bold mb-1">Rekomendasi Dosen</h3>
                    <p className="text-indigo-900/80 text-sm leading-relaxed">{aiReport.rekomendasi_mahasiswa}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Analisis Kognitif Detail */}
            <div className="mt-12">
              <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 text-center mb-6">Analisis Kognitif Detail</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FACIONE_INDICATORS.map((indicator, i) => {
                  const prof = aiReport.profil_per_indikator?.find((p: any) => p.indikator.toLowerCase() === indicator.toLowerCase())
                  const level = prof?.level || 'perlu_bimbingan'
                  const colorClass = LEVEL_COLORS[level] || LEVEL_COLORS['perlu_bimbingan']
                  const label = LEVEL_LABELS[level] || level

                  return (
                    <div key={i} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden hover:border-indigo-300 transition-colors flex flex-col">
                      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{STEP_ICONS[i]}</span>
                          <h3 className="text-lg font-bold text-slate-800">{indicator}</h3>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colorClass}`}>
                          {label}
                        </span>
                      </div>
                      <div className="p-5 flex-1 flex flex-col">
                        <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
                          {prof?.narasi || "Tidak ada data narasi untuk indikator ini."}
                        </p>
                        {prof?.evidence && prof.evidence.length > 0 && (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mt-auto">
                            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <span>🔍</span> Bukti Temuan (Evidence)
                            </h4>
                            <ul className="list-disc list-inside text-sm text-indigo-900/70 space-y-1">
                              {prof.evidence.map((ev: string, idx: number) => (
                                <li key={idx} className="italic">{ev}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-8 text-center mb-12">
            <AutoRefresh intervalMs={15000} />
            <div className="inline-block w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-indigo-200 font-bold mb-2">AI sedang menganalisis jawabanmu...</h3>
            <p className="text-indigo-300/70 text-sm">Harap tunggu sebentar, halaman ini akan otomatis memuat ulang.</p>
          </div>
        )}

        {/* Step review */}
        <div className="space-y-4 mb-8 opacity-80 hover:opacity-100 transition-opacity">
          <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400">Ringkasan Jawaban Mentah</h2>
          {Array.from({ length: 6 }, (_, i) => {
            const answer = answers?.find((a) => a.step_number === i + 1)
            const hasAnswer = (answer?.answer_text ?? '').trim().length > 0
            const evidenceCount = Array.isArray(answer?.evidence_links) ? answer!.evidence_links.length : 0

            return (
              <div key={i} className={`bg-white/5 backdrop-blur rounded-xl border p-4 ${hasAnswer ? 'border-white/10' : 'border-red-500/10'}`}>
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 opacity-70">{STEP_ICONS[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-300">Langkah {i + 1}</span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-400">{FACIONE_INDICATORS[i]}</span>
                      {evidenceCount > 0 && (
                        <span className="text-xs bg-amber-500/10 text-amber-300/70 px-1.5 py-0.5 rounded-full ml-auto">
                          🔗 {evidenceCount} bukti
                        </span>
                      )}
                    </div>
                    {hasAnswer ? (
                      <p className="text-slate-300 text-sm leading-relaxed">{answer!.answer_text}</p>
                    ) : (
                      <p className="text-slate-500 text-sm italic">Langkah ini tidak diisi.</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
