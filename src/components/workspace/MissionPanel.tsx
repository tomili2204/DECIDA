'use client'

import { useState } from 'react'
import type { Mission } from '@/types/workspace'

interface Props {
  mission: Mission
  liveStats?: Record<string, { count: number; hasNull: boolean }>
}

const JENJANG_BADGE: Record<string, string> = {
  SD: 'bg-green-100 text-green-700',
  SMP: 'bg-blue-100 text-blue-700',
  SMA: 'bg-purple-100 text-purple-700',
}

const JENJANG_DISPLAY: Record<string, string> = {
  SD: 'Semester 1-2',
  SMP: 'Semester 3-4',
  SMA: 'Semester 5-6',
}

const JENJANG_HINTS: Record<string, string[]> = {
  SD: ['SUM – Jumlah total', 'MAX – Nilai terbesar', 'MIN – Nilai terkecil', 'COUNT – Jumlah data'],
  SMP: ['AVERAGE – Rata-rata', 'MEDIAN – Nilai tengah', 'MODE – Nilai terbanyak', 'MIN / MAX', 'STDEV – Sebaran data'],
  SMA: ['AVERAGE – Rata-rata', 'MEDIAN – Nilai tengah', 'STDEV – Simpangan baku', 'MIN / MAX / COUNT', 'Urutkan & Filter data'],
}

export default function MissionPanel({ mission, liveStats }: Props) {
  const [showHint, setShowHint] = useState(false)
  const hints = JENJANG_HINTS[mission.jenjang] ?? JENJANG_HINTS.SMA

  // Extract dataset summary
  const cols = mission.dataset.length > 0 ? Object.keys(mission.dataset[0]) : []

  const colStats = liveStats && Object.keys(liveStats).length > 0 ? liveStats : (() => {
    const staticStats: Record<string, { count: number; hasNull: boolean }> = {}
    cols.forEach((col) => {
      const vals = mission.dataset.map((r) => r[col]).filter((v) => v !== null && v !== undefined)
      staticStats[col] = { count: vals.length, hasNull: vals.length < mission.dataset.length }
    })
    return staticStats
  })()

  return (
    <aside className="w-full h-full bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-indigo-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Misi</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${JENJANG_BADGE[mission.jenjang]} ml-auto`}>
            {JENJANG_DISPLAY[mission.jenjang] || mission.jenjang}
          </span>
        </div>
        <h1 className="font-bold text-lg leading-snug">{mission.title}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Scenario */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">📖 Skenario</h2>
          <p className="text-slate-700 text-sm leading-relaxed">{mission.scenario}</p>
        </section>

        {/* Dataset summary */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">📊 Dataset</h2>
          <div className="space-y-2">
            {cols.map((col) => (
              <div key={col} className="bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-indigo-700">{col}</span>
                  <span className="text-xs text-slate-400">{colStats[col].count} data</span>
                </div>
                {colStats[col].hasNull && (
                  <p className="text-xs text-amber-600 mt-0.5">⚠ Ada data kosong</p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Data sudah dimuat di spreadsheet. Kamu dapat menghitung, mengurutkan, dan membuat grafik.
          </p>
        </section>

        {/* Tujuan */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">🎯 Tujuanmu</h2>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-indigo-800 text-sm font-medium">
              Analisis data ini, lalu isi seluruh 6 langkah di Panel Keputusan di sebelah kanan.
            </p>
          </div>
        </section>

        {/* Tools hint */}
        <section>
          <button
            onClick={() => setShowHint((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            <span>🔧 Alat yang tersedia</span>
            <span>{showHint ? '▲' : '▼'}</span>
          </button>
          {showHint && (
            <div className="mt-2 bg-slate-50 rounded-lg p-3 space-y-1.5">
              {hints.map((hint) => (
                <div key={hint} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                  <span className="font-mono">{hint}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />
                <span>Grafik Batang, Garis, Lingkaran, Scatter</span>
              </div>
            </div>
          )}
        </section>

        {/* Tips */}
        <section className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700 font-semibold mb-1">💡 Tips</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Gunakan tombol <strong>&quot;🔗 Tautkan Bukti&quot;</strong> di Panel Keputusan untuk menandai sel atau
            grafik yang mendukung jawabanmu.
          </p>
        </section>
      </div>
    </aside>
  )
}
