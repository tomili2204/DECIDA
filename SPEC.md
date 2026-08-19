# PROMPT PENGEMBANGAN — Instrumen Asesmen Berbasis Web Terintegrasi AI-Learning Analytics (v2)

> Salin seluruh isi di bawah garis ini ke Antigravity sebagai prompt awal proyek.

---

## 1. KONTEKS DAN TUJUAN

Bangun aplikasi web bernama **DECIDA** (*Decision with Data*) — a web-based cognitive spreadsheet assessment environment — sebuah instrumen asesmen berbasis proses (process-based assessment) untuk mengukur dan memediasi **berpikir kritis dalam pengambilan keputusan statistik** pada siswa SD, SMP, dan SMA di Indonesia.

Nama produk yang tampil di seluruh UI, logo, title, dan metadata adalah **DECIDA** dengan tagline **"Putuskan dengan Data"**. Dalam dokumen penelitian, konsep inti aplikasi ini disebut *Game Spreadsheet Kognitif* (analytical workspace); istilah tersebut boleh dipakai di README dan dokumentasi teknis, tetapi TIDAK ditampilkan kepada siswa di antarmuka.

Prinsip inti yang WAJIB dipegang di seluruh implementasi:

1. **Assessment as learning, bukan tes.** Siswa bekerja dalam analytical workspace berbentuk spreadsheet interaktif dengan skenario/misi kontekstual dan alur pertanyaan terbimbing. Tidak ada soal pilihan ganda sebagai instrumen utama.
2. **Yang dinilai adalah PROSES, bukan hanya jawaban akhir.** Seluruh interaksi siswa direkam sebagai *digital cognitive trace* (log aktivitas granular).
3. **Explainable AI, bukan black-box.** Interpretasi AI (Gemini) harus selalu merujuk pada evidence perilaku konkret dari log dan jawaban siswa. Setiap klaim dalam laporan AI wajib menyebut marker dan event yang mendukungnya.
4. Desain pengukuran mengikuti **Evidence-Centered Design (ECD)**: competency model → evidence model → task model.

### Landasan teori (competency model)

- **Konstruk berpikir kritis**: enam keterampilan inti **Facione (1990, Delphi Report)** — *interpretasi, analisis, evaluasi, inferensi, eksplanasi, regulasi diri*. Keenamnya menjadi sumbu profil hasil asesmen (radar chart 6 dimensi).
- **Operasionalisasi konteks statistik**: dimensi *consideration of variation* dan siklus investigasi dari kerangka statistical thinking **Wild & Pfannkuch (1999)**, serta tiga komponen *informal inferential reasoning* **Makar & Rubin (2009)**: generalisasi melampaui data, data sebagai bukti, dan bahasa ketidakpastian.
- Behavioral markers (bagian 6) diturunkan dari kombinasi kedua lapis teori ini. Seluruh teks sistem, rubrik, dan prompt AI harus konsisten dengan kerangka ini.

Bahasa antarmuka: **Bahasa Indonesia** sepenuhnya, dengan gaya bahasa menyesuaikan jenjang (SD sederhana dan ramah, SMA lebih formal).

## 2. TECH STACK

- **Frontend + backend**: Next.js 14+ (App Router, TypeScript, Tailwind CSS)
- **Database + Auth**: Supabase (PostgreSQL, Supabase Auth, Row Level Security)
- **AI**: Google Gemini API (model `gemini-2.0-flash` atau lebih baru), dipanggil HANYA dari server route (API key tidak pernah terekspos ke client), dengan structured output JSON
- **Chart**: Recharts (dashboard) dan chart builder internal untuk workspace siswa
- **Spreadsheet engine**: implementasi grid sendiri (React) ATAU library ringan seperti Handsontable/Fortune-Sheet — pilih yang paling mudah diinstrumentasi untuk logging per-event. Formula subset: SUM, AVERAGE, MEDIAN, MODE, MIN, MAX, COUNT, STDEV, sort, filter.
- Deployment target: Vercel + Supabase cloud

## 3. PERAN PENGGUNA DAN AUTENTIKASI

| Peran | Akses |
|---|---|
| **Siswa** | Masuk dengan kode kelas + nama (tanpa email, ramah anak) atau akun. Mengerjakan misi, melihat profil hasil versi siswa. |
| **Guru** | Akun email. Membuat kelas, memilih paket misi per jenjang, memantau progres, melihat dashboard hasil per siswa. |
| **Peneliti/Admin** | Semua akses guru + ekspor dataset log (CSV/JSON), manajemen konten misi, konfigurasi marker & rubrik. |

Catatan privasi: data siswa adalah data anak. Minimalkan data pribadi (cukup nama panggilan + kelas), RLS ketat per kelas, sediakan anonimisasi saat ekspor dataset penelitian.

