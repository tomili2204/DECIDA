import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminSupabase } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getAdmin() {
  return createAdminSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const format = searchParams.get('format') || 'csv'

  const supabase = await createClient()
  const admin = getAdmin()
  
  // Auth check for admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })
  
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 })

  let data: any[] | null = []
  
  switch (type) {
    case 'activity_logs':
      const { data: logs } = await admin.from('activity_logs').select('*').order('created_at', { ascending: true })
      data = logs
      break
    case 'step_answers':
      const { data: answers } = await admin.from('step_answers').select('*').order('session_id').order('step_number')
      data = answers
      break
    case 'markers':
      const { data: markersData, error: markersErr } = await admin
        .from('markers')
        .select(`
          id,
          session_id,
          indicators,
          sessions (
            id,
            student_id,
            profiles:student_id (full_name),
            missions:mission_id (title)
          )
        `)
      
      if (markersErr) {
        console.error('Markers fetch error:', markersErr)
      }

      data = (markersData || []).map((m: any) => {
        const ind = m.indicators || {}
        return {
          'Nama Mahasiswa': m.sessions?.profiles?.full_name || '-',
          'Judul Misi': m.sessions?.missions?.title || '-',
          'Interpretasi (Level)': ind.interpretasi?.level || '-',
          'Interpretasi (Skor)': ind.interpretasi ? `${ind.interpretasi.raw_score}/${ind.interpretasi.max_score}` : '-',
          'Analisis (Level)': ind.analisis?.level || '-',
          'Analisis (Skor)': ind.analisis ? `${ind.analisis.raw_score}/${ind.analisis.max_score}` : '-',
          'Evaluasi (Level)': ind.evaluasi?.level || '-',
          'Evaluasi (Skor)': ind.evaluasi ? `${ind.evaluasi.raw_score}/${ind.evaluasi.max_score}` : '-',
          'Inferensi (Level)': ind.inferensi?.level || '-',
          'Inferensi (Skor)': ind.inferensi ? `${ind.inferensi.raw_score}/${ind.inferensi.max_score}` : '-',
          'Eksplanasi (Level)': ind.eksplanasi?.level || '-',
          'Eksplanasi (Skor)': ind.eksplanasi ? `${ind.eksplanasi.raw_score}/${ind.eksplanasi.max_score}` : '-',
          'Regulasi Diri (Level)': ind.regulasi_diri?.level || '-',
          'Regulasi Diri (Skor)': ind.regulasi_diri ? `${ind.regulasi_diri.raw_score}/${ind.regulasi_diri.max_score}` : '-',
        }
      })
      break
    case 'ai_reports':
      const { data: reportsData, error: reportsErr } = await admin
        .from('ai_reports')
        .select(`
          id,
          session_id,
          model_version,
          created_at,
          report_data,
          sessions (
            id,
            student_id,
            profiles:student_id (full_name),
            missions:mission_id (title)
          )
        `)
        .order('created_at', { ascending: false })

      if (reportsErr) {
        console.error('AI Reports fetch error:', reportsErr)
      }

      data = (reportsData || []).map((r: any) => {
        const rep = r.report_data || {}
        const indMap: Record<string, string> = {}
        if (Array.isArray(rep.profil_per_indikator)) {
          rep.profil_per_indikator.forEach((item: any) => {
            if (item && item.indikator) {
              indMap[item.indikator.toLowerCase()] = item.level || '-'
            }
          })
        }
        return {
          'Nama Mahasiswa': r.sessions?.profiles?.full_name || '-',
          'Judul Misi': r.sessions?.missions?.title || '-',
          'Waktu Penilaian AI': r.created_at ? new Date(r.created_at).toLocaleString('id-ID') : '-',
          'Ringkasan Naratif': rep.ringkasan_naratif || '-',
          'Interpretasi': indMap['interpretasi'] || '-',
          'Analisis': indMap['analisis'] || '-',
          'Evaluasi': indMap['evaluasi'] || '-',
          'Inferensi': indMap['inferensi'] || '-',
          'Eksplanasi': indMap['eksplanasi'] || '-',
          'Regulasi Diri': indMap['regulasi diri'] || indMap['regulasi_diri'] || '-',
          'Rekomendasi Mahasiswa': rep.rekomendasi_mahasiswa || '-',
          'Catatan Dosen': rep.catatan_dosen || '-',
        }
      })
      break
    default:
      return new NextResponse('Invalid export type', { status: 400 })
  }

  if (!data || data.length === 0) {
    if (format === 'json') {
      return NextResponse.json([])
    }
    if (format === 'xlsx') {
      const ExcelJS = (await import('exceljs')).default
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(type || 'Data')
      worksheet.addRow(['Pesan'])
      worksheet.addRow(['Belum ada data di tabel ini'])
      const buffer = await workbook.xlsx.writeBuffer()
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="decida_${type}_empty.xlsx"`
        }
      })
    }
    return new NextResponse('message\n"Belum ada data di tabel ini"', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="decida_${type}_empty.csv"`
      }
    })
  }

  if (format === 'json') {
    return NextResponse.json(data)
  }

  // Convert to Excel XLSX
  if (format === 'xlsx') {
    const ExcelJS = (await import('exceljs')).default
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(type || 'Data')

    const headers = Object.keys(data[0])
    const headerRow = worksheet.addRow(headers)
    headerRow.height = 24
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' }
      }
      cell.font = { name: 'Calibri', bold: true, color: { argb: 'FF1E293B' } }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF64748B' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } }
      }
    })

    data.forEach(row => {
      const rowValues = headers.map(header => {
        let val = row[header]
        if (val === null || val === undefined) return ''
        if (typeof val === 'object') return JSON.stringify(val)
        return val
      })
      const dataRow = worksheet.addRow(rowValues)
      dataRow.height = 20
      dataRow.eachCell(cell => {
        cell.font = { name: 'Calibri', size: 10 }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        }
      })
    })

    // Auto-fit column widths
    worksheet.columns.forEach(column => {
      let maxLen = 12
      column.eachCell?.({ includeEmpty: true }, cell => {
        const len = cell.value ? cell.value.toString().length : 0
        if (len > maxLen) maxLen = Math.min(len, 50)
      })
      column.width = maxLen + 3
    })

    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="decida_${type}_export.xlsx"`
      }
    })
  }

  // Convert to CSV
  if (format === 'csv') {
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          let val = row[header]
          if (val === null || val === undefined) return '""'
          if (typeof val === 'object') {
            val = JSON.stringify(val).replace(/"/g, '""')
          } else if (typeof val === 'string') {
            val = val.replace(/"/g, '""')
          }
          return `"${val}"`
        }).join(',')
      )
    ]
    
    const csvContent = csvRows.join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="decida_${type}_export.csv"`
      }
    })
  }

  return new NextResponse('Invalid format', { status: 400 })
}
