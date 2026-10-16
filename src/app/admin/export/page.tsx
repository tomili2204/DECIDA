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
          <Link href="/admin/dashboard" className="text-sm font-medium text-indigo-600 hover:underline mb-4 inline-block">&larr; Kembali ke Dashboard Admin</Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Ekspor Data Penelitian</h1>
          <p className="text-slate-600 mb-8">Tarik data dari database Supabase dalam format CSV untuk dianalisis lebih lanjut menggunakan SPSS, R, atau Python.</p>
        </div>

        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 mb-2">
              FORMAT RESMI LAPORAN
            </span>
            <h2 className="text-xl font-bold">Rekap Laporan Asesmen Mahasiswa (.xlsx)</h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              File Excel rapi berisi Nama Peserta, Kelas, Jawaban Soal 1-6, Skor kognitif per nomor soal, Skor rata-rata, dan Grade peserta (Tinggi/Sedang/Rendah).
            </p>
          </div>
          <a
            href="/api/export/excel"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Excel (.xlsx)
          </a>
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
                  href={`/api/export?type=${type.id}&format=xlsx`}
                  download
                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 px-3.5 py-2 rounded-lg font-bold text-sm transition-colors text-center inline-flex items-center gap-1.5 shadow-sm"
                  title="Unduh format Excel (.xlsx)"
                >
                  📊 XLSX
                </a>
                <a 
                  href={`/api/export?type=${type.id}&format=csv`}
                  download
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors text-center inline-flex items-center gap-1"
                  title="Unduh format CSV"
                >
                  📥 CSV
                </a>
                <a 
                  href={`/api/export?type=${type.id}&format=json`}
                  download
                  className="bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg font-medium text-sm transition-colors text-center"
                  title="Unduh format JSON"
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

