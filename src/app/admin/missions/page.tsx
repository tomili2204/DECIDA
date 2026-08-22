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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600">Judul Misi</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600">Mata Kuliah</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600">Dosen</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600">Tingkat Kesulitan</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600">Dibuat Pada</th>
                  <th className="py-4 px-6 font-semibold text-sm text-slate-600">Aksi (Read-Only)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {missions?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 text-slate-800 font-medium">{m.title}</td>
                    <td className="py-4 px-6 text-slate-600">{(m.classes as any)?.name || '-'}</td>
                    <td className="py-4 px-6 text-slate-600">{(m.profiles as any)?.full_name || '-'}</td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {m.difficulty || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-sm">
                      {new Date(m.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Link href={`/admin/missions/${m.id}/rubrics`} className="text-xs px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200">
                          Rubrik
                        </Link>
                        <Link href={`/admin/missions/${m.id}/markers`} className="text-xs px-3 py-1.5 bg-white text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200">
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
