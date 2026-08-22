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

export default async function RubricsConfigPage({ params }: Props) {
  const { missionId } = await params
  const supabase = await createClient()
  const admin = getAdmin()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: mission } = await admin.from('missions').select('title, difficulty').eq('id', missionId).single()
  if (!mission) notFound()

  // Get current rubrics
  const { data: rubrics } = await admin.from('rubrics').select('*').eq('mission_id', missionId)
  
  const defaultRubricIndicators = {
    interpretasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    analisis: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    evaluasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    inferensi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'mahir' }] },
    eksplanasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'mahir' }] },
    regulasi_diri: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] }
  }

  // We map the legacy 'SD', 'SMP', 'SMA' to Mudah, Sedang, Tinggi for display purposes
  const mudahRubric = rubrics?.find(r => r.jenjang === 'SD')?.indicators || defaultRubricIndicators
  const sedangRubric = rubrics?.find(r => r.jenjang === 'SMP')?.indicators || defaultRubricIndicators
  const tinggiRubric = rubrics?.find(r => r.jenjang === 'SMA')?.indicators || defaultRubricIndicators

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <main className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/admin/missions" className="text-sm font-medium text-indigo-600 hover:underline mb-4 inline-block">
          &larr; Kembali ke Daftar Misi
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Inspeksi Rubrik AI (Read-Only)</h1>
        <p className="text-slate-600 mb-2">Misi: {mission.title}</p>
        <p className="text-amber-600 text-sm mb-8 bg-amber-50 border border-amber-200 p-3 rounded-lg">
          ⚠️ Admin hanya dapat melihat konfigurasi rubrik. Penambahan atau pengubahan misi dan rubrik adalah hak prerogatif Dosen.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <RubricViewer 
            title="Rubrik Tingkat Mudah" 
            description="Konversi skor mentah ke level untuk Misi Tingkat Mudah." 
            rubricData={mudahRubric} 
          />
          <RubricViewer 
            title="Rubrik Tingkat Sedang" 
            description="Konversi skor mentah ke level untuk Misi Tingkat Sedang." 
            rubricData={sedangRubric} 
          />
          <RubricViewer 
            title="Rubrik Tingkat Tinggi" 
            description="Konversi skor mentah ke level untuk Misi Tingkat Tinggi." 
            rubricData={tinggiRubric} 
          />
        </div>
      </main>
    </div>
  )
}

function RubricViewer({ title, description, rubricData }: { title: string, description: string, rubricData: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-slate-50 px-6 py-5 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="space-y-8">
          {Object.entries(rubricData).map(([indicator, data]: [string, any]) => (
            <div key={indicator}>
              <h3 className="font-semibold text-sm text-indigo-700 capitalize mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                {indicator.replace('_', ' ')}
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                      <th className="py-2 px-4 font-medium border-b border-slate-200">Batas Skor Mentah</th>
                      <th className="py-2 px-4 font-medium border-b border-slate-200">Predikat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.thresholds?.map((t: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-4 text-sm text-slate-700 font-mono whitespace-nowrap">{'<='} {t.max}</td>
                        <td className="py-2 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide
                            ${t.level === 'mahir' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                              t.level === 'cakap' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                              t.level === 'berkembang' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                              'bg-red-100 text-red-700 border border-red-200'}`}>
                            {t.level.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!data.thresholds && (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-sm text-slate-400 italic">Belum ada aturan</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

