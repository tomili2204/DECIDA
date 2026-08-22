import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CreateClassButton from './CreateClassButton'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const admin = getAdmin()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') redirect('/login')

  // Fetch teacher's classes
  const { data: classes } = await admin
    .from('classes')
    .select('id, name, code, jenjang')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

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
              <span className="text-indigo-600 text-xs ml-2 font-medium">Panel Dosen</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-slate-900 text-sm font-medium">{profile.full_name}</p>
              <p className="text-slate-500 text-xs">Dosen</p>
            </div>
            <div className="w-8 h-8 bg-indigo-100 border border-indigo-200 rounded-full flex items-center justify-center">
              <span className="text-indigo-700 text-sm font-bold">{profile.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <form action="/api/logout" method="POST">
              <button
                type="submit"
                className="ml-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg transition-all hover:bg-rose-50"
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Selamat Datang, {profile.full_name}!</h1>
          <p className="text-slate-600">Kelola mata kuliah, mahasiswa, dan pantau perkembangan belajar mereka.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <Link href="/teacher/missions" className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white hover:shadow-lg hover:shadow-indigo-500/30 transition-all group relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 text-2xl group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h3 className="text-xl font-bold mb-1">Manajemen Misi & AI</h3>
              <p className="text-indigo-100 text-sm">Buat dan kelola studi kasus menggunakan asisten AI untuk kelas Anda.</p>
            </div>
            <svg className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2z"/></svg>
          </Link>
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-start">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 text-xl">
              📚
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">Mata Kuliah</h3>
            <p className="text-slate-500 text-sm mb-4">Total: {classes ? classes.length : 0} Kelas Aktif</p>
            <CreateClassButton variant="header" />
          </div>
        </div>

        {/* Classes Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Daftar Mata Kuliah</h2>
        </div>
        
        {classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => (
              <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{c.name}</h3>
                </div>
                <div className="mb-6">
                  <p className="text-sm text-slate-500 mb-1">Kode Kelas</p>
                  <p className="font-mono text-lg font-bold text-indigo-600">{c.code}</p>
                </div>
                <Link href={`/teacher/class/${c.id}`} className="w-full py-2 bg-slate-50 hover:bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg transition-colors border border-slate-200 hover:border-indigo-200 flex justify-center text-center">
                  Lihat Detail Kelas
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Mata Kuliah</h3>
            <p className="text-slate-500 mb-6">Anda belum mengelola mata kuliah apapun.</p>
            <CreateClassButton variant="empty" />
          </div>
        )}
      </main>
    </div>
  )
}
