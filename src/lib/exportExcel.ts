import ExcelJS from 'exceljs'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function levelToScore(level: string): number {
  switch (level?.toLowerCase()?.trim()) {
    case 'mahir': return 4
    case 'cakap': return 3
    case 'berkembang': return 2
    case 'perlu_bimbingan': return 1
    default: return 0
  }
}

function calculateGrade(avgScore: number): string {
  if (avgScore >= 3.0) return 'Tinggi'
  if (avgScore >= 2.0) return 'Sedang'
  return 'Rendah'
}

export async function generateStudentAssessmentExcel(classIdFilter?: string): Promise<Buffer> {
  const admin = getAdmin()

  // 1. Ambil daftar kelas
  let classQuery = admin.from('classes').select('id, name, code, teacher_id')
  if (classIdFilter) {
    classQuery = classQuery.eq('id', classIdFilter)
  }
  const { data: classes, error: classError } = await classQuery
  if (classError) throw new Error(classError.message)
  if (!classes || classes.length === 0) {
    throw new Error('Kelas tidak ditemukan.')
  }

  const classMap = new Map<string, { name: string; code: string }>()
  classes.forEach(c => classMap.set(c.id, { name: c.name, code: c.code }))
  const classIds = classes.map(c => c.id)

  // 2. Ambil seluruh anggota kelas (class_members)
  const { data: members } = await admin
    .from('class_members')
    .select('class_id, student_id, profiles(id, full_name)')
    .in('class_id', classIds)

  // 3. Ambil ID seluruh mahasiswa
  const studentIds = members?.map(m => m.student_id) || []

  // 4. Ambil sessions untuk mahasiswa-mahasiswa ini
  let sessions: any[] = []
  if (studentIds.length > 0) {
    const { data: sessData } = await admin
      .from('sessions')
      .select('id, student_id, mission_id, created_at, ai_reports(report_data)')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })
    sessions = sessData || []
  }

  // Petakan session terbaru per student_id
  const studentLatestSessionMap = new Map<string, any>()
  sessions.forEach(s => {
    if (!studentLatestSessionMap.has(s.student_id)) {
      studentLatestSessionMap.set(s.student_id, s)
    }
  })

  // 5. Ambil semua step_answers dari session-session tersebut
  const sessionIds = Array.from(studentLatestSessionMap.values()).map(s => s.id)
  let stepAnswers: any[] = []
  if (sessionIds.length > 0) {
    const { data: answersData } = await admin
      .from('step_answers')
      .select('session_id, step_number, answer_text, updated_at')
      .in('session_id', sessionIds)
    stepAnswers = answersData || []
  }

  const sessionAnswersMap = new Map<string, Map<number, string>>()
  stepAnswers.forEach(ans => {
    if (!sessionAnswersMap.has(ans.session_id)) {
      sessionAnswersMap.set(ans.session_id, new Map<number, string>())
    }
    const stepNum = typeof ans.step_number === 'number' ? ans.step_number : (parseInt(ans.step_number, 10) || 1)
    sessionAnswersMap.get(ans.session_id)!.set(stepNum, ans.answer_text || '')
  })

  // 6. Buat Workbook Excel dengan ExcelJS
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'DECIDA Platform'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Rekap Laporan Asesmen', {
    views: [{ showGridLines: true }]
  })

  // Setup Kolom
  worksheet.columns = [
    { key: 'no', width: 8 },
    { key: 'nama', width: 26 },
    { key: 'kelas', width: 28 },
    { key: 'no_soal', width: 14 },
    { key: 'jawaban', width: 45 },
    { key: 'skor_soal', width: 20 },
    { key: 'skor_rata', width: 16 },
    { key: 'grade', width: 20 },
  ]

  // Header Table
  const headerRow = worksheet.addRow([
    'No',
    'Nama Peserta',
    'Kelas\n(mata kuliah atau kode kelas)',
    'Nomer Soal',
    'Jawaban Peserta',
    'Skor per Nomer Soal',
    'Skor rata-rata',
    'Grade peserta'
  ])

  headerRow.height = 36
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    }
    cell.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FF1E293B' }
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF64748B' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    }
  })

  let currentRowIdx = 2

  // 7. Iterasi data mahasiswa (6 baris per mahasiswa)
  if (members && members.length > 0) {
    let studentIdx = 1
    for (const member of members) {
      const studentName = (member.profiles as any)?.full_name || 'Tanpa Nama'
      const classInfo = classMap.get(member.class_id)
      const classNameWithCode = classInfo ? `${classInfo.name} (${classInfo.code})` : '-'

      const session = studentLatestSessionMap.get(member.student_id)
      const answersMap = session ? sessionAnswersMap.get(session.id) : null

      const reportData = Array.isArray(session?.ai_reports)
        ? session?.ai_reports[0]?.report_data
        : session?.ai_reports?.report_data

      const indikatorList = Array.isArray(reportData?.profil_per_indikator)
        ? reportData.profil_per_indikator
        : []

      const scores: number[] = []
      for (let step = 1; step <= 6; step++) {
        const indItem = indikatorList[step - 1]
        const score = indItem ? levelToScore(indItem.level) : 0
        scores.push(score)
      }

      const validScores = scores.filter(s => s > 0)
      const avgScore = validScores.length > 0 
        ? validScores.reduce((a, b) => a + b, 0) / 6 
        : 0
      
      const gradeStr = validScores.length > 0 ? calculateGrade(avgScore) : 'Belum Ada'
      const avgScoreStr = validScores.length > 0 ? avgScore.toFixed(2) : '-'

      const startRow = currentRowIdx

      for (let step = 1; step <= 6; step++) {
        const answerText = answersMap?.get(step) || (session ? '(Tidak diisi)' : 'Belum mengerjakan')
        const scoreVal = scores[step - 1] > 0 ? scores[step - 1] : '-'

        const row = worksheet.addRow([
          studentIdx,
          studentName,
          classNameWithCode,
          step,
          answerText,
          scoreVal,
          avgScoreStr,
          gradeStr
        ])

        row.height = 24
        row.eachCell((cell, colNum) => {
          cell.font = { name: 'Calibri', size: 10 }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
            right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
          }

          if (colNum === 1 || colNum === 4 || colNum === 6 || colNum === 7 || colNum === 8) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' }
          } else if (colNum === 5) {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true }
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'left' }
          }
        })

        currentRowIdx++
      }

      const endRow = currentRowIdx - 1

      // Merge cells vertikal
      worksheet.mergeCells(`A${startRow}:A${endRow}`) // No
      worksheet.mergeCells(`B${startRow}:B${endRow}`) // Nama Peserta
      worksheet.mergeCells(`C${startRow}:C${endRow}`) // Kelas
      worksheet.mergeCells(`G${startRow}:G${endRow}`) // Skor Rata-rata
      worksheet.mergeCells(`H${startRow}:H${endRow}`) // Grade Peserta

      // Warna badge grade
      const gradeCell = worksheet.getCell(`H${startRow}`)
      if (gradeStr === 'Tinggi') {
        gradeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } }
        gradeCell.font = { bold: true, color: { argb: 'FF166534' } }
      } else if (gradeStr === 'Sedang') {
        gradeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } }
        gradeCell.font = { bold: true, color: { argb: 'FF92400E' } }
      } else if (gradeStr === 'Rendah') {
        gradeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }
        gradeCell.font = { bold: true, color: { argb: 'FF991B1B' } }
      }

      studentIdx++
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}
