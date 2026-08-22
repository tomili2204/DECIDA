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
      const { data: markers } = await admin.from('markers').select('*')
      data = markers
      break
    case 'ai_reports':
      const { data: reports } = await admin.from('ai_reports').select('*')
      data = reports
      break
    default:
      return new NextResponse('Invalid export type', { status: 400 })
  }

  if (!data || data.length === 0) {
    if (format === 'json') {
      return NextResponse.json([])
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
