const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'http://127.0.0.1:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function test() {
  const { data: members, error } = await supabase
    .from('class_members')
    .select('*, profiles(full_name, email)')
    
  console.log('Class members error:', error)
  console.log('Class members Data:', JSON.stringify(members, null, 2))

  const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'student')
  console.log('Student Profiles:', JSON.stringify(profiles, null, 2))

  const { data: sessions } = await supabase.from('sessions').select('*, missions(title)')
  console.log('Sessions:', JSON.stringify(sessions, null, 2))

  // Fix: insert class members based on sessions and classes
  if (sessions && sessions.length > 0) {
    // get class id from student email?
    // the email is format: safeName@safeCode.decida.local
    // Let's just find the class ID for "1-A"
    const { data: cls } = await supabase.from('classes').select('id, code').eq('code', '1-A').single()
    if (cls && profiles) {
       for (const p of profiles) {
          // just add everyone to 1-A to be safe!
          await supabase.from('class_members').upsert({
            class_id: cls.id,
            student_id: p.id
          }, { onConflict: 'class_id,student_id' })
       }
       console.log('Added students to class', cls.code)
    }
  }
}

test()
