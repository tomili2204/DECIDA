const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function test() {
  const { data: ai_reports, error } = await supabase.from('ai_reports').select('*')
  console.log('AI Reports Error:', error)
  console.log('AI Reports:', JSON.stringify(ai_reports, null, 2))

  const { data: sessions } = await supabase.from('sessions').select('*')
  console.log('Sessions:', JSON.stringify(sessions, null, 2))
}

test()
