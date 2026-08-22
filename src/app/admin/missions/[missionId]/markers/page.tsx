import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ missionId: string }>
}

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function MarkerRulesConfigPage({ params }: Props) {
  const { missionId } = await params
  const supabase = await createClient()
  const admin = getAdmin()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: mission } = await admin.from('missions').select('title').eq('id', missionId).single()
  if (!mission) notFound()

  // Get current rules
  const { data: rulesRow } = await admin.from('marker_rules').select('rules').eq('mission_id', missionId).single()

  // Default rules structure
  const defaultRules = {
    interpretasi: { step1_keywords: ['rata-rata', 'sebaran', 'tertinggi', 'terendah'] },
    analisis: { min_unique_formulas: 2, step2_keywords: ['mean', 'median', 'rata-rata', 'beda'] },
    evaluasi: { spread_formulas: ['STDEV', 'VAR', 'MAX', 'MIN'], step3_keywords: ['outlier', 'ekstrem', 'kelemahan', 'kurang'] },
    inferensi: { min_evidence_links: 2 },
    eksplanasi: { step5_keywords: ['karena', 'berdasarkan grafik', 'tabel menunjukkan'] },
    regulasi_diri: { step6_keywords: ['mungkin', 'belum tentu', 'kurang data', 'batas'] }
  }

  const currentRules = rulesRow?.rules || defaultRules

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin/missions" className="text-sm font-medium text-indigo-600 hover:underline mb-4 inline-block">
          &larr; Kembali ke Daftar Misi
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Inspeksi Markers AI (Read-Only)</h1>
        <p className="text-slate-600 mb-6">Misi: {mission.title}</p>
        <p className="text-amber-600 text-sm mb-6 bg-amber-50 border border-amber-200 p-3 rounded-lg">
          ⚠️ Admin hanya dapat melihat konfigurasi markers. Konfigurasi ini dikelola secara internal oleh sistem.
        </p>

        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden p-6">
          <p className="text-sm text-slate-500 mb-4">
            Aturan ekstraksi _behavioral markers_ (tahap 4). Konfigurasi ini dibaca saat sistem mengagregasi *trace* setiap sesi untuk menentukan *raw score* tiap indikator.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(currentRules).map(([indicator, rules]) => (
              <div key={indicator} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
                <h3 className="font-bold text-lg text-slate-800 capitalize mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  {indicator.replace('_', ' ')}
                </h3>
                <div className="space-y-4">
                  {Object.entries(rules as any).map(([ruleKey, ruleValue]) => (
                    <div key={ruleKey}>
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {ruleKey.replace(/_/g, ' ')}
                      </span>
                      {Array.isArray(ruleValue) ? (
                        <div className="flex flex-wrap gap-2">
                          {ruleValue.map((v, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-md text-sm shadow-sm">
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-block px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 shadow-sm">
                          {String(ruleValue)}
                        </span>
                      )}
                    </div>
                  ))}
                  {Object.keys(rules as any).length === 0 && (
                    <p className="text-sm text-slate-400 italic">Tidak ada aturan spesifik.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
