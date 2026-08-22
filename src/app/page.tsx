import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-300 selection:text-teal-900">
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
              D
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-700 tracking-tight">
              DECIDA
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/panduan" 
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors px-3 py-2"
            >
              Petunjuk Penggunaan
            </Link>
            <Link 
              href="/login" 
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors px-4 py-2 rounded-full hover:bg-indigo-50"
            >
              Masuk ke Sistem &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="relative overflow-hidden bg-slate-900 text-white">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-teal-900 opacity-90"></div>
            {/* Soft glowing orbs */}
            <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/30 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-teal-500/20 blur-[120px] rounded-full"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-sm font-medium mb-6 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-teal-400"></span>
                Platform asesmen berbasis learning analytics
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
                Asesmen berpikir kritis dalam pengambilan keputusan statistik berbantuan <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">AI</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                DECIDA adalah <i>Cognitive Spreadsheet</i> inovatif yang melacak proses pengambilan keputusan mahasiswa dan memberikan analisis kualitatif instan untuk dosen.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  href="/login" 
                  className="px-8 py-4 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-lg transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5"
                >
                  Mulai Akses Dasbor
                </Link>
                <a 
                  href="#features" 
                  className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-lg transition-all border border-white/10 backdrop-blur-sm"
                >
                  Pelajari Fitur
                </a>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative group perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-teal-400/20 rounded-2xl transform rotate-3 scale-105 blur-xl group-hover:rotate-6 group-hover:scale-110 transition-all duration-700"></div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl transform transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-1">
                <Image 
                  src="/hero-illustration.png" 
                  alt="DECIDA Platform Illustration" 
                  width={800} 
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                
                {/* Floating UI Elements */}
                <div className="absolute top-6 right-4 sm:right-6 lg:right-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl transform rotate-3 hover:scale-105 transition-transform cursor-default z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                      <span className="text-teal-400 font-bold text-sm">AI</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-300 font-medium">Analisis Kognitif</p>
                      <p className="text-sm font-bold text-white">Selesai 100%</p>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-10 left-4 sm:left-6 lg:left-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-xl transform -rotate-2 hover:scale-105 transition-transform cursor-default z-10">
                  <p className="text-xs text-slate-300 font-medium mb-2">Performa Kelas</p>
                  <div className="flex gap-2 items-end h-10">
                    <div className="w-3 bg-indigo-500/50 rounded-t h-4 hover:h-6 transition-all"></div>
                    <div className="w-3 bg-indigo-500/70 rounded-t h-6 hover:h-8 transition-all"></div>
                    <div className="w-3 bg-indigo-400 rounded-t h-8 hover:h-10 transition-all"></div>
                    <div className="w-3 bg-teal-400 rounded-t h-10 shadow-[0_0_10px_rgba(45,212,191,0.5)] hover:h-12 transition-all"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Mengapa Menggunakan DECIDA?</h2>
              <p className="text-lg text-slate-600">
                Dirancang khusus untuk kebutuhan akademik perguruan tinggi, menghubungkan analitik data dengan pemahaman kognitif mendalam.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Pelacakan Keputusan</h3>
                <p className="text-slate-600 leading-relaxed">
                  Tidak seperti kuis pilihan ganda biasa, sistem ini merekam setiap jejak langkah analisis data mahasiswa di dalam simulasi <i>spreadsheet</i> interaktif.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-teal-100 hover:shadow-xl hover:shadow-teal-900/5 transition-all group">
                <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Explainable AI</h3>
                <p className="text-slate-600 leading-relaxed">
                  Mesin AI memberikan evaluasi kualitatif berdasarkan taksonomi berpikir kritis Facione, lengkap dengan kutipan bukti yang transparan dan dapat dipertanggungjawabkan.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group">
                <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Dasbor Intervensi Dosen</h3>
                <p className="text-slate-600 leading-relaxed">
                  Dosen dapat memantau profil kognitif kelas secara real-time dan mendapatkan rekomendasi intervensi pedagogik berbasis data yang personal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
              D
            </div>
            <span className="font-semibold text-slate-300">DECIDA Platform &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 items-center">
            <Link href="/panduan" className="text-sm hover:text-white transition-colors">Petunjuk Penggunaan</Link>
            <Image src="/um-logo.png" alt="Universitas Negeri Malang" width={150} height={40} className="h-10 w-auto rounded-lg opacity-90 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </footer>
    </div>
  )
}
