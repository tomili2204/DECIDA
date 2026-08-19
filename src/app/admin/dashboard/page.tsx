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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">DECIDA</span>
              <span className="text-indigo-300 text-xs ml-2">Panel Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white text-sm font-medium">{profile.full_name}</p>
              <p className="text-indigo-300 text-xs">Admin</p>
            </div>
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{profile.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="ml-1 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-400/50 rounded-lg transition-all hover:bg-white/5"
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
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-indigo-200">Kelola sistem, pengguna, dan data DECIDA secara keseluruhan.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition-colors flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">Manajemen Pengguna</h3>
            <p className="text-slate-400 mb-6 text-sm flex-1">Lihat, edit, dan kelola akun dosen, mahasiswa, dan admin.</p>
            <Link href="/admin/users" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors text-sm w-max">
              Kelola Pengguna
            </Link>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-indigo-500/50 transition-colors flex flex-col">
            <h3 className="text-xl font-bold text-white mb-2">Manajemen Misi</h3>
            <p className="text-slate-400 mb-6 text-sm flex-1">Kelola skenario, dataset, dan rubrik misi.</p>
            <Link href="/admin/missions" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors text-sm w-max">
              Kelola Misi
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
