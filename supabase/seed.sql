-- Seed data for DECIDA

-- 1. Insert Users into auth.users (for local dev)
-- Admin
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  'b958fbfa-298a-4467-bc5b-47e937d3dd10',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@decida.id',
  crypt('admin123', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Dosen
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, confirmation_token, recovery_token, email_change_token_new, email_change_token_current, email_change, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
VALUES (
  '93623bf1-893e-4b47-ba21-1f9dfab8dbd4',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'dosen@decida.id',
  crypt('dosen123', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Identities (required by Supabase v2 for email login)
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  'b958fbfa-298a-4467-bc5b-47e937d3dd10',
  'b958fbfa-298a-4467-bc5b-47e937d3dd10',
  'admin@decida.id',
  '{"sub": "b958fbfa-298a-4467-bc5b-47e937d3dd10", "email": "admin@decida.id"}',
  'email',
  now(), now(), now()
) ON CONFLICT DO NOTHING;

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (
  '93623bf1-893e-4b47-ba21-1f9dfab8dbd4',
  '93623bf1-893e-4b47-ba21-1f9dfab8dbd4',
  'dosen@decida.id',
  '{"sub": "93623bf1-893e-4b47-ba21-1f9dfab8dbd4", "email": "dosen@decida.id"}',
  'email',
  now(), now(), now()
) ON CONFLICT DO NOTHING;

-- 2. Insert Profiles
INSERT INTO public.profiles (id, role, full_name)
VALUES 
  ('b958fbfa-298a-4467-bc5b-47e937d3dd10', 'admin', 'Administrator Peneliti'),
  ('93623bf1-893e-4b47-ba21-1f9dfab8dbd4', 'teacher', 'Dosen Budi')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, full_name = EXCLUDED.full_name;

-- 3. Insert Classes
INSERT INTO public.classes (id, name, code, teacher_id, jenjang)
VALUES 
  ('1e485459-26ff-4bd3-ad6b-8cb0628859cd', 'Mata Kuliah Metodologi Penelitian', 'MK-123', '93623bf1-893e-4b47-ba21-1f9dfab8dbd4', 'SMA'),
  ('3b08e2f3-1cf0-42be-bc70-4dbceb6ebde4', 'Mata Kuliah Statistika Dasar', 'MK-124', '93623bf1-893e-4b47-ba21-1f9dfab8dbd4', 'SD'),
  ('e1011ff5-a4f5-4679-b1d7-b8f9eefce86d', 'Mata Kuliah Pengantar Bisnis', 'MK-125', '93623bf1-893e-4b47-ba21-1f9dfab8dbd4', 'SMP')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Missions
INSERT INTO public.missions (id, title, jenjang, scenario, dataset, steps)
VALUES 
(
  'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  'Kelas Mana yang Lebih Baik?',
  'SMA',
  'Seorang dosen telah mengadakan ujian akhir materi pada Kelas A dan Kelas B. Bantu dosen tersebut menentukan kelas mana yang lebih baik secara statistik. Tentukan nilai rata-rata masing-masing kelas terlebih dahulu, kemudian ikuti langkah-langkah di Panel Keputusan.',
  '[
    {"Kelas A": 62, "Kelas B": 55},
    {"Kelas A": 62, "Kelas B": 58},
    {"Kelas A": 63, "Kelas B": 60},
    {"Kelas A": 64, "Kelas B": 62},
    {"Kelas A": 65, "Kelas B": 63},
    {"Kelas A": 66, "Kelas B": 65},
    {"Kelas A": 66, "Kelas B": 66},
    {"Kelas A": 67, "Kelas B": 67},
    {"Kelas A": 67, "Kelas B": 68},
    {"Kelas A": 68, "Kelas B": 69},
    {"Kelas A": 68, "Kelas B": 70},
    {"Kelas A": 69, "Kelas B": 70},
    {"Kelas A": 69, "Kelas B": 71},
    {"Kelas A": 70, "Kelas B": 72},
    {"Kelas A": 70, "Kelas B": 73},
    {"Kelas A": 71, "Kelas B": 74},
    {"Kelas A": 71, "Kelas B": 75},
    {"Kelas A": 72, "Kelas B": 76},
    {"Kelas A": 72, "Kelas B": 78},
    {"Kelas A": 73, "Kelas B": 80},
    {"Kelas A": 74, "Kelas B": 82},
    {"Kelas A": 75, "Kelas B": 85},
    {"Kelas A": 76, "Kelas B": 88},
    {"Kelas A": 78, "Kelas B": 90},
    {"Kelas A": 80, "Kelas B": 92},
    {"Kelas A": null, "Kelas B": 94},
    {"Kelas A": null, "Kelas B": 94}
  ]'::jsonb,
  '["Apa yang dapat kamu simpulkan dari data ini? Jelaskan berdasarkan pemahamanmu.", "Jelaskan perbedaan dan kesamaan antar kelompok data dengan data sebagai dasar (sebutkan lebih dari satu aspek).", "Apakah perbedaan itu cukup kuat untuk menyatakan satu pilihan lebih baik? Pertimbangkan kemungkinan kelemahan data.", "Berdasarkan analisismu, apa keputusanmu?", "Jelaskan secara rinci alasan keputusanmu dengan menggunakan data yang tersedia.", "Apakah keputusanmu sudah tepat? Jika ya, mengapa? Jika belum, bagian mana dari analisismu yang mungkin penyebabnya, dan adakah cara lain menilai?"]'::jsonb
),
(
  'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
  'Merchandise Koperasi Kampus',
  'SD',
  'Koperasi Mahasiswa (Kopma) mencatat penjualan 5 jenis merchandise selama seminggu. Bantu pengurus Kopma memutuskan merchandise mana yang stoknya perlu ditambah atau dikurangi untuk minggu depan.',
  '[
    {"Merchandise": "Gantungan Kunci", "Senin": 15, "Selasa": 12, "Rabu": 18, "Kamis": 10, "Jumat": 20},
    {"Merchandise": "Stiker BEM", "Senin": 30, "Selasa": 28, "Rabu": 35, "Kamis": 30, "Jumat": 40},
    {"Merchandise": "Notebook", "Senin": 50, "Selasa": 45, "Rabu": 48, "Kamis": 42, "Jumat": 55},
    {"Merchandise": "Totebag", "Senin": 20, "Selasa": 18, "Rabu": 22, "Kamis": 15, "Jumat": 25},
    {"Merchandise": "Lanyard", "Senin": 10, "Selasa": 8, "Rabu": 12, "Kamis": 5, "Jumat": 15}
  ]'::jsonb,
  '["Apa yang dapat kamu simpulkan dari data penjualan ini?", "Merchandise mana yang paling laku dan paling tidak laku?", "Apakah data ini cukup untuk memutuskan persediaan stok minggu depan?", "Apa keputusanmu tentang stok merchandise kampus?", "Jelaskan alasan keputusanmu berdasarkan data penjualan.", "Apakah kamu yakin dengan keputusanmu? Apa yang bisa membuatnya salah?"]'::jsonb
),
(
  'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
  'Memilih Tim Lomba Nasional',
  'SMP',
  'Fakultas akan mengirimkan tim berisi 3 mahasiswa untuk kompetisi analisis bisnis tingkat nasional. Ada 6 calon dengan nilai simulasi yang berfluktuasi. Siapa saja yang sebaiknya dipilih?',
  '[
    {"Nama": "Ali", "Simulasi 1": 70, "Simulasi 2": 75, "Simulasi 3": 80, "Simulasi 4": 85, "Simulasi 5": 90},
    {"Nama": "Budi", "Simulasi 1": 90, "Simulasi 2": 60, "Simulasi 3": 95, "Simulasi 4": 55, "Simulasi 5": 100},
    {"Nama": "Cici", "Simulasi 1": 80, "Simulasi 2": 80, "Simulasi 3": 80, "Simulasi 4": 80, "Simulasi 5": 80},
    {"Nama": "Dedi", "Simulasi 1": 85, "Simulasi 2": 82, "Simulasi 3": 88, "Simulasi 4": 80, "Simulasi 5": 86},
    {"Nama": "Eka", "Simulasi 1": 60, "Simulasi 2": 95, "Simulasi 3": 65, "Simulasi 4": 90, "Simulasi 5": 70},
    {"Nama": "Fani", "Simulasi 1": 75, "Simulasi 2": 78, "Simulasi 3": 76, "Simulasi 4": 79, "Simulasi 5": 77}
  ]'::jsonb,
  '["Apa yang dapat kamu simpulkan dari skor simulasi kompetisi ini?", "Apa perbedaan antara nilai mahasiswa yang stabil dan yang naik turun?", "Apakah nilai rata-rata saja cukup untuk memilih tim delegasi?", "Siapa 3 mahasiswa yang kamu pilih untuk lomba?", "Jelaskan alasanmu memilih mereka berdasarkan data skor.", "Apakah keputusanmu sudah yang paling tepat? Jelaskan alasannya."]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
