import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DebugMarkersIndex() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
    redirect('/')
  }

  // Fetch sessions that have markers computed
  const { data: sessions } = await supabase
    .from('markers')
    .select(`
      session_id,
      sessions:session_id (
        created_at,
        profiles:student_id (full_name, jenjang),
        missions:mission_id (title)
      )
    `)
    .order('session_id', { ascending: false }) // actually should order by sessions.created_at but PostgREST limit, this is fine for debug
    .limit(20)

  // Fetch sessions without markers (completed but no markers, maybe pipeline failed or not triggered)
  const { data: completedWithoutMarkers } = await supabase
    .from('sessions')
    .select(`
      id,
      created_at,
      profiles:student_id (full_name, jenjang),
      missions:mission_id (title)
    `)
    .eq('status', 'completed')
    .not('id', 'in', `(${sessions?.map(s => s.session_id).join(',') || '00000000-0000-0000-0000-000000000000'})`)
    .limit(10)

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Debug: Behavioral Markers</h1>
        <p className="text-slate-600 mb-8">Hasil pipeline agregasi _rule-based_ Facione.</p>

        <h2 className="text-xl font-bold text-slate-800 mb-4">Sesi dengan Markers Terhitung</h2>
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden mb-8">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Mahasiswa (Jenjang)</th>
                <th className="px-6 py-4">Misi</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sessions?.map((row: any) => {
                const s = row.sessions
                if (!s) return null
                return (
                  <tr key={row.session_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {s.profiles?.full_name} <span className="text-xs text-slate-400 font-normal">({s.profiles?.jenjang})</span>
                    </td>
                    <td className="px-6 py-4">{s.missions?.title}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/debug/markers/${row.session_id}`} className="text-indigo-600 hover:text-indigo-900 font-medium hover:underline">
                        Lihat Marker & Evidence
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {(!sessions || sessions.length === 0) && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    Belum ada sesi yang terekam dengan markers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {completedWithoutMarkers && completedWithoutMarkers.length > 0 && (
          <>
            <h2 className="text-xl font-bold text-slate-800 mb-4 text-red-600">Selesai Tanpa Markers (Butuh Recalculate)</h2>
            <div className="bg-white rounded-xl shadow border border-red-200 overflow-hidden mb-8">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-red-50 text-red-700 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Mahasiswa (Jenjang)</th>
                    <th className="px-6 py-4">Misi</th>
                    <th className="px-6 py-4">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {completedWithoutMarkers.map((s: any) => (
                    <tr key={s.id} className="hover:bg-red-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{s.profiles?.full_name} ({s.profiles?.jenjang})</td>
                      <td className="px-6 py-4">{s.missions?.title}</td>
                      <td className="px-6 py-4">
                        <Link href={`/admin/debug/markers/${s.id}`} className="text-red-600 hover:text-red-900 font-medium hover:underline">
                          Hitung Sekarang
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
