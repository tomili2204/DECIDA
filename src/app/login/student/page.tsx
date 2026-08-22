'use client'

import { useState, useTransition } from 'react'
import { loginStudent } from '../actions'

export default function StudentLogin() {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const result = await loginStudent(null, formData)
        
        if (result.error) {
          setError(result.error)
          return
        }

        if (result.success && result.redirectTo) {
          setSuccess(true)
          // Instant redirect
          window.location.href = result.redirectTo
        }
      } catch (err: any) {
        setError(`Terjadi kesalahan: ${err.message}`)
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/30">
            M
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">Portal Mahasiswa</h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Masukkan kode kelas dan nama Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-xl py-8 px-8 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                <p className="text-sm font-bold text-red-800">ERROR:</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
                <div className="text-emerald-500">✅</div>
                <p className="text-sm font-medium text-emerald-800">Login berhasil! Mengalihkan...</p>
              </div>
            )}



            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kode Mata Kuliah</label>
              <input name="classCode" type="text" required placeholder="MK-123"
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap</label>
              <input name="name" type="text" required placeholder="Andi"
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none" />
            </div>
            <button type="submit" disabled={isPending || success}
              className="w-full py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:hover:bg-indigo-600 text-sm font-bold transition-all shadow-md shadow-indigo-600/20">
              {isPending ? 'Memproses...' : 'Masuk ke Ruang Kerja'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <a href="/login" className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors">
              &larr; Kembali ke Pilihan Peran
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
