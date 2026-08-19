// Shared types for DECIDA workspace

export interface Mission {
  id: string
  title: string
  jenjang: 'SD' | 'SMP' | 'SMA'
  scenario: string
  dataset: Record<string, number | null>[]
  steps: string[]
}

export interface StepAnswer {
  step_number: number
  answer_text: string
  evidence_links: EvidenceLink[]
}

export interface EvidenceLink {
  type: 'cell' | 'range' | 'formula' | 'chart'
  ref: string
  value?: string
  label?: string
}

export interface ChartDef {
  id: string
  type: 'bar' | 'line' | 'pie' | 'scatter'
  title: string
  xCol?: string
  yCols: string[]
}

export const FACIONE_INDICATORS = [
  'Interpretasi',
  'Analisis',
  'Evaluasi',
  'Inferensi',
  'Eksplanasi',
  'Regulasi Diri',
] as const

export const JENJANG_CHART_TYPES: Record<'SD' | 'SMP' | 'SMA', string[]> = {
  SD: ['bar', 'pie'],
  SMP: ['bar', 'line', 'pie', 'scatter'],
  SMA: ['bar', 'line', 'pie', 'scatter'],
}

export const CHART_TYPE_LABELS: Record<string, string> = {
  bar: 'Batang',
  line: 'Garis',
  pie: 'Lingkaran',
  scatter: 'Scatter',
}
