const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pqvzrsetlulscaxsblvy.supabase.co', 'sb_secret_Kb7qCaV2eMnvDrOh2Lv1Tg_8JL3zvr5');
async function run() {
  const { data, error } = await supabase.from('missions').delete().in('title', ['Kelas Mana yang Lebih Baik?', 'Merchandise Koperasi Kampus', 'Memilih Tim Lomba Nasional']).select();
  console.log('Deleted:', JSON.stringify(data, null, 2));
  if (error) console.error('Error:', error);
}
run();
