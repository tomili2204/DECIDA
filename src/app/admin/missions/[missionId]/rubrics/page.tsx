import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'

interface Props {
  params: Promise<{ missionId: string }>
}

export default async function RubricsConfigPage({ params }: Props) {
  const { missionId } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const { data: mission } = await supabase.from('missions').select('title').eq('id', missionId).single()
  if (!mission) notFound()

  // Get current rubrics for SMP and SMA
  const { data: rubrics } = await supabase.from('rubrics').select('*').eq('mission_id', missionId)
  
  const defaultRubricIndicators = {
    interpretasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    analisis: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    evaluasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] },
    inferensi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'mahir' }] },
    eksplanasi: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'mahir' }] },
    regulasi_diri: { thresholds: [{ max: 0, level: 'perlu_bimbingan' }, { max: 1, level: 'berkembang' }, { max: 2, level: 'mahir' }] }
  }

  const smpRubric = rubrics?.find(r => r.jenjang === 'SMP')?.indicators || defaultRubricIndicators
  const smaRubric = rubrics?.find(r => r.jenjang === 'SMA')?.indicators || defaultRubricIndicators

  async function updateRubrics(formData: FormData) {
    'use server'
    const smpRaw = formData.get('smp') as string
    const smaRaw = formData.get('sma') as string
    try {
      const smpParsed = JSON.parse(smpRaw)
      const smaParsed = JSON.parse(smaRaw)
      
      const sb = await createClient()
      
      // Upsert SMP
      const { data: existingSmp } = await sb.from('rubrics').select('id').eq('mission_id', missionId).eq('jenjang', 'SMP').single()
      if (existingSmp) {
        await sb.from('rubrics').update({ indicators: smpParsed }).eq('id', existingSmp.id)
      } else {
        await sb.from('rubrics').insert({ mission_id: missionId, jenjang: 'SMP', indicators: smpParsed })
      }

      // Upsert SMA
      const { data: existingSma } = await sb.from('rubrics').select('id').eq('mission_id', missionId).eq('jenjang', 'SMA').single()
      if (existingSma) {
        await sb.from('rubrics').update({ indicators: smaParsed }).eq('id', existingSma.id)
      } else {
        await sb.from('rubrics').insert({ mission_id: missionId, jenjang: 'SMA', indicators: smaParsed })
      }
      
      revalidatePath(`/admin/missions/${missionId}/rubrics`)
    } catch (e) {
      console.error('Invalid JSON format', e)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/admin/missions" className="text-sm font-medium text-indigo-600 hover:underline mb-4 inline-block">
          &larr; Kembali ke Daftar Misi
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Konfigurasi Dual-Rubric (Semester 3-4 & Semester 5-6)</h1>
        <p className="text-slate-600 mb-6">Misi: {mission.title}</p>

        <form action={updateRubrics} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SMP Rubric */}
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Rubrik Semester 3-4</h2>
              <p className="text-xs text-slate-500 mb-4">Ekspektasi konversi raw_score ke kategori (perlu_bimbingan, berkembang, cakap, mahir) untuk mahasiswa Semester 3-4.</p>
              <textarea
                name="smp"
                rows={25}
                className="w-full text-xs font-mono p-4 border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue={JSON.stringify(smpRubric, null, 2)}
              />
            </div>

            {/* SMA Rubric */}
            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-2">Rubrik Semester 5-6</h2>
              <p className="text-xs text-slate-500 mb-4">Ekspektasi konversi raw_score ke kategori untuk mahasiswa Semester 5-6 (biasanya threshold lebih tinggi).</p>
              <textarea
                name="sma"
                rows={25}
                className="w-full text-xs font-mono p-4 border border-slate-300 rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue={JSON.stringify(smaRubric, null, 2)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-sm">
              Simpan Rubrik
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
