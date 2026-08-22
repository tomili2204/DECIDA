'use client'

import { useState, useTransition } from 'react'
import { saveRubricsAction } from './actions'
import { useRouter } from 'next/navigation'

const FACIONE_INDICATORS = ['interpretasi', 'analisis', 'evaluasi', 'inferensi', 'eksplanasi', 'regulasi_diri']

export default function RubricEditorClient({ missionId, initialData }: { missionId: string, initialData: any }) {
  const [data, setData] = useState(initialData)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveRubricsAction(missionId, data)
        alert('Rubrik berhasil disimpan!')
        router.refresh()
      } catch (error: any) {
        alert('Gagal menyimpan rubrik: ' + error.message)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-800">Editor Rubrik</h2>
        <button 
          onClick={handleSave} 
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {isPending ? 'Menyimpan...' : '💾 Simpan Perubahan'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <RubricForm jenjang="SD" title="Tingkat Mudah" data={data['SD']} onChange={(newData) => setData({...data, SD: newData})} />
        <RubricForm jenjang="SMP" title="Tingkat Sedang" data={data['SMP']} onChange={(newData) => setData({...data, SMP: newData})} />
        <RubricForm jenjang="SMA" title="Tingkat Tinggi" data={data['SMA']} onChange={(newData) => setData({...data, SMA: newData})} />
      </div>
    </div>
  )
}

function RubricForm({ jenjang, title, data, onChange }: { jenjang: string, title: string, data: any, onChange: (newData: any) => void }) {
  const updateThreshold = (indicator: string, index: number, field: string, value: any) => {
    const newData = { ...data }
    newData[indicator].thresholds[index][field] = value
    onChange(newData)
  }

  const addThreshold = (indicator: string) => {
    const newData = { ...data }
    newData[indicator].thresholds.push({ max: 0, level: 'perlu_bimbingan' })
    onChange(newData)
  }

  const removeThreshold = (indicator: string, index: number) => {
    const newData = { ...data }
    newData[indicator].thresholds.splice(index, 1)
    onChange(newData)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        {FACIONE_INDICATORS.map(indicator => {
          const indicatorData = data[indicator] || { thresholds: [] }
          return (
            <div key={indicator} className="border border-slate-200 rounded-lg p-3">
              <h3 className="font-semibold text-sm text-indigo-700 capitalize mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  {indicator.replace('_', ' ')}
                </span>
                <button onClick={() => addThreshold(indicator)} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">
                  + Tambah
                </button>
              </h3>
              
              <div className="space-y-2">
                {indicatorData.thresholds.map((t: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="text-xs text-slate-500 w-8">{'<='}</span>
                    <input 
                      type="number" 
                      value={t.max} 
                      onChange={(e) => updateThreshold(indicator, i, 'max', parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 text-sm border border-slate-300 rounded"
                    />
                    <select 
                      value={t.level}
                      onChange={(e) => updateThreshold(indicator, i, 'level', e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded"
                    >
                      <option value="perlu_bimbingan">Perlu Bimbingan</option>
                      <option value="berkembang">Berkembang</option>
                      <option value="cakap">Cakap</option>
                      <option value="mahir">Mahir</option>
                    </select>
                    <button onClick={() => removeThreshold(indicator, i)} className="text-rose-500 hover:text-rose-700 px-1">
                      &times;
                    </button>
                  </div>
                ))}
                {indicatorData.thresholds.length === 0 && (
                  <div className="text-xs text-slate-400 italic text-center py-2">Belum ada aturan</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
