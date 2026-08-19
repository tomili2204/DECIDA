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
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">Panduan Penggunaan</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Pelajari cara memaksimalkan fitur <i>Cognitive Spreadsheet</i> dan Analitik AI pada DECIDA untuk menunjang perkuliahan Anda.
          </p>
        </div>

        <div className="space-y-16">
          
          {/* Panduan Mahasiswa */}
          <section className="scroll-mt-24" id="panduan-mahasiswa">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Panduan untuk Mahasiswa</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1. Cara Masuk (Login)</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Sistem menggunakan metode masuk berbasis kelas tertutup (*Closed System*). Anda <strong>tidak perlu membuat akun baru</strong>. Cukup masukkan <strong>Kode Mata Kuliah</strong> (yang diberikan oleh Dosen Anda) dan ketik <strong>Nama Lengkap</strong> Anda secara identik.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">2. Menggunakan Spreadsheet Kognitif</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Setelah berhasil masuk, Anda akan diberikan sebuah misi/soal statistik. Gunakan fitur *Spreadsheet* di layar untuk memanipulasi data (mengurutkan, memfilter, menghitung rumus, dan membuat grafik). <strong>Semua klik dan tindakan Anda direkam oleh sistem</strong> untuk dianalisis oleh AI. Jangan khawatir jika berbuat salah, AI juga menilai proses iterasi Anda!
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">3. Membaca Laporan AI</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Setelah Anda menyelesaikan 6 langkah pertanyaan, sistem akan menyusun Laporan Analitik Kognitif. Anda bisa melihat sejauh mana level pemahaman Anda pada 6 indikator (seperti <i>Problem Representation</i>, <i>Interpretation</i>, dll) beserta rekomendasi perbaikan untuk diri Anda sendiri.
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
              <h2 className="text-2xl font-bold text-slate-900">Panduan untuk Dosen</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1. Membuat Kelas & Membagikan Kode</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Masuk ke portal Dosen (gunakan kredensial dari Administrator). Di Dasbor, klik <strong>Buat Kelas Baru</strong>. Pilih Jenjang/Semester yang sesuai. Setelah terbuat, salin <strong>Kode Kelas (6 karakter)</strong> dan bagikan ke mahasiswa Anda.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">2. Memantau Proses Mahasiswa</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Setiap interaksi mahasiswa tercatat secara *real-time*. Anda bisa melihat persentase penyelesaian kelas dan mengklik nama mahasiswa spesifik untuk melihat riwayat aktivitas mereka di dalam spreadsheet.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">3. Penilaian Kualitatif Otomatis (AI)</h3>
                  <p className="text-slate-600 leading-relaxed">
                    DECIDA menggunakan AI Gemini untuk melakukan asesmen <i>Explainable AI</i>. Pada halaman profil mahasiswa, Anda akan mendapatkan ringkasan naratif, nilai radar chart, dan bukti-bukti jejak (evidence) mengapa mahasiswa tersebut dinilai "Perlu Bimbingan" atau "Mahir" di sebuah indikator.
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
              <h2 className="text-2xl font-bold text-slate-900">Panduan untuk Administrator</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">1. Konfigurasi Misi dan Rubrik</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Masuk ke menu <strong>Kelola Misi</strong>. Administrator bertugas menentukan skenario soal (Misi) baru, mengatur *Dual-Rubrik* JSON untuk standar penilaian Semester Awal/Akhir, dan menentukan *Markers AI* untuk mengatur deteksi *rule-based* pada log sistem.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">2. Manajemen Pengguna</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Gunakan menu <strong>Kelola Pengguna</strong> untuk melakukan pengecekan dan memulihkan akun dosen atau memantau mahasiswa mana saja yang terdaftar di sistem dari waktu ke waktu.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">3. Ekspor Data Penelitian (SPSS)</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Untuk kebutuhan riset akademis, Admin dapat membuka alat <strong>Export ke SPSS (CSV)</strong> di dasbor. Fitur ini akan menarik ribuan log interaksi mentah, jejak *markers*, dan hasil *cognitive score* mahasiswa dari *database* menjadi file berformat <code>.csv</code> yang ramah olah-data.
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
