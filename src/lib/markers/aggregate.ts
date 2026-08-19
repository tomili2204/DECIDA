import type { SupabaseClient } from '@supabase/supabase-js'

export interface AggregateResult {
  indicators: {
    [key: string]: {
      raw_score: number
      max_score: number
      level: string
      evidence: string[]
    }
  }
}

export async function aggregateMarkers(sessionId: string, supabaseAdmin: SupabaseClient): Promise<void> {
  // 1. Ambil data sesi
  const { data: session, error: sessionErr } = await supabaseAdmin
    .from('sessions')
    .select('mission_id, student_id, missions:mission_id(jenjang)')
    .eq('id', sessionId)
    .single()

  if (sessionErr) console.error("AGGREGATE SESSION ERROR:", sessionErr)
  if (!session) return

  const jenjang = (session.missions as any)?.jenjang || 'SMA'

  // 2. Ambil logs dan answers
  const { data: logs } = await supabaseAdmin
    .from('activity_logs')
    .select('*')
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })

  const { data: answers } = await supabaseAdmin
    .from('step_answers')
    .select('*')
    .eq('session_id', sessionId)
    .order('step_number', { ascending: true })

  // 3. Ambil rules
  const { data: rulesData, error: rulesErr } = await supabaseAdmin
    .from('marker_rules')
    .select('rules')
    .eq('mission_id', session.mission_id)
    .single()
    
  if (rulesErr && rulesErr.code !== 'PGRST116') console.error("AGGREGATE RULES ERROR:", rulesErr)

  // Default rules jika belum ada
  const rules = rulesData?.rules || {
    interpretasi: { step1_keywords: ['rata-rata', 'sebaran', 'tertinggi', 'terendah'] },
    analisis: { min_unique_formulas: 2, step2_keywords: ['mean', 'median', 'rata-rata', 'beda'] },
    evaluasi: { spread_formulas: ['STDEV', 'VAR', 'MAX', 'MIN'], step3_keywords: ['outlier', 'ekstrem', 'kelemahan', 'kurang'] },
    inferensi: { min_evidence_links: 2 },
    eksplanasi: { step5_keywords: ['karena', 'berdasarkan grafik', 'tabel menunjukkan'] },
    regulasi_diri: { step6_keywords: ['mungkin', 'belum tentu', 'kurang data', 'batas'] }
  }

  // 4. Proses Ekstraksi Indikator (Raw)
  const result: AggregateResult = { indicators: {} }
  const ansMap = new Map(answers?.map((a: any) => [a.step_number, a.answer_text?.toLowerCase() || '']) || [])

  // --- INTERPRETASI ---
  let intScore = 0
  const intEv: string[] = []
  
  // Eksplorasi sebelum hitung
  const firstFormulaIdx = logs?.findIndex((l: any) => l.event_type === 'formula_use') ?? -1
  const hasExploreBeforeFormula = logs?.slice(0, firstFormulaIdx > -1 ? firstFormulaIdx : undefined)
    .some((l: any) => ['data_sort', 'data_filter'].includes(l.event_type))
  if (hasExploreBeforeFormula) {
    intScore++
    intEv.push('Melakukan sort/filter data sebelum menggunakan rumus')
  }

  // Cek kata kunci Langkah 1
  const step1 = ansMap.get(1) || ''
  const intKwFound = rules.interpretasi.step1_keywords.filter((k: string) => step1.includes(k.toLowerCase()))
  if (intKwFound.length > 0) {
    intScore++
    intEv.push(`Menyebutkan fitur data di Langkah 1: ${intKwFound.join(', ')}`)
  }
  result.indicators['interpretasi'] = { raw_score: intScore, max_score: 2, level: '', evidence: intEv }

  // --- ANALISIS ---
  let anaScore = 0
  const anaEv: string[] = []
  
  const formulas = new Set(logs?.filter((l: any) => l.event_type === 'formula_use').map((l: any) => l.payload.fn))
  if (formulas.size >= rules.analisis.min_unique_formulas) {
    anaScore++
    anaEv.push(`Menggunakan ${formulas.size} rumus unik (${[...formulas].join(', ')})`)
  }

  const step2 = ansMap.get(2) || ''
  const anaKwFound = rules.analisis.step2_keywords.filter((k: string) => step2.includes(k.toLowerCase()))
  if (anaKwFound.length > 0) {
    anaScore++
    anaEv.push(`Menyebut aspek perbandingan di Langkah 2: ${anaKwFound.join(', ')}`)
  }
  result.indicators['analisis'] = { raw_score: anaScore, max_score: 2, level: '', evidence: anaEv }

  // --- EVALUASI ---
  let evScore = 0
  const evEv: string[] = []
  
  const spreadUsed = [...formulas].some(f => rules.evaluasi.spread_formulas.includes(f))
  if (spreadUsed) {
    evScore++
    evEv.push('Merespons karakteristik data dengan menghitung ukuran sebaran (MIN/MAX/STDEV)')
  }

  const step3 = ansMap.get(3) || ''
  const evKwFound = rules.evaluasi.step3_keywords.filter((k: string) => step3.includes(k.toLowerCase()))
  if (evKwFound.length > 0) {
    evScore++
    evEv.push(`Menyadari kelemahan/outlier di Langkah 3: ${evKwFound.join(', ')}`)
  }
  result.indicators['evaluasi'] = { raw_score: evScore, max_score: 2, level: '', evidence: evEv }

  // --- INFERENSI ---
  let infScore = 0
  const infEv: string[] = []
  
  const totalEvidenceLinks = logs?.filter((l: any) => l.event_type === 'evidence_link').length || 0
  if (totalEvidenceLinks >= rules.inferensi.min_evidence_links) {
    infScore++
    infEv.push(`Melampirkan ${totalEvidenceLinks} bukti (evidence) ke dalam form`)
  }
  result.indicators['inferensi'] = { raw_score: infScore, max_score: 1, level: '', evidence: infEv }

  // --- EKSPLANASI ---
  let expScore = 0
  const expEv: string[] = []

  const step5 = ansMap.get(5) || ''
  const expKwFound = rules.eksplanasi.step5_keywords.filter((k: string) => step5.includes(k.toLowerCase()))
  if (expKwFound.length > 0) {
    expScore++
    expEv.push(`Menyusun argumen klaim-bukti di Langkah 5 dengan: ${expKwFound.join(', ')}`)
  }
  result.indicators['eksplanasi'] = { raw_score: expScore, max_score: 1, level: '', evidence: expEv }

  // --- REGULASI DIRI ---
  let regScore = 0
  const regEv: string[] = []

  const revCount = logs?.filter((l: any) => l.event_type === 'step_answer_revise').length || 0
  if (revCount > 0) {
    regScore++
    regEv.push(`Melakukan ${revCount} kali revisi pada jawaban sebelumnya`)
  }

  const step6 = ansMap.get(6) || ''
  const regKwFound = rules.regulasi_diri.step6_keywords.filter((k: string) => step6.includes(k.toLowerCase()))
  if (regKwFound.length > 0) {
    regScore++
    regEv.push(`Menyadari keterbatasan/probabilitas di Langkah 6: ${regKwFound.join(', ')}`)
  }
  result.indicators['regulasi_diri'] = { raw_score: regScore, max_score: 2, level: '', evidence: regEv }

  // 5. Ambil Rubrics dan tentukan level
  const { data: rubricData } = await supabaseAdmin
    .from('rubrics')
    .select('indicators')
    .eq('mission_id', session.mission_id)
    .eq('jenjang', jenjang)
    .single()

  const defaultRubric = {
    thresholds: [
      { max: 0, level: 'perlu_bimbingan' },
      { max: 1, level: 'berkembang' },
      { max: 2, level: 'cakap' }
    ]
  }

  for (const [key, indicator] of Object.entries(result.indicators)) {
    const thresholds = rubricData?.indicators?.[key]?.thresholds || defaultRubric.thresholds
    // cari level yang sesuai
    let assignedLevel = 'mahir'
    for (const t of thresholds) {
      if (indicator.raw_score <= t.max) {
        assignedLevel = t.level
        break
      }
    }
    indicator.level = assignedLevel
  }

  // 6. Simpan ke database
  const { error: upsertError } = await supabaseAdmin
    .from('markers')
    .upsert(
      { session_id: sessionId, indicators: result.indicators },
      { onConflict: 'session_id' }
    )

  if (upsertError) {
    console.error("MARKERS UPSERT ERROR:", upsertError)
  }

  // 7. Panggil Gemini AI Interpreter secara sinkron agar tidak dibatalkan oleh redirect
  const { generateAIReport } = await import('@/lib/ai/interpreter')
  try {
    await generateAIReport(sessionId)
  } catch (err) {
    console.error('AI Report generation failed:', err)
  }
}
