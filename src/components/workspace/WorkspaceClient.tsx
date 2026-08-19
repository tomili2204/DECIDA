'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import type { Mission, StepAnswer, EvidenceLink, ChartDef } from '@/types/workspace'
import { saveStepAnswer, submitDecision } from '@/app/workspace/actions'
import { useTelemetry } from '@/lib/telemetry'
import MissionPanel from './MissionPanel'
import SpreadsheetPanel from './SpreadsheetPanel'
import DecisionPanel from './DecisionPanel'

interface Props {
  session: { id: string; status: string }
  mission: Mission
  savedAnswers: StepAnswer[]
  studentName: string
}

export interface WorkspaceState {
  answers: Record<number, { text: string; evidenceLinks: EvidenceLink[] }>
  currentStep: number
  charts: ChartDef[]
  evidenceLinkingMode: boolean
  evidenceLinkingStep: number | null
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  showSubmitConfirm: boolean
  isSubmitting: boolean
}

export default function WorkspaceClient({ session, mission, savedAnswers, studentName }: Props) {
  const isCompleted = session.status === 'completed'
  const { logEvent } = useTelemetry()

  // Initialize answers from saved data
  const initAnswers = useCallback(() => {
    const a: Record<number, { text: string; evidenceLinks: EvidenceLink[] }> = {}
    for (let i = 0; i < 6; i++) {
      const saved = savedAnswers.find((s) => s.step_number === i + 1)
      a[i] = { text: saved?.answer_text ?? '', evidenceLinks: saved?.evidence_links ?? [] }
    }
    return a
  }, [savedAnswers])

  const [state, setState] = useState<WorkspaceState>({
    answers: initAnswers(),
    currentStep: 0,
    charts: [],
    evidenceLinkingMode: false,
    evidenceLinkingStep: null,
    saveStatus: 'idle',
    showSubmitConfirm: false,
    isSubmitting: false,
  })

  const [dataStats, setDataStats] = useState<Record<string, { count: number; hasNull: boolean }>>({})

  // Resizing Panels
  const [leftWidth, setLeftWidth] = useState(280)
  const [rightWidth, setRightWidth] = useState(380)

  const handleLeftDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = leftWidth
    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      setLeftWidth(Math.min(Math.max(startWidth + delta, 250), 500))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleRightDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = rightWidth
    const onMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX
      setRightWidth(Math.min(Math.max(startWidth + delta, 300), 800))
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateAnswer = useCallback((stepIndex: number, text: string) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [stepIndex]: { ...prev.answers[stepIndex], text } },
      saveStatus: 'idle',
    }))

    // Debounce save
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(async () => {
      logEvent('step_answer_draft', { step: stepIndex + 1, text })
      const saved = savedAnswers.find((s) => s.step_number === stepIndex + 1)
      if (saved && saved.answer_text && saved.answer_text !== text && text.trim().length > 0) {
        logEvent('step_answer_revise', { step: stepIndex + 1, before: saved.answer_text, after: text })
      }
      
      setState((prev) => ({ ...prev, saveStatus: 'saving' }))
      try {
        const current = { text, evidenceLinks: state.answers[stepIndex]?.evidenceLinks ?? [] }
        await saveStepAnswer(session.id, stepIndex + 1, text, current.evidenceLinks)
        setState((prev) => ({ ...prev, saveStatus: 'saved' }))
        setTimeout(() => setState((prev) => ({ ...prev, saveStatus: 'idle' })), 2000)
      } catch {
        setState((prev) => ({ ...prev, saveStatus: 'error' }))
      }
    }, 1500)
  }, [session.id, state.answers, savedAnswers, logEvent])

  const addEvidenceLink = useCallback((link: EvidenceLink) => {
    setState((prev) => {
      const step = prev.evidenceLinkingStep ?? prev.currentStep
      const existing = prev.answers[step]?.evidenceLinks ?? []
      const isDuplicate = existing.some((e) => e.ref === link.ref)
      if (isDuplicate) return prev
      const updated = [...existing, link]
      // Auto-save evidence
      setTimeout(() => {
        logEvent('evidence_link', { step: step + 1, link })
        saveStepAnswer(session.id, step + 1, prev.answers[step]?.text ?? '', updated).catch(() => {})
      }, 0)
      return {
        ...prev,
        answers: { ...prev.answers, [step]: { ...prev.answers[step], evidenceLinks: updated } },
      }
    })
  }, [session.id])

  const removeEvidenceLink = useCallback((stepIndex: number, ref: string) => {
    setState((prev) => {
      const updated = (prev.answers[stepIndex]?.evidenceLinks ?? []).filter((e) => e.ref !== ref)
      setTimeout(() => {
        saveStepAnswer(session.id, stepIndex + 1, prev.answers[stepIndex]?.text ?? '', updated).catch(() => {})
      }, 0)
      return {
        ...prev,
        answers: { ...prev.answers, [stepIndex]: { ...prev.answers[stepIndex], evidenceLinks: updated } },
      }
    })
  }, [session.id])

  const toggleEvidenceLinkingMode = useCallback((stepIndex: number) => {
    setState((prev) => ({
      ...prev,
      evidenceLinkingMode: prev.evidenceLinkingStep === stepIndex ? !prev.evidenceLinkingMode : true,
      evidenceLinkingStep: stepIndex,
    }))
  }, [])

  const exitEvidenceLinkingMode = useCallback(() => {
    setState((prev) => ({ ...prev, evidenceLinkingMode: false, evidenceLinkingStep: null }))
  }, [])

  const setCurrentStep = useCallback((step: number) => {
    setState((prev) => {
      if (prev.currentStep !== step) {
        setTimeout(() => {
          logEvent('step_navigate', { from: prev.currentStep + 1, to: step + 1 })
        }, 0)
      }
      return { ...prev, currentStep: step }
    })
  }, [logEvent])

  const addChart = useCallback((chart: ChartDef) => {
    logEvent('chart_create', { chart_id: chart.id, type: chart.type, columns: chart.columns })
    setState((prev) => ({ ...prev, charts: [...prev.charts, chart] }))
  }, [logEvent])

  const removeChart = useCallback((id: string) => {
    logEvent('chart_delete', { chart_id: id })
    setState((prev) => ({ ...prev, charts: prev.charts.filter((c) => c.id !== id) }))
  }, [logEvent])

  const handleSubmitRequest = useCallback(() => {
    setState((prev) => ({ ...prev, showSubmitConfirm: true }))
  }, [])

  const handleSubmitConfirm = useCallback(async () => {
    setState((prev) => ({ ...prev, isSubmitting: true }))
    // Save all answers first
    for (let i = 0; i < 6; i++) {
      const a = state.answers[i]
      if (a) {
        await saveStepAnswer(session.id, i + 1, a.text, a.evidenceLinks).catch(() => {})
      }
    }
    logEvent('decision_submit', { answers: state.answers })
    await submitDecision(session.id)
  }, [session.id, state.answers, logEvent])

  const handleSubmitCancel = useCallback(() => {
    setState((prev) => ({ ...prev, showSubmitConfirm: false }))
  }, [])

  const allStepsAnswered = Object.values(state.answers).every((a) => a.text.trim().length > 0)

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-12 bg-indigo-900 flex items-center justify-between px-4 shadow-md flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <a href="/workspace" className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div className="w-px h-5 bg-indigo-700" />
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-sm">DECIDA</span>
            <span className="text-indigo-400 text-xs hidden sm:inline">·</span>
            <span className="text-indigo-200 text-xs hidden sm:inline truncate max-w-[200px]">{mission.title}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          <span className="text-xs">
            {state.saveStatus === 'saving' && <span className="text-indigo-300 animate-pulse">Menyimpan...</span>}
            {state.saveStatus === 'saved' && <span className="text-emerald-400">✓ Tersimpan</span>}
            {state.saveStatus === 'error' && <span className="text-red-400">! Gagal menyimpan</span>}
          </span>

          {state.evidenceLinkingMode && (
            <button
              onClick={exitEvidenceLinkingMode}
              className="flex items-center gap-1.5 bg-amber-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium animate-pulse"
            >
              <span>🔗</span>
              Mode Tautkan Bukti Aktif — Klik sel untuk menautkan
              <span className="ml-1 text-amber-200">✕ Selesai</span>
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {studentName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">{studentName}</span>
          </div>
        </div>
      </header>

      {/* Three Panels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Mission Panel */}
        <div 
          onClick={() => logEvent('panel_focus', { panel: 'mission' })} 
          className="flex flex-col h-full bg-white flex-shrink-0"
          style={{ width: leftWidth }}
        >
          <MissionPanel mission={mission} liveStats={dataStats} />
        </div>

        {/* Left Resizer */}
        <div 
          className="w-1 bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-colors flex-shrink-0 z-10" 
          onMouseDown={handleLeftDrag}
        />

        {/* Center: Spreadsheet */}
        <div onClick={() => logEvent('panel_focus', { panel: 'spreadsheet' })} className="flex-1 min-w-0 flex flex-col h-full">
          <SpreadsheetPanel
            mission={mission}
            onEvidenceLink={addEvidenceLink}
            onChartAdd={addChart}
            onChartRemove={removeChart}
            charts={state.charts}
            isLinkingMode={state.evidenceLinkingMode}
            linkingStep={state.evidenceLinkingStep}
            onDataUpdate={setDataStats}
          />
        </div>

        {/* Right Resizer */}
        <div 
          className="w-1 bg-slate-200 hover:bg-indigo-400 cursor-col-resize transition-colors flex-shrink-0 z-10" 
          onMouseDown={handleRightDrag}
        />

        {/* Right: Decision Panel */}
        <div 
          onClick={() => logEvent('panel_focus', { panel: 'decision' })} 
          className="flex flex-col h-full bg-white flex-shrink-0"
          style={{ width: rightWidth }}
        >
          <DecisionPanel
          mission={mission}
          sessionId={session.id}
          answers={state.answers}
          currentStep={state.currentStep}
          charts={state.charts}
          isCompleted={isCompleted}
          onAnswerChange={updateAnswer}
          onStepChange={setCurrentStep}
          onToggleEvidenceMode={toggleEvidenceLinkingMode}
          onRemoveEvidence={removeEvidenceLink}
          onEvidenceLink={addEvidenceLink}
          onSubmitRequest={handleSubmitRequest}
          evidenceLinkingMode={state.evidenceLinkingMode}
          evidenceLinkingStep={state.evidenceLinkingStep}
        />
      </div>
      </div>

      {/* Submit Confirmation Modal */}
      {state.showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Yakin ingin mengirimkan keputusanmu?</h2>
              <p className="text-gray-500 text-sm">
                Setelah dikirimkan, kamu tidak dapat mengubah jawaban. Pastikan semua langkah sudah kamu isi dengan
                baik.
              </p>
            </div>

            {!allStepsAnswered && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-700">
                ⚠️ Kamu belum mengisi semua langkah. Lanjutkan tetap mengirimkan?
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmitCancel}
                disabled={state.isSubmitting}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Kembali & Cek Lagi
              </button>
              <button
                onClick={handleSubmitConfirm}
                disabled={state.isSubmitting}
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors disabled:opacity-60"
              >
                {state.isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Mengirim...
                  </span>
                ) : (
                  '🚀 Ya, Kirimkan!'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