## 4. WORKSPACE DECIDA (GAME SPREADSHEET KOGNITIF)

Layout workspace (satu layar, tiga panel):

1. **Panel Misi (kiri)** — narasi skenario kontekstual, data awal, dan tujuan keputusan.
2. **Panel Spreadsheet (tengah, terbesar)** — grid interaktif berisi dataset misi. Siswa dapat mengedit, menghitung dengan formula, mengurutkan, memfilter, dan membuat chart (batang, garis, lingkaran, scatter, boxplot sesuai jenjang).
3. **Panel Keputusan (kanan)** — alur **6 langkah terbimbing** (bukan satu textbox), setiap langkah adalah pertanyaan terbuka yang dipetakan ke satu indikator Facione. Siswa dapat kembali dan merevisi langkah sebelumnya — setiap revisi terekam. Di setiap langkah tersedia fitur **"tautkan bukti"** untuk menandai sel, hasil formula, atau chart yang mendukung jawaban.

### Alur 6 langkah Panel Keputusan (template task model)

| Langkah | Pertanyaan (template) | Indikator |
|---|---|---|
| 1 | Apa yang dapat kamu simpulkan dari data ini? Jelaskan berdasarkan pemahamanmu. | Interpretasi |
| 2 | Jelaskan perbedaan dan kesamaan antar kelompok data dengan data sebagai dasar (sebutkan lebih dari satu aspek). | Analisis |
| 3 | Apakah perbedaan itu cukup kuat untuk menyatakan satu pilihan lebih baik? Pertimbangkan kemungkinan kelemahan data. | Evaluasi |
| 4 | Berdasarkan analisismu, apa keputusanmu? | Inferensi |
| 5 | Jelaskan secara rinci alasan keputusanmu dengan menggunakan data yang tersedia. | Eksplanasi |
| 6 | Apakah keputusanmu sudah tepat? Jika ya, mengapa? Jika belum, bagian mana dari analisismu yang mungkin penyebabnya, dan adakah cara lain menilai? | Regulasi diri |

Redaksi pertanyaan per misi disimpan di database (dapat diubah peneliti), tetapi struktur 6 langkah dan pemetaan indikatornya tetap.

Elemen gamifikasi ringan (non-kompetitif): progress misi, lencana eksplorasi (misal "Penjelajah Data" jika mencoba ≥2 representasi berbeda), tanpa leaderboard antar siswa.

### Misi seed (minimal 2 per jenjang; misi utama SMA di bawah ini WAJIB diimplementasikan persis)

**MISI UTAMA SMA — "Kelas Mana yang Lebih Baik?"** (instrumen penelitian asli)

Skenario: Seorang guru telah mengadakan tes akhir materi pada Kelas A dan Kelas B. Bantu guru tersebut menentukan kelas mana yang lebih baik.

Dataset (dimuat otomatis ke spreadsheet dalam dua kolom):
- **Kelas A (25 siswa)**: 62, 62, 63, 64, 65, 66, 66, 67, 67, 68, 68, 69, 69, 70, 70, 71, 71, 72, 72, 73, 74, 75, 76, 78, 80
- **Kelas B (27 siswa)**: 55, 58, 60, 62, 63, 65, 66, 67, 68, 69, 70, 70, 71, 72, 73, 74, 75, 76, 78, 80, 82, 85, 88, 90, 92, 94, 94

Karakteristik pedagogis yang disengaja (JANGAN "diperbaiki"): rata-rata A ≈ 69,5 dengan sebaran sempit (rentang 62–80, konsisten); rata-rata B ≈ 74,0 dengan sebaran lebar (rentang 55–94) dan jumlah siswa tidak sama. Tidak ada satu jawaban benar tunggal — yang dinilai adalah kualitas proses analisis, pertimbangan variasi, dan penggunaan data sebagai bukti. Instruksi pembuka misi: "Tentukan nilai rata-rata masing-masing kelas terlebih dahulu, kemudian ikuti langkah-langkah di Panel Keputusan."

Misi ini juga dipakai untuk **SMP kelas 8–9** dengan rubrik/ekspektasi berbeda (dual-rubric, lihat bagian 6): di SMP cukup penalaran intuitif tentang sebaran; di SMA (Fase E) diharapkan memakai ukuran penyebaran eksplisit (jangkauan, STDEV, kuartil).

**Misi SD (Fase C, kelas 5–6)** — contoh: *"Kantin Sekolah"*: data penjualan 5 jajanan selama seminggu; siswa memutuskan stok mana ditambah/dikurangi. Formula: SUM, MAX, MIN, COUNT; chart batang/piktogram. Alur Panel Keputusan tetap 6 langkah dengan redaksi yang disederhanakan.

