import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { startMission } from './actions'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export default async function WorkspacePage() {
  const supabase = await createClient()
  const admin = getAdmin()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client for data queries to avoid RLS complexity
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/login')

  // Get student's class memberships
  const { data: memberships } = await admin
    .from('class_members')
    .select('class_id, classes(id, name, code, jenjang)')
    .eq('student_id', user.id)

  const classes = memberships?.map((m: any) => m.classes).filter(Boolean) ?? []
  const classIds = classes.map((c: any) => c.id)

  // Get missions matching class_ids
  const { data: missions } = classIds.length > 0
    ? await admin
        .from('missions')
        .select('id, title, difficulty, scenario')
        .in('class_id', classIds)
        .order('created_at')
    : { data: [] }

  // Get existing sessions
  const { data: sessions } = await admin
    .from('sessions')
    .select('id, mission_id, status')
    .eq('student_id', user.id)

  const sessionMap: Record<string, { id: string; status: string }> = {}
  sessions?.forEach((s) => { sessionMap[s.mission_id] = { id: s.id, status: s.status } })

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
              <span className="text-indigo-600 text-xs ml-2 font-medium">Putuskan dengan Data</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-slate-900 text-sm font-medium">{profile.full_name}</p>
              <p className="text-slate-600 text-xs">{classes.map((c: any) => c.name).join(', ')}</p>
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
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Selamat datang, {profile.full_name.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-600 text-lg">Pilih misi yang ingin kamu kerjakan hari ini.</p>
        </div>

        {missions && missions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {missions.map((mission: any) => {
              const session = sessionMap[mission.id]
              const isCompleted = session?.status === 'completed'
              const isOngoing = session?.status === 'active'

              return (
                <div
                  key={mission.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col hover:border-indigo-300 hover:shadow-md transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-wide">
                      Tingkat {mission.difficulty || 'Sedang'}
                    </span>
                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Selesai
                      </span>
                    )}
                    {isOngoing && (
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse inline-block" />
                        Berlangsung
                      </span>
                    )}
                  </div>

                  <h2 className="text-slate-900 font-bold text-lg mb-2">{mission.title}</h2>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-5 line-clamp-3">
                    {mission.scenario}
                  </p>

                  <form action={startMission.bind(null, mission.id)}>
                    <button
                      type="submit"
                      className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : isOngoing
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                      disabled={isCompleted}
                    >
                      {isCompleted ? 'Sudah Selesai' : isOngoing ? '▶ Lanjutkan Misi' : '🚀 Mulai Misi'}
                    </button>
                  </form>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-slate-800 text-xl font-bold mb-2">Belum ada misi tersedia</p>
            <p className="text-slate-500">Tanyakan kepada dosen pengampu untuk mengaktifkan misi di mata kuliahmu.</p>
          </div>
        )}
      </main>
    </div>
  )
}
