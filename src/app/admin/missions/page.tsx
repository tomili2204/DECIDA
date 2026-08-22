import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MissionsTable from './MissionsTable'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function AdminMissionsPage() {
  const supabase = await createClient()
  const admin = getAdmin()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  const { data: missions } = await admin
    .from('missions')
    .select('id, title, difficulty, created_at, profiles:teacher_id(full_name), classes:class_id(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Manajemen Misi</h1>
              <p className="text-sm text-slate-500">Daftar misi dan skenario yang tersedia di seluruh kelas</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-12">
        <MissionsTable initialMissions={missions || []} />

        <div className="mt-8 bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span> Penjelasan Parameter AI
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-indigo-100/50 shadow-sm">
              <h4 className="font-bold text-indigo-700 mb-2 border-b border-slate-100 pb-2">Apa itu Rubrik?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>Rubrik</strong> adalah batasan skor dan instruksi linguistik (<i>Prompt Engineering</i>) yang diberikan kepada AI Gemini. Rubrik inilah yang digunakan oleh AI untuk menerjemahkan nilai angka mentah menjadi predikat (seperti: <em>Perlu Bimbingan, Berkembang, Cakap, Mahir</em>).
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-indigo-100/50 shadow-sm">
              <h4 className="font-bold text-teal-700 mb-2 border-b border-slate-100 pb-2">Apa itu Markers?</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                <strong>Markers</strong> (Penanda Perilaku) adalah kumpulan logika aturan (<i>rule-based logic</i>) yang digunakan untuk mengekstrak dan menangkap jejak interaksi mahasiswa (seperti: penggunaan rumus rata-rata, pengurutan, dsb) dari Spreadsheet secara otomatis sebelum dikirim ke AI.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
