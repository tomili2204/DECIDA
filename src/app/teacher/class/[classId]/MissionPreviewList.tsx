'use client'

import { useState } from 'react'

type Mission = {
  id: string
  title: string
  scenario: string
  difficulty?: string
}

export default function MissionPreviewList({ missions }: { missions: Mission[] }) {
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="font-bold text-slate-800 text-lg mb-4">Misi (Studi Kasus) yang Tersedia</h2>
      {missions && missions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missions.map(mission => (
            <button 
              key={mission.id} 
              onClick={() => setSelectedMission(mission)}
              className="p-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 hover:border-indigo-200 transition-all text-left group flex flex-col focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="flex justify-between items-start w-full mb-1">
                <div className="flex flex-col items-start gap-1">
                  {mission.difficulty && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      Tingkat {mission.difficulty}
                    </span>
                  )}
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{mission.title}</h3>
                </div>
                <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2 w-full">{mission.scenario}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
          Belum ada misi yang ditugaskan untuk mata kuliah ini.
        </div>
      )}

      {/* Modal Detail */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedMission(null)}>
          <div 
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">{selectedMission.title}</h3>
              <button 
                onClick={() => setSelectedMission(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Skenario Lengkap</h4>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedMission.scenario}
              </p>
              <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h5 className="font-semibold text-indigo-900">Misi Otomatis</h5>
                    <p className="text-sm text-indigo-700 mt-1">
                      Mahasiswa di kelas ini akan secara otomatis menerima misi ini beserta dataset interaktif yang telah diatur oleh Admin. 
                      Jawaban mereka akan dianalisis secara kualitatif oleh AI saat mereka mengerjakannya.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedMission(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors shadow-sm"
              >
                Tutup Skenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
