'use client'

import { useState, useTransition } from 'react'
import { saveMarkerRulesAction } from './actions'
import { useRouter } from 'next/navigation'

export default function MarkerEditorClient({ missionId, initialRules }: { missionId: string, initialRules: any }) {
  const [rules, setRules] = useState(initialRules)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveMarkerRulesAction(missionId, rules)
        alert('Aturan Markers berhasil disimpan!')
        router.refresh()
      } catch (error: any) {
        alert('Gagal menyimpan aturan markers: ' + error.message)
      }
    })
  }

  const updateRuleValue = (indicator: string, ruleKey: string, valStr: string, isArray: boolean) => {
    const newRules = { ...rules }
    if (!newRules[indicator]) newRules[indicator] = {}
    
    if (isArray) {
      newRules[indicator][ruleKey] = valStr.split(',').map(s => s.trim()).filter(s => s)
    } else {
      newRules[indicator][ruleKey] = parseInt(valStr) || 0
    }
    
    setRules(newRules)
  }

  const addRule = (indicator: string, ruleKey: string, type: 'array' | 'number') => {
    if (!ruleKey) return
    const newRules = { ...rules }
    if (!newRules[indicator]) newRules[indicator] = {}
    newRules[indicator][ruleKey] = type === 'array' ? [] : 0
    setRules(newRules)
  }

  const deleteRule = (indicator: string, ruleKey: string) => {
    const newRules = { ...rules }
    if (newRules[indicator]) {
      delete newRules[indicator][ruleKey]
    }
    setRules(newRules)
  }

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden p-6">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <p className="text-sm text-slate-500 max-w-2xl">
          Aturan ekstraksi _behavioral markers_ (tahap 4). Konfigurasi ini dibaca saat sistem mengagregasi *trace* setiap sesi untuk menentukan *raw score* tiap indikator. Pisahkan kata kunci dengan tanda koma ( , ).
        </p>
        <button 
          onClick={handleSave} 
          disabled={isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? 'Menyimpan...' : '💾 Simpan Perubahan'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(rules).map(([indicator, indicatorRules]) => (
          <div key={indicator} className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
            <h3 className="font-bold text-lg text-slate-800 capitalize mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              {indicator.replace('_', ' ')}
            </h3>
            
            <div className="space-y-4 flex-1">
              {Object.entries(indicatorRules as any).map(([ruleKey, ruleValue]) => {
                const isArray = Array.isArray(ruleValue)
                const valStr = isArray ? (ruleValue as string[]).join(', ') : String(ruleValue)
                
                return (
                  <div key={ruleKey} className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        {ruleKey.replace(/_/g, ' ')}
                      </span>
                      <button onClick={() => deleteRule(indicator, ruleKey)} className="text-rose-400 hover:text-rose-600 text-xs font-medium">Hapus</button>
                    </div>
                    {isArray ? (
                      <textarea 
                        value={valStr} 
                        onChange={(e) => updateRuleValue(indicator, ruleKey, e.target.value, true)}
                        className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                        placeholder="kata1, kata2, kata3..."
                      />
                    ) : (
                      <input 
                        type="number"
                        value={valStr}
                        onChange={(e) => updateRuleValue(indicator, ruleKey, e.target.value, false)}
                        className="w-full text-sm p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    )}
                  </div>
                )
              })}
              {Object.keys(indicatorRules as any).length === 0 && (
                <p className="text-sm text-slate-400 italic">Tidak ada aturan spesifik.</p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
              <button 
                onClick={() => {
                  const key = prompt('Masukkan nama aturan baru (tanpa spasi, gunakan underscore, cth: step1_keywords):')
                  if (key) addRule(indicator, key, 'array')
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs py-1.5 rounded"
              >
                + Array
              </button>
              <button 
                onClick={() => {
                  const key = prompt('Masukkan nama aturan numerik baru (tanpa spasi, gunakan underscore, cth: min_formulas):')
                  if (key) addRule(indicator, key, 'number')
                }}
                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs py-1.5 rounded"
              >
                + Angka
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
