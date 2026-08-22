import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: Request) {
  try {
    const { difficulty, topic } = await req.json()
    
    if (!difficulty || !topic) {
      return NextResponse.json({ error: 'Missing difficulty or topic' }, { status: 400 })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    
    const prompt = `Anda adalah seorang asisten pembuat soal / kasus studi statistika.
Tugas Anda adalah membuat sebuah kasus studi untuk platform pembelajaran DECIDA berdasarkan topik: "${topic}".
Tingkat kesulitan: ${difficulty === 'Mudah' ? 'Mudah (Hanya butuh rata-rata/jumlah dasar)' : difficulty === 'Sedang' ? 'Sedang (Perbandingan dua kelompok, korelasi)' : 'Tinggi (Regresi, uji hipotesis kompleks)'}.

Kembalikan jawaban DALAM FORMAT JSON SAJA yang berisi:
1. "title": Judul kasus (singkat dan menarik)
2. "scenario": Skenario masalah yang panjang dan mendetail yang menjelaskan latar belakang dan apa yang harus diputuskan.
3. "dataset": Sebuah array dari objek-objek JSON. Buatlah data sintetis sebanyak 10-20 baris yang relevan dengan topik.
4. "steps": Sebuah array string kosong [] (DECIDA belum membutuhkan steps terstruktur dari AI saat ini).

Pastikan format output murni JSON yang valid.`

    const result = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    })

    const text = result.text
    if (!text) throw new Error('AI returned empty response')
    
    const parsedData = JSON.parse(text)
    
    return NextResponse.json(parsedData)
  } catch (error: any) {
    console.error('Error generating AI mission:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
