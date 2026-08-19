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
    .select('id, title, jenjang, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/dashboard" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Manajemen Misi</h1>
              <p className="text-sm text-indigo-300">Daftar misi dan skenario yang tersedia</p>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="py-4 px-6 font-semibold text-sm text-slate-300">Judul Misi</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-300">Jenjang</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-300">Dibuat Pada</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-300">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {missions?.map((m: any) => (
                  <tr key={m.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-6 text-white font-medium">{m.title}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {m.jenjang}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-400 text-sm">
                      {new Date(m.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Link href={`/admin/missions/${m.id}/rubrics`} className="text-xs px-3 py-1.5 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 rounded-lg transition-colors border border-indigo-500/30">
                          Rubrik
                        </Link>
                        <Link href={`/admin/missions/${m.id}/markers`} className="text-xs px-3 py-1.5 bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 rounded-lg transition-colors border border-teal-500/30">
                          Markers
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
