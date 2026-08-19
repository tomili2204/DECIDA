const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)
const apiKey = 'AQ.Ab8RN6JAz1rCjF3iTT3iU8L74g8lTVcLyMcyQzqDArMGdEL4Ag'

async function regenerate(sessionId) {
  console.log('Regenerating for', sessionId)
  
  const { data: session } = await supabase.from('sessions').select('id, missions:mission_id(title, jenjang)').eq('id', sessionId).single()
  const { data: answers } = await supabase.from('step_answers').select('step_number, answer_text, evidence_links').eq('session_id', sessionId).order('step_number')
  const { data: markers } = await supabase.from('markers').select('indicators').eq('session_id', sessionId).single()

  const contextData = {
    misi: session.missions.title,
    jenjang: session.missions.jenjang,
    jawaban_mahasiswa: answers.map(a => ({ langkah: a.step_number, teks: a.answer_text, jumlah_tautan_bukti: a.evidence_links?.length || 0 })),
    skor_sistem_otomatis: markers.indicators
  }

  const systemPrompt = `Anda adalah asesor pendidikan tinggi bidang statistika. Tugas Anda adalah memberikan penilaian kualitatif (Explainable AI) terhadap proses penyelesaian masalah statistik mahasiswa berdasarkan lingkungan asesmen 'Spreadsheet Kognitif'.

KERANGKA TEORI (WAJIB DIPAKAI):
1. P.A. Facione (1990) Critical Thinking: Interpretasi, Analisis, Evaluasi, Inferensi, Eksplanasi, Regulasi Diri.
2. Wild & Pfannkuch (1999): Consideration of variation (kesadaran akan variasi/sebaran, bukan sekadar nilai tengah).
3. Makar & Rubin (2009): Informal Inferential Reasoning (penggunaan bahasa probabilistik, kebersyaratan klaim, dan data sebagai evidence).

ATURAN PENILAIAN (EXPLAINABILITY):
- Anda akan diberikan RINGKASAN DATA berupa: teks jawaban 6 langkah mahasiswa, dan skor agregasi sistem (rule-based) dari interaksi log-nya.
- TIDAK ADA jawaban akhir benar tunggal. Nilailah kualitas PROSES dan ARGUMEN, bukan hanya konklusi akhir.
- SETIAP pernyataan penilaian dalam 'narasi' WAJIB didukung oleh bukti spesifik ("evidence") yang benar-benar ada di teks jawaban atau log sistem. Kutip kata-kata siswa jika relevan.
- Jika tidak cukup bukti pada suatu indikator, nyatakan secara eksplisit "belum cukup bukti", JANGAN BERSPEKULASI atau mengarang bukti.
- Sesuaikan gaya bahasa rekomendasi untuk mahasiswa tingkat Perguruan Tinggi.

OUTPUT FORMAT MUST BE A VALID JSON OBJECT MATCHING THIS STRUCTURE:
{ "profil_per_indikator": [{ "indikator": "...", "level": "...", "narasi": "...", "evidence": ["..."] }], "ringkasan_naratif": "...", "rekomendasi_mahasiswa": "...", "rekomendasi_dosen": "...", "keterbatasan_inferensi": "..." }`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: { text: systemPrompt } },
      contents: [{ role: "user", parts: [{ text: "DATA:\n" + JSON.stringify(contextData) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: "application/json" }
    })
  })

  const resData = await res.json()
  let txt = resData.candidates[0].content.parts[0].text
  txt = txt.replace(/```json/gi, '').replace(/```/g, '').trim()
  const validData = JSON.parse(txt)

  await supabase.from('ai_reports').upsert({
    session_id: sessionId,
    report_data: validData,
    prompt_used: systemPrompt,
    model_version: 'gemini-3.5-flash-lite'
  }, { onConflict: 'session_id' })
  
  console.log('Success for', sessionId)
}

async function run() {
  const { data: reports } = await supabase.from('ai_reports').select('session_id')
  for (const r of reports) {
    await regenerate(r.session_id)
  }
}
run()
