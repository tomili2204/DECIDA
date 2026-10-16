'use client'

import { useState } from 'react'

export default function TeacherLogin() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      const res = await fetch('/api/login/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole: 'teacher' }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Email atau kata sandi tidak sesuai.')
        setLoading(false)
        return
      }

      window.location.href = data.redirectTo || '/teacher/dashboard'
    } catch (err: any) {
      setError(`Gagal terhubung ke server: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-1/4 w-full max-w-lg h-64 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-300 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-teal-500/30">
            D
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">Portal Dosen</h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Gunakan kredensial institusi Anda
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
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email Akademik</label>
              <input name="email" type="email" required defaultValue="dosen@decida.id"
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Kata Sandi</label>
              <input name="password" type="password" required defaultValue="dosen123"
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all outline-none" />
            </div>
            
            <button type="submit" disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-70 disabled:hover:bg-teal-600 text-sm font-bold transition-all shadow-md shadow-teal-600/20">
              {loading ? 'Memproses...' : 'Masuk ke Dasbor'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <a href="/login" className="text-sm font-medium text-slate-400 hover:text-teal-600 transition-colors">
              &larr; Kembali ke Pilihan Peran
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
