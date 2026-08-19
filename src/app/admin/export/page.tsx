import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ExportPage() {
  const supabase = await createClient()

  // Simple auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const exportTypes = [
    {
      id: 'activity_logs',
      name: '1. Log Aktivitas (Digital Cognitive Trace)',
      description: 'Seluruh event klik, ketik, rumus, chart, beserta payload dan timestamp milidetik.'
    },
    {
      id: 'step_answers',
      name: '2. Jawaban Langkah (Text Answers)',
      description: 'Teks jawaban mentah Mahasiswa pada 6 langkah misi beserta tautan evidence.'
    },
    {
      id: 'markers',
      name: '3. Behavioral Markers (Rule-based)',
      description: 'Skor agregasi otomatis untuk 6 indikator Facione berdasarkan aturan sistem.'
    },
    {
      id: 'ai_reports',
      name: '4. AI Interpreter Reports (Explainable AI)',
      description: 'Hasil penilaian naratif dari Gemini AI, lengkap dengan profil, level, dan evidence.'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="mb-8">
          <Link href="/admin/debug/markers" className="text-sm font-medium text-indigo-600 hover:underline mb-2 inline-block">
            ← Kembali ke Daftar Sesi
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">Ekspor Dataset Penelitian</h1>
          <p className="text-slate-500 mt-2">Unduh data riset DECIDA dalam format CSV atau JSON untuk dianalisis lebih lanjut menggunakan SPSS, R, atau Python.</p>
        </div>

        <div className="grid gap-6">
          {exportTypes.map(type => (
            <div key={type.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{type.name}</h3>
                <p className="text-slate-500 text-sm mt-1">{type.description}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <a 
                  href={`/api/export?type=${type.id}&format=csv`}
                  download
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors text-center"
                >
                  📥 CSV
                </a>
                <a 
                  href={`/api/export?type=${type.id}&format=json`}
                  download
                  className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors text-center"
                >
                  {'{ }'} JSON
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl mt-8">
          <h4 className="text-amber-800 font-bold mb-2 flex items-center gap-2">
            <span>⚠️</span> Catatan Penggunaan Data
          </h4>
          <p className="text-amber-900 text-sm leading-relaxed">
            Data yang diunduh mencakup seluruh rekaman sesi dari semua Mahasiswa di dalam sistem. Pastikan Anda menyimpan dataset ini di tempat yang aman sesuai dengan protokol etika penelitian, terutama karena mencakup nama dan hasil asesmen kognitif Mahasiswa. Untuk analisis kuantitatif SPSS, gunakan format <strong>CSV</strong>.
          </p>
        </div>

      </div>
    </div>
  )
}

