const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function test() {
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      id,
      ai_reports(report_data)
    `)
  console.log('Error:', error)
  console.log('Sessions Data:', JSON.stringify(sessions, null, 2))
}

test()
