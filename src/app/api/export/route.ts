import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const format = searchParams.get('format') || 'csv'

  const supabase = await createClient()
  
  // Minimal auth check for admin/researcher (simplified for now)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  let data: any[] | null = []
  
  switch (type) {
    case 'activity_logs':
      const { data: logs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: true })
      data = logs
      break
    case 'step_answers':
      const { data: answers } = await supabase.from('step_answers').select('*').order('session_id').order('step_number')
      data = answers
      break
    case 'markers':
      const { data: markers } = await supabase.from('markers').select('*')
      data = markers
      break
    case 'ai_reports':
      const { data: reports } = await supabase.from('ai_reports').select('*')
      data = reports
      break
    default:
      return new NextResponse('Invalid export type', { status: 400 })
  }

  if (!data || data.length === 0) {
    return new NextResponse('No data found', { status: 404 })
  }

  if (format === 'json') {
    return NextResponse.json(data)
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
