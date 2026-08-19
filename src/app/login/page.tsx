import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <Image 
          src="/login-bg.png" 
          alt="Abstract Background" 
          fill
          priority
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply"></div>
        
        <div className="absolute bottom-0 left-0 p-12 text-white z-10 w-full">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-2xl mb-8 shadow-lg shadow-teal-500/20">
            D
          </div>
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Keputusan Berbasis Data.<br />
            Penalaran yang Transparan.
          </h2>
          <p className="text-indigo-200 text-lg max-w-md">
            Masuk ke ekosistem DECIDA untuk mulai melacak, menganalisis, dan mengevaluasi pemikiran kritis statistik.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Options */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative bg-slate-50">
        {/* Mobile Logo */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
            D
          </div>
          <span className="font-bold text-slate-800">DECIDA</span>
        </div>

        <div className="max-w-md w-full mx-auto">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Selamat Datang</h1>
            <p className="text-slate-500">Pilih peran akses Anda untuk melanjutkan ke dasbor.</p>
          </div>

          <div className="space-y-4">
            {/* Student Role */}
            <Link 
              href="/login/student" 
              className="group block p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-900/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Mahasiswa</h3>
                  <p className="text-sm text-slate-500">Kerjakan misi dan lihat profil kognitif.</p>
                </div>
                <div className="ml-auto text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                  &rarr;
                </div>
              </div>
            </Link>

            {/* Teacher Role */}
            <Link 
              href="/login/teacher" 
              className="group block p-6 bg-white border border-slate-200 rounded-2xl hover:border-teal-300 hover:shadow-lg hover:shadow-teal-900/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"></path></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Dosen</h3>
                  <p className="text-sm text-slate-500">Pantau kelas dan analitik mahasiswa.</p>
                </div>
                <div className="ml-auto text-slate-300 group-hover:text-teal-600 group-hover:translate-x-1 transition-all">
                  &rarr;
                </div>
              </div>
            </Link>

            {/* Admin Role */}
            <Link 
              href="/login/admin" 
              className="group block p-6 bg-white border border-slate-200 rounded-2xl hover:border-slate-400 hover:shadow-lg hover:shadow-slate-900/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Admin / Peneliti</h3>
                  <p className="text-sm text-slate-500">Kelola misi dan dataset penelitian.</p>
                </div>
                <div className="ml-auto text-slate-300 group-hover:text-slate-800 group-hover:translate-x-1 transition-all">
                  &rarr;
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-12 text-center text-sm text-slate-400">
            <Link href="/" className="hover:text-slate-600 hover:underline">&larr; Kembali ke Beranda</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