**Misi SMP tambahan** — contoh: *"Memilih Tim Lomba"*: skor latihan 6 siswa yang fluktuatif; mean vs median vs konsistensi memberi jawaban berbeda.

Struktur misi disimpan di database (bukan hardcoded) agar peneliti dapat menambah misi dari panel admin.

## 5. SISTEM LOGGING — DIGITAL COGNITIVE TRACE

Setiap sesi menghasilkan aliran event ke tabel `activity_logs`:

```json
{
  "session_id": "uuid",
  "student_id": "uuid",
  "mission_id": "uuid",
  "event_type": "string",
  "timestamp": "ISO8601 (presisi milidetik)",
  "payload": { }
}
```

Event minimal WAJIB:

| event_type | payload |
|---|---|
| `session_start` / `session_end` | — |
| `cell_edit` | sel, nilai lama, nilai baru |
| `formula_use` | jenis formula, range, sel target |
| `chart_create` / `chart_change` / `chart_delete` | jenis chart, kolom data |
| `data_sort` / `data_filter` | kolom, kriteria |
| `evidence_link` | langkah ke-n, sel/chart yang ditautkan |
| `step_answer_draft` | langkah ke-n, isi jawaban |
| `step_answer_revise` | langkah ke-n, isi sebelum & sesudah |
| `step_navigate` | dari langkah, ke langkah (maju/mundur) |
| `decision_submit` | seluruh jawaban final 6 langkah |
| `panel_focus` | panel aktif |
| `idle` | durasi jeda > 30 detik |
| `hint_request` | misi & konteks (jika fitur petunjuk aktif) |

Implementasi: buffer event di client, kirim batch tiap 5 detik atau 20 event (debounce), retry saat koneksi putus. Logging TIDAK BOLEH mengganggu kelancaran interaksi.

## 6. BEHAVIORAL MARKERS → INDIKATOR (EVIDENCE MODEL)

Setelah `decision_submit`, jalankan **pre-processing rule-based** yang mengagregasi log + jawaban menjadi marker terukur. Pemetaan (Facione dioperasionalkan dengan Wild & Pfannkuch [W&P] dan Makar & Rubin [M&R]):

| Indikator (Facione) | Behavioral markers dari log & jawaban | Landasan operasional |
|---|---|---|
| **Interpretasi** | eksplorasi data sebelum menghitung (sort/filter/scroll sebelum formula pertama); waktu orientasi; jawaban langkah 1 menyebut fitur data secara benar | W&P: membaca data dalam siklus investigasi |
| **Analisis** | ragam formula yang dipakai; ≥2 representasi berbeda dicoba; jawaban langkah 2 menyebut >1 aspek pembanding (pemusatan DAN sebaran/ukuran sampel) | W&P: transnumerasi (mengubah representasi) |
| **Evaluasi** | verifikasi ulang hasil hitung; merespons karakteristik data (menghitung ukuran sebaran, memperhatikan n tidak sama, nilai ekstrem); jawaban langkah 3 menyebut kelemahan data | W&P: *consideration of variation*; M&R: menilai kekuatan bukti |
| **Inferensi** | keputusan langkah 4 konsisten dengan analisis langkah 1–3; jumlah `evidence_link` valid; keputusan tidak melampaui apa yang didukung data | M&R: *data as evidence*, generalisasi melampaui data secara hati-hati |
| **Eksplanasi** | jawaban langkah 5 menyebut hasil perhitungan/chart secara eksplisit dan runtut; struktur klaim–bukti–penalaran | Facione: menyatakan hasil penalaran |
| **Regulasi diri** | jumlah revisi langkah setelah eksplorasi baru (revisi strategi, bukan asal ganti); navigasi mundur untuk meninjau; jawaban langkah 6 mengidentifikasi keterbatasan analisis sendiri dan memakai bahasa ketidakpastian ("mungkin", "belum tentu", "perlu data lain") | M&R: *probabilistic language*; Facione: self-examination |

Hasil agregasi disimpan di tabel `markers` (skor/frekuensi per indikator per sesi). Aturan pemetaan **konfigurabel** dari panel admin (akan disempurnakan saat validasi ahli). Dukung **dual-rubric per misi**: ambang/ekspektasi berbeda untuk SMP dan SMA pada misi yang sama.

## 7. MODUL AI — GEMINI SEBAGAI INTERPRETER (EXPLAINABLE)

Pipeline (server-side, dipicu setelah sesi selesai atau on-demand):

