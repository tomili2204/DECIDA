
'use client'

import { useTransition } from 'react'
import { deleteClassAction } from './actions'

export default function DeleteClassButton({ classId }: { classId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (confirm('Apakah Anda yakin ingin menghapus kelas ini? Semua data mahasiswa di dalamnya akan ikut terhapus.')) {
      startTransition(async () => {
        try {
          await deleteClassAction(classId)
        } catch (error: any) {
          alert('Gagal menghapus kelas: ' + error.message)
        }
      })
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isPending}
      className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
      title="Hapus Kelas"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </button>
  )
}

