import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DebugTraceIndex() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if admin/researcher
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
    redirect('/')
  }

  // Fetch recent sessions that have logs
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, 
      status, 
      created_at, 
      profiles:student_id (full_name),
      missions:mission_id (title)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Debug: Digital Cognitive Trace</h1>
        <p className="text-slate-600 mb-8">Pilih sesi untuk melihat aliran event secara detail.</p>

        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Waktu Mulai</th>
                <th className="px-6 py-4">Mahasiswa</th>
                <th className="px-6 py-4">Misi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sessions?.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(s.created_at).toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{s.profiles?.full_name}</td>
                  <td className="px-6 py-4">{s.missions?.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/admin/debug/trace/${s.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline">
                      Lihat Trace
                    </Link>
                  </td>
                </tr>
              ))}
              {(!sessions || sessions.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada sesi yang terekam.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

