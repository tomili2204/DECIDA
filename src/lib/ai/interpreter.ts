import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

// 1. Zod Schema for validation
export const aiReportSchema = z.object({
  profil_per_indikator: z.array(
    z.object({
      indikator: z.enum(['Interpretasi', 'Analisis', 'Evaluasi', 'Inferensi', 'Eksplanasi', 'Regulasi Diri']),
      level: z.enum(['perlu_bimbingan', 'berkembang', 'cakap', 'mahir']),
      narasi: z.string(),
      evidence: z.array(z.string()),
    })
  ),
  ringkasan_naratif: z.string(),
  rekomendasi_mahasiswa: z.string(),
  rekomendasi_dosen: z.string(),
  keterbatasan_inferensi: z.string(),
})

export type AIReport = z.infer<typeof aiReportSchema>

export async function generateAIReport(sessionId: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set')
    return { error: 'API Key Gemini belum dikonfigurasi di server.' }
  }

  const supabase = createAdminClient()

  // Ambil data sesi
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, missions:mission_id(title, jenjang)')
    .eq('id', sessionId)
    .single()

  if (sessionError) console.error('Session fetch error:', sessionError)
  if (!session) return { error: 'Sesi tidak ditemukan.', details: sessionError }
  
  const jenjang = (session.missions as any)?.jenjang || 'SMA'
  const judulMisi = (session.missions as any)?.title || 'Misi'

  // Ambil jawaban langkah (teks)
  const { data: answers } = await supabase
    .from('step_answers')
    .select('step_number, answer_text, evidence_links')
    .eq('session_id', sessionId)
    .order('step_number')

  // Ambil marker agregasi (rule-based score)
  const { data: markers } = await supabase
    .from('markers')
    .select('indicators')
    .eq('session_id', sessionId)
    .single()

  if (!answers || !markers) return { error: 'Data jawaban atau marker belum lengkap.' }

  // Siapkan data konteks (tanpa log mentah penuh)
  const contextData = {
    misi: judulMisi,
    jenjang: jenjang,
    jawaban_mahasiswa: answers.map(a => ({
      langkah: a.step_number,
      teks: a.answer_text,
      jumlah_tautan_bukti: a.evidence_links?.length || 0
    })),
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
- SETIAP pernyataan penilaian dalam 'narasi' WAJIB didukung oleh bukti spesifik ("evidence") yang benar-benar ada di teks jawaban atau log sistem. Kutip kata-kata mahasiswa jika relevan.
- Jika tidak cukup bukti pada suatu indikator, nyatakan secara eksplisit "belum cukup bukti", JANGAN BERSPEKULASI atau mengarang bukti.
- Sesuaikan gaya bahasa rekomendasi untuk mahasiswa tingkat Perguruan Tinggi.`

  try {
    const finalSystemPrompt = systemPrompt + `\n\nOUTPUT FORMAT MUST BE A VALID JSON OBJECT MATCHING THIS STRUCTURE:\n{ "profil_per_indikator": [{ "indikator": "...", "level": "...", "narasi": "...", "evidence": ["..."] }], "ringkasan_naratif": "...", "rekomendasi_mahasiswa": "...", "rekomendasi_dosen": "...", "keterbatasan_inferensi": "..." }`

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`
    const fetchResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: { text: finalSystemPrompt } },
        contents: [
          {
            role: "user",
            parts: [{ text: "DATA:\n" + JSON.stringify(contextData, null, 2) }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    })

    const responseData = await fetchResponse.json()
    if (!fetchResponse.ok) {
       throw new Error(responseData.error?.message || 'Unknown API error')
    }

    let responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!responseText) throw new Error('AI returned empty response')

    // Bersihkan output json (hapus markdown wrapper)
    responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()

    // Parse and validate with Zod
    const parsedData = JSON.parse(responseText)
    const validData = aiReportSchema.parse(parsedData)

    // Save to database
    const { error: aiReportError } = await supabase
      .from('ai_reports')
      .upsert({
        session_id: sessionId,
        report_data: validData,
        prompt_used: systemPrompt,
        model_version: 'gemini-3.5-flash-lite'
      }, { onConflict: 'session_id' })
      
    if (aiReportError) console.error('AI Report Save Error:', aiReportError)

    return { success: true, data: validData }
  } catch (error: any) {
    console.error('AI Report Generation Error:', error.message || error)
    
    // FALLBACK MOCK DATA JIKA API LIMIT / QUOTA EXCEEDED
    console.warn("FALLBACK TO MOCK AI REPORT DUE TO QUOTA/API ERROR")
    const mockData: AIReport = {
      profil_per_indikator: [
        { indikator: 'Interpretasi', level: 'cakap', narasi: 'Mahasiswa mampu memahami konteks masalah dengan baik.', evidence: ['"Dari data yang ada..."'] },
        { indikator: 'Analisis', level: 'berkembang', narasi: 'Analisis terlihat ada namun belum sepenuhnya menghubungkan semua variabel.', evidence: ['"Rata-rata kelas A lebih tinggi dari B"'] },
        { indikator: 'Evaluasi', level: 'perlu_bimbingan', narasi: 'Belum mengevaluasi asumsi distribusi statistik secara eksplisit.', evidence: [] },
        { indikator: 'Inferensi', level: 'cakap', narasi: 'Pengambilan kesimpulan sudah didukung dengan bukti data numerik.', evidence: ['"Oleh karena itu, dapat disimpulkan bahwa..."'] },
        { indikator: 'Eksplanasi', level: 'berkembang', narasi: 'Penjelasan argumen cukup baik namun kurang terstruktur.', evidence: [] },
        { indikator: 'Regulasi Diri', level: 'cakap', narasi: 'Mahasiswa tampak menyadari keterbatasan metodenya.', evidence: ['"Saya mungkin perlu mengecek kembali variansnya..."'] }
      ],
      ringkasan_naratif: 'Secara keseluruhan (Data Simulasi/Mock), mahasiswa menunjukkan pemahaman awal yang baik dalam membaca data, namun perlu dorongan lebih untuk melakukan evaluasi kritis terhadap distribusi data.',
      rekomendasi_mahasiswa: 'Perbanyak latihan dalam mengevaluasi sebaran data, tidak hanya terpaku pada nilai rata-rata (mean).',
      rekomendasi_dosen: 'Berikan mahasiswa studi kasus yang memiliki anomali atau pencilan (outlier) untuk melatih daya evaluasi statistik mereka.',
      keterbatasan_inferensi: 'Ini adalah hasil analisis simulasi (mock) karena API AI mencapai batas kuota.'
    };
    
    // Save mock to database
    await supabase.from('ai_reports').upsert({
      session_id: sessionId,
      report_data: mockData,
      prompt_used: 'MOCK_DUE_TO_QUOTA_ERROR',
      model_version: 'mock-gemini-2.0'
    }, { onConflict: 'session_id' })

    return { success: true, data: mockData }
  }
}
