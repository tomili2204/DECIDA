'use client'

import { useState } from 'react'
import { deleteMission, saveMission } from './actions'
import DatasetEditor from './DatasetEditor'

export default function MissionManager({ initialMissions, userId, classes }: { initialMissions: any[], userId: string, classes: any[] }) {
  const [missions, setMissions] = useState(initialMissions)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingMission, setEditingMission] = useState<any>(null)
  const [editingDataset, setEditingDataset] = useState<any[]>([])

  const [aiDifficulty, setAiDifficulty] = useState('Sedang')
  const [aiClassId, setAiClassId] = useState(classes[0]?.id || '')
  const [aiTopic, setAiTopic] = useState('')

  async function handleDelete(id: string) {
    if (!confirm('Hapus misi ini?')) return
    try {
      await deleteMission(id)
      setMissions(prev => prev.filter(m => m.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function handleGenerateAI() {
    if (!aiTopic) return alert('Masukkan topik terlebih dahulu.')
    if (!aiClassId) return alert('Pilih mata kuliah terlebih dahulu.')
    
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/generate-mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: aiDifficulty, topic: aiTopic })
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Gagal meng-generate kasus. Detail: ${errText}`)
      }
      
      const data = await res.json()
      
      // Auto-save the new mission
      await saveMission(null, {
        title: data.title,
        jenjang: 'SD', // fallback for old columns if needed
        difficulty: aiDifficulty,
        class_id: aiClassId,
        scenario: data.scenario,
        dataset: data.dataset,
        steps: data.steps
      })

      // We just reload the page to get the new missions list
      window.location.reload()
      
    } catch (e: any) {
      alert(e.message)
      setIsGenerating(false)
    }
  }

  async function handleSaveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    try {
      const payload = {
        title: formData.get('title'),
        jenjang: 'SD', // old column
        difficulty: formData.get('difficulty'),
        class_id: formData.get('class_id'),
        scenario: formData.get('scenario'),
        dataset: JSON.parse(formData.get('dataset') as string),
      }
      await saveMission(editingMission.id, payload)
      window.location.reload()
    } catch (e: any) {
      alert('Error: ' + e.message + '. Pastikan format Dataset adalah JSON yang valid.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Misi Anda</h2>
          <p className="text-sm text-slate-500">Misi ini hanya bisa diakses oleh kelas Anda.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { 
              setEditingMission({ title: '', scenario: '', dataset: [], steps: [], difficulty: 'Sedang', class_id: classes[0]?.id })
              setEditingDataset([])
              setShowEditModal(true) 
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200"
          >
            + Buat Manual
          </button>
          <button 
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <span>✨</span> Generate via AI
          </button>
        </div>
      </div>

      {missions.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {missions.map(mission => (
            <div key={mission.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col items-start gap-1">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                    Tingkat {mission.difficulty || 'Sedang'}
                  </span>
                  <span className="text-xs text-indigo-600 font-medium px-2 py-1 bg-indigo-50 rounded-lg">
                    {mission.classes?.name || 'Misi Global / Belum Di-assign'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { 
                    setEditingMission(mission)
                    setEditingDataset(mission.dataset || [])
                    setShowEditModal(true) 
                  }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(mission.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{mission.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{mission.scenario}</p>
              <div className="text-xs text-slate-400 font-mono">
                {mission.dataset?.length || 0} baris data
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-4xl mb-4">🤖</div>
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Kasus</h3>
          <p className="text-slate-500 mt-2">Mulai dengan klik Generate via AI untuk membuat kasus studi secara instan.</p>
        </div>
      )}

      {/* Modal Generate AI */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Generate Kasus via AI ✨</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mata Kuliah</label>
                <select value={aiClassId} onChange={e => setAiClassId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat Kesulitan</label>
                <select value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
                  <option value="Mudah">Mudah (Analisis Dasar)</option>
                  <option value="Sedang">Sedang (Perbandingan / Korelasi)</option>
                  <option value="Tinggi">Tinggi (Uji Hipotesis / Regresi)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topik Kasus (Opsional)</label>
                <input 
                  type="text" 
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="Misal: Penjualan Kopi, Nilai Ujian, dll"
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
              <button 
                onClick={handleGenerateAI} 
                disabled={isGenerating || !aiTopic}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-lg transition-colors"
              >
                {isGenerating ? 'Membuat...' : 'Generate Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Manual */}
      {showEditModal && editingMission && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mb-8 flex flex-col max-h-[90vh]">
            <form onSubmit={handleSaveEdit} className="flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex-shrink-0">
                <h3 className="text-xl font-bold">{editingMission.id ? 'Edit Misi' : 'Buat Misi Manual'}</h3>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mata Kuliah</label>
                    <select name="class_id" defaultValue={editingMission.class_id || classes[0]?.id} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat Kesulitan</label>
                    <select name="difficulty" defaultValue={editingMission.difficulty || 'Sedang'} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500">
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Tinggi">Tinggi</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Judul Misi</label>
                  <input name="title" defaultValue={editingMission.title} required className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Skenario (Deskripsi Kasus)</label>
                  <textarea name="scenario" defaultValue={editingMission.scenario} required rows={4} className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dataset</label>
                  <DatasetEditor value={editingDataset} onChange={setEditingDataset} />
                  <input type="hidden" name="dataset" value={JSON.stringify(editingDataset)} />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl flex-shrink-0">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors font-medium">Batal</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
