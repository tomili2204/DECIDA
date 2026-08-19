'use client'

import { useState, useRef, useEffect } from 'react'
import type { Mission, EvidenceLink, ChartDef } from '@/types/workspace'
import { FACIONE_INDICATORS } from '@/types/workspace'

interface Props {
  mission: Mission
  sessionId: string
  answers: Record<number, { text: string; evidenceLinks: EvidenceLink[] }>
  currentStep: number
  charts: ChartDef[]
  isCompleted: boolean
  evidenceLinkingMode: boolean
  evidenceLinkingStep: number | null
  onAnswerChange: (stepIndex: number, text: string) => void
  onStepChange: (step: number) => void
  onToggleEvidenceMode: (stepIndex: number) => void
  onRemoveEvidence: (stepIndex: number, ref: string) => void
  onEvidenceLink: (link: EvidenceLink) => void
  onSubmitRequest: () => void
}

const STEP_ICONS = ['🔍', '🔬', '⚖️', '🎯', '📝', '🔄']
const INDICATOR_COLORS: Record<string, string> = {
  Interpretasi: 'bg-sky-100 text-sky-700 border-sky-200',
  Analisis: 'bg-violet-100 text-violet-700 border-violet-200',
  Evaluasi: 'bg-amber-100 text-amber-700 border-amber-200',
  Inferensi: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Eksplanasi: 'bg-orange-100 text-orange-700 border-orange-200',
  'Regulasi Diri': 'bg-rose-100 text-rose-700 border-rose-200',
}

const STEP_DESCRIPTIONS: Record<string, string> = {
  Interpretasi: 'Bacalah data secara keseluruhan dan ceritakan apa yang kamu lihat.',
  Analisis: 'Bandingkan berbagai aspek data secara spesifik menggunakan angka.',
  Evaluasi: 'Nilai kekuatan dan kelemahan data sebelum mengambil keputusan.',
  Inferensi: 'Buat keputusan berdasarkan seluruh analisismu.',
  Eksplanasi: 'Jelaskan alasanmu secara rinci dengan merujuk data konkret.',
  'Regulasi Diri': 'Evaluasi kualitas proses berpikirmu sendiri.',
}