1. Ambil ringkasan marker (bagian 6) + statistik sesi + teks jawaban 6 langkah. **Jangan kirim log mentah penuh** — kirim ringkasan terstruktur.
2. Panggil Gemini dengan system prompt yang menetapkan: peran sebagai asesor pendidikan matematika; kerangka Facione (6 indikator) yang dioperasionalkan dengan consideration of variation (Wild & Pfannkuch) dan informal inferential reasoning (Makar & Rubin); jenjang & rubrik siswa (memengaruhi ekspektasi dan gaya bahasa); serta aturan explainability: *setiap pernyataan penilaian WAJIB mencantumkan evidence berupa marker/event/kutipan jawaban pendukung; jika evidence tidak cukup, nyatakan "belum cukup bukti", jangan berspekulasi; tidak ada jawaban benar tunggal pada misi — nilai kualitas proses dan argumen, bukan pilihan akhirnya*.
3. Output JSON terstruktur:

```json
{
  "profil_per_indikator": [
    {
      "indikator": "Evaluasi",
      "level": "perlu_bimbingan | berkembang | cakap | mahir",
      "narasi": "string",
      "evidence": ["marker/event/kutipan jawaban yang mendukung"]
    }
  ],
  "ringkasan_naratif": "string",
  "rekomendasi_siswa": "string (bahasa sesuai jenjang)",
  "rekomendasi_guru": "string",
  "keterbatasan_inferensi": "string"
}
```

4. Validasi JSON di server (zod), simpan ke `ai_reports` beserta prompt & versi model (audit penelitian). Tampilkan di dashboard.
5. Tombol "regenerate" untuk peneliti; penanganan error/rate-limit yang baik.

## 8. DASHBOARD HASIL

**Versi siswa** (setelah submit): kartu profil sederhana per indikator dengan ikon/level, narasi motivatif sesuai jenjang, satu saran perbaikan. Tanpa angka mentah yang menghakimi.

**Versi guru/peneliti**:
- Radar chart 6 indikator (Facione) per siswa per misi
- Timeline aktivitas sesi (urutan event — bukti trajectory berpikir)
- Tabel marker mentah + jawaban 6 langkah + laporan naratif Gemini beserta evidence-nya
- Agregat kelas untuk guru
- **Ekspor dataset**: CSV/JSON log lengkap, marker, dan jawaban, dengan opsi anonimisasi — luaran penelitian penting

## 9. SKEMA DATABASE (SUPABASE)

Tabel minimal: `profiles` (role, jenjang), `classes`, `class_members`, `missions` (jenjang, narasi, dataset JSON, redaksi 6 langkah, konfigurasi formula/chart), `rubrics` (dual-rubric per misi per jenjang), `sessions`, `activity_logs`, `step_answers`, `markers`, `marker_rules`, `ai_reports`. RLS: siswa hanya data sesinya; guru hanya kelasnya; peneliti/admin penuh.

## 10. URUTAN PEMBANGUNAN

1. Setup proyek, Supabase schema + RLS, auth tiga peran, seed misi (termasuk misi utama "Kelas Mana yang Lebih Baik?")
2. Workspace spreadsheet + Panel Misi + Panel Keputusan 6 langkah (tanpa logging dulu, pastikan UX lancar)
3. Sistem logging batch + verifikasi kelengkapan event
4. Agregasi marker rule-based + tabel `markers` + dual-rubric
5. Integrasi Gemini + `ai_reports`
6. Dashboard siswa, dashboard guru/peneliti, ekspor dataset
7. Polish: responsivitas (tablet/Chromebook), empty states, error handling

## 11. KUALITAS & NON-FUNGSIONAL

- Seluruh UI Bahasa Indonesia; istilah statistik mengikuti buku teks Kurikulum Merdeka
- Aksesibilitas dasar (kontras, ukuran teks SD lebih besar)
- Logging tahan koneksi tidak stabil
- README berisi arsitektur, skema event, kerangka teori marker, dan cara menambah misi/rubrik baru

---

## CATATAN (bukan bagian prompt — sudah dikonfirmasi Pak Tomi)

1. Kerangka teori final: **Facione (1990)** sebagai konstruk utama, dioperasionalkan dengan **Wild & Pfannkuch (1999)** dan **Makar & Rubin (2009)** untuk konteks statistik.
2. Misi utama SMA memakai instrumen penelitian asli (Kelas A vs Kelas B, 6 pertanyaan) — Panel Keputusan 6 langkah diturunkan langsung dari instrumen ini.
3. Misi tersebut dipakai lintas SMP/SMA melalui mekanisme dual-rubric.
4. Marker rules konfigurabel karena akan direvisi saat validasi ahli (Tahap 3).
5. Nama produk final: **DECIDA (Decision with Data)**, tagline "Putuskan dengan Data". Di naskah akademik/HKI ditulis: *DECIDA (Decision with Data), a web-based cognitive spreadsheet assessment environment* — dengan istilah Game Spreadsheet Kognitif tetap dipertahankan sebagai konsep sesuai proposal.
