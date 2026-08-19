import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function DebugTraceDetail({ params }: Props) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile.role !== 'admin' && profile.role !== 'teacher')) {
    redirect('/')
  }

  // Fetch session details
  const { data: session } = await supabase
    .from('sessions')
    .select('id, status, profiles:student_id(full_name), missions:mission_id(title)')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()

  // Fetch activity logs
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/admin/debug/trace" className="text-sm font-medium text-indigo-600 hover:underline mb-2 inline-block">
              ← Kembali ke Daftar Sesi
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">
              Trace: {session.profiles?.full_name} - {session.missions?.title}
            </h1>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${session.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            Status: {session.status}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Event Stream ({logs?.length ?? 0} events)</h2>
            <button className="text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-300 rounded px-2 py-1 bg-white">
              Ekspor JSON
            </button>
          </div>
          
          <ul className="divide-y divide-slate-100 overflow-y-auto max-h-[700px]">
            {logs?.map((log, i) => (
              <li key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 text-sm">
                <div className="flex-shrink-0 w-12 text-center text-slate-400 font-mono text-xs pt-1">
                  #{i + 1}
                </div>
                <div className="flex-shrink-0 w-32 font-mono text-xs text-slate-500 pt-1">
                  {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 })}
                </div>
                <div className="flex-shrink-0 w-48">
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                    {log.event_type}
                  </span>
                </div>
                <div className="flex-1 overflow-x-auto">
                  <pre className="text-xs bg-slate-800 text-green-400 p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </div>
              </li>
            ))}
            {(!logs || logs.length === 0) && (
              <li className="p-8 text-center text-slate-500">
                Tidak ada event terekam dalam sesi ini.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