export default function DecisionPanel({
  mission,
  sessionId,
  answers,
  currentStep,
  charts,
  isCompleted,
  evidenceLinkingMode,
  evidenceLinkingStep,
  onAnswerChange,
  onStepChange,
  onToggleEvidenceMode,
  onRemoveEvidence,
  onEvidenceLink,
  onSubmitRequest,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const steps = mission.steps as string[]
  const step = steps[currentStep]
  const indicator = FACIONE_INDICATORS[currentStep]
  const currentAnswer = answers[currentStep] ?? { text: '', evidenceLinks: [] }
  const isLinkingThis = evidenceLinkingMode && evidenceLinkingStep === currentStep
  const isLastStep = currentStep === 5

  // Auto-focus textarea when step changes
  useEffect(() => {
    if (!isCompleted) textareaRef.current?.focus()
  }, [currentStep, isCompleted])

  const completedSteps = Object.values(answers).filter((a) => a.text.trim().length > 0).length

  return (
    <aside className="w-full h-full bg-white flex flex-col overflow-hidden shadow-[-4px_0_20px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex-shrink-0 bg-indigo-700 px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Panel Keputusan</span>
          <span className="text-xs text-indigo-300">{completedSteps}/6 langkah</span>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-1.5 mt-2">
          {Array.from({ length: 6 }, (_, i) => {
            const isDone = (answers[i]?.text ?? '').trim().length > 0
            const isCurrent = i === currentStep
            return (
              <button
                key={i}
                onClick={() => onStepChange(i)}
                title={`Langkah ${i + 1}: ${FACIONE_INDICATORS[i]}`}
                className={[
                  'flex-1 h-1.5 rounded-full transition-all',
                  isCurrent ? 'bg-white' : isDone ? 'bg-indigo-300' : 'bg-indigo-800',
                ].join(' ')}
              />
            )
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {/* Step header */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0 mt-0.5">{STEP_ICONS[currentStep]}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-slate-400">Langkah {currentStep + 1}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${INDICATOR_COLORS[indicator] ?? 'bg-gray-100 text-gray-600'}`}>
                  {indicator}
                </span>
              </div>
              <p className="text-xs text-slate-500 italic">{STEP_DESCRIPTIONS[indicator] ?? ''}</p>
            </div>
          </div>

          <div className="mt-3 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
            <p className="text-sm font-medium text-slate-800 leading-relaxed">{step}</p>
          </div>
        </div>

        {/* Answer area */}
        <div className="px-4 py-4 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
            Jawabanmu
          </label>

          <div className={`relative rounded-xl border-2 transition-colors ${isCompleted ? 'border-slate-200 bg-slate-50' : 'border-slate-200 focus-within:border-indigo-400'}`}>
            <textarea
              ref={textareaRef}
              value={currentAnswer.text}
              onChange={(e) => !isCompleted && onAnswerChange(currentStep, e.target.value)}
              disabled={isCompleted}
              placeholder={isCompleted ? '' : `Tuliskan analisismu untuk langkah ini...`}
              rows={5}
              className="w-full px-3 py-3 text-sm text-slate-800 bg-transparent resize-none focus:outline-none placeholder-slate-300 rounded-xl"
            />
            {currentAnswer.text.trim().length > 0 && (
              <div className="absolute bottom-2 right-2 text-xs text-slate-300">
                {currentAnswer.text.length} karakter
              </div>
            )}
          </div>

          {/* Evidence linking section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Bukti Terkait ({currentAnswer.evidenceLinks.length})
              </span>
              {!isCompleted && (
                <button
                  onClick={() => onToggleEvidenceMode(currentStep)}
                  className={[
                    'text-xs font-medium px-2.5 py-1 rounded-lg transition-colors',
                    isLinkingThis
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100',
                  ].join(' ')}
                >
                  {isLinkingThis ? '⏹ Selesai Tautkan' : '🔗 Tautkan Bukti'}
                </button>
              )}
            </div>

            {/* Chart evidence quick-add */}
            {!isCompleted && charts.length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-slate-400 mb-1">Tautkan grafik:</p>
                <div className="flex flex-wrap gap-1">
                  {charts.map((chart) => (
                    <button
                      key={chart.id}
                      onClick={() => onEvidenceLink({ type: 'chart', ref: chart.title, label: `Grafik: ${chart.title}`, value: chart.type })}
                      className="text-xs bg-purple-50 border border-purple-200 text-purple-700 px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      📊 {chart.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence chips */}
            {currentAnswer.evidenceLinks.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {currentAnswer.evidenceLinks.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2.5 py-1 rounded-full"
                  >
                    <span>{ev.type === 'chart' ? '📊' : ev.type === 'formula' ? '🔢' : '📌'}</span>
                    <span className="font-mono max-w-[120px] truncate" title={ev.label ?? ev.ref}>
                      {ev.label ?? ev.ref}
                    </span>
                    {!isCompleted && (
                      <button
                        onClick={() => onRemoveEvidence(currentStep, ev.ref)}
                        className="text-amber-400 hover:text-red-500 transition-colors ml-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-300 italic">
                {isCompleted ? 'Tidak ada bukti terkait.' : 'Tandai sel atau grafik sebagai bukti untuk langkah ini.'}
              </p>
            )}
          </div>
        {/* Nav buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-100 mt-2">
          <button
            onClick={() => onStepChange(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Sebelumnya
          </button>
          {isLastStep ? (
            !isCompleted ? (
              <button
                onClick={onSubmitRequest}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                🚀 Kirim Keputusan
              </button>
            ) : (
              <div className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold text-center">
                ✓ Sudah Dikirim
              </div>
            )
          ) : (
            <button
              onClick={() => onStepChange(Math.min(5, currentStep + 1))}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Selanjutnya →
            </button>
          )}
        </div>

        </div>
      </div>

      {/* Step navigator */}
      <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-slate-50">
        {/* Quick step list */}
        <div className="space-y-1">
          {Array.from({ length: 6 }, (_, i) => {
            const isDone = (answers[i]?.text ?? '').trim().length > 0
            const isCurrent = i === currentStep
            return (
              <button
                key={i}
                onClick={() => onStepChange(i)}
                className={[
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors text-left',
                  isCurrent ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isDone ? 'bg-emerald-400 text-white' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className="truncate">{FACIONE_INDICATORS[i]}</span>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
