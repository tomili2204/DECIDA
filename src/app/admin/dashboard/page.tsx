import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function AdminDashboard() {
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <span className="text-slate-900 font-bold text-lg">DECIDA</span>
              <span className="text-indigo-600 text-xs ml-2 font-medium">Panel Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-slate-900 text-sm font-medium">{profile.full_name}</p>
              <p className="text-slate-500 text-xs">Admin</p>
            </div>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-200">
              <span className="text-indigo-700 text-sm font-bold">{profile.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="ml-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-all hover:bg-rose-50"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-500">Kelola sistem, pengguna, dan data DECIDA secara keseluruhan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Manajemen Pengguna</h3>
            <p className="text-slate-600 mb-6 text-sm flex-1">Lihat, edit, dan kelola akun dosen, mahasiswa, dan admin.</p>
            <Link href="/admin/users" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm w-max">
              Kelola Pengguna
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Manajemen Misi</h3>
            <p className="text-slate-600 mb-6 text-sm flex-1">Kelola skenario misi, dataset, serta konfigurasi parameter AI (Rubrik & Markers) untuk kalibrasi penilaian kognitif.</p>
            <Link href="/admin/missions" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm w-max">
              Kelola Misi
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ekspor Data (CSV)</h3>
            <p className="text-slate-600 mb-6 text-sm flex-1">Tarik dataset interaksi mentah, nilai kognitif, dan log AI untuk diolah di SPSS atau aplikasi statistik lainnya.</p>
            <Link href="/admin/export" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm w-max">
              Ekspor Data
            </Link>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition-shadow flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Audit & Trace</h3>
            <p className="text-slate-600 mb-3 text-sm">
              Alat diagnostik tingkat lanjut untuk memantau aktivitas mahasiswa.
            </p>
            <ul className="text-slate-500 text-xs list-disc list-inside mb-6 space-y-1.5 flex-1">
              <li><strong className="text-slate-700">Trace:</strong> Rekaman mentah setiap klik, navigasi, dan interaksi (event) dari detik ke detik.</li>
              <li><strong className="text-slate-700">Markers:</strong> Hasil ekstraksi perilaku kognitif (rule-based) dari rekaman trace tersebut.</li>
            </ul>
            <div className="flex gap-2 mt-auto">
              <Link href="/admin/debug/trace" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200 text-sm w-max">
                Cek Trace
              </Link>
              <Link href="/admin/debug/markers" className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200 text-sm w-max">
                Cek Markers
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
