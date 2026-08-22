import Link from 'next/link'

export const metadata = {
  title: 'Panduan Penggunaan DECIDA',
}

export default function PanduanPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              D
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-700 tracking-tight">
              DECIDA
            </span>
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-slate-900 px-3 py-2">
              Beranda
            </Link>
            <Link href="/login" className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-full transition-colors shadow-sm">
              Masuk Sistem
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Petunjuk Penggunaan</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Pelajari cara memaksimalkan fitur <i>Cognitive Spreadsheet</i> dan Analisis AI pada DECIDA untuk menunjang proses perkuliahan Anda.
          </p>
        </div>

        <div className="space-y-16">
          
          {/* Panduan Mahasiswa */}
          <section className="scroll-mt-24" id="panduan-mahasiswa">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Petunjuk untuk Mahasiswa</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1. Cara Masuk (Login) Sistem</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Sistem DECIDA menggunakan otentikasi praktis tanpa *password* rumit. Anda <strong>tidak perlu mendaftar atau membuat akun</strong>. 
                    <br /><br />
                    Cukup kunjungi halaman login mahasiswa, lalu ketikkan <strong>Kode Mata Kuliah</strong> (kombinasi 6 huruf/angka yang diberikan oleh Dosen Anda) dan masukkan <strong>Nama Lengkap</strong> Anda. Sistem akan secara otomatis mengenali Anda dan memasukkan Anda ke dalam ruang kelas dosen yang bersangkutan.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">2. Mengerjakan Misi di Ruang Kerja (Workspace)</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Setelah berhasil login, Anda akan masuk ke halaman <i>Workspace</i> yang berisi daftar misi/tugas. Misi ini memiliki tingkat kesulitan mulai dari <strong>Mudah, Sedang, hingga Tinggi</strong>. 
                    <br /><br />
                    Klik tombol <strong>Mulai Misi</strong> untuk membuka <i>Cognitive Spreadsheet</i> interaktif. Anda dapat mengolah data (filter, urutkan, buat tabel pivot/grafik) di sebelah kiri, dan menjawab 6 langkah pertanyaan berpikir kritis (Model Facione) di sebelah kanan. Jangan takut mencoba, karena sistem menilai iterasi dan cara berpikir Anda dari setiap klik yang Anda buat!
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">3. Membaca Laporan Evaluasi AI</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Setelah Anda menekan tombol <strong>Selesai & Kirim</strong> di langkah terakhir, AI (Google Gemini) akan memproses jejak langkah (*trace*) dan jawaban Anda. Setelah selesai, klik tombol <strong>Lihat Hasil Evaluasi</strong> untuk melihat Profil Kognitif Anda. Anda akan mendapatkan radar chart kekuatan Anda, tingkat kemampuan (Perlu Bimbingan s.d Mahir), serta saran/rekomendasi otomatis untuk memperbaiki pola pikir Anda.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Panduan Dosen */}
          <section className="scroll-mt-24" id="panduan-dosen">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Petunjuk untuk Dosen</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1. Membuat Kelas & Misi Baru</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Masuk ke portal Dosen menggunakan email dan kata sandi yang telah didaftarkan oleh Administrator. Di Dasbor, klik <strong>Buat Kelas Baru</strong> untuk membuat ruang kelas virtual. 
                    <br /><br />
                    Selanjutnya, Anda dapat membuat <strong>Misi Baru</strong> di dalam kelas tersebut dengan mengunggah <i>dataset</i> CSV, menuliskan skenario kasus, dan menentukan Tingkat Kesulitan (Mudah, Sedang, Tinggi).
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">2. Memantau Kemajuan Kelas</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Setiap interaksi mahasiswa tercatat secara *real-time*. Di halaman detail Misi, Anda dapat melihat daftar mahasiswa yang sedang mengerjakan misi, yang sudah selesai, maupun yang belum memulai. Anda bisa langsung melihat skor AI mereka yang otomatis diagregasi ke dalam tabel.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">3. Melakukan Intervensi Berbasis AI</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Klik nama mahasiswa yang sudah menyelesaikan misi untuk melihat hasil <strong>Explainable AI</strong>. Anda akan melihat bukti konkret (*evidence*) log klik mahasiswa yang dijadikan dasar penilaian oleh AI, lengkap dengan narasi evaluatif. Gunakan wawasan ini untuk memberikan bimbingan (*scaffolding*) yang tepat sasaran bagi mahasiswa yang masih berada di level "Perlu Bimbingan".
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Panduan Admin */}
          <section className="scroll-mt-24" id="panduan-admin">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Petunjuk untuk Administrator</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1. Manajemen Akun Dosen</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Masuk ke menu <strong>Kelola Pengguna</strong>. Sebagai admin, Anda berwenang membuatkan akun otentikasi awal untuk dosen (dengan email dan password standar). Anda juga dapat menghapus atau memulihkan akun pengguna di seluruh sistem.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">2. Manajemen Parameter AI (Rubrik & Markers)</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Di menu <strong>Kelola Misi</strong>, Admin memegang kendali atas struktur penilaian (Prompt Engineering). Anda dapat melihat dan menyesuaikan <strong>Rubrik JSON</strong> (kriteria dasar dari mudah/sedang/tinggi) serta <strong>Markers AI</strong> yang mendefinisikan aturan logika pelacakan perilaku kognitif apa yang harus ditangkap oleh sistem.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">3. Mengekspor Data Penelitian</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Untuk kebutuhan publikasi atau riset akademis, Admin dapat membuka panel <strong>Ekspor Data (CSV)</strong> di dasbor. Fitur ini akan menyedot keseluruhan dataset interaksi mentah (Digital Cognitive Trace) yang lengkap dengan label <i>timestamp</i> milidetik ke dalam format <code>.csv</code> atau <code>.json</code> yang siap diolah lebih lanjut menggunakan software statistik seperti SPSS, R, atau Python.
                  </p>
                </div>
              </div>
            </div>
          </section>

        </div>
        
        <div className="mt-20 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} DECIDA - Cognitive Spreadsheet System.
        </div>
      </main>
    </div>
  )
}
