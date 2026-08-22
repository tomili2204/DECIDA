'use client'

import { useState } from 'react'
import { removeStudentAction } from './actions'

export default function RemoveStudentButton({ classId, studentId, studentName }: { classId: string, studentId: string, studentName: string }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleRemove() {
    if (!confirm(`Apakah Anda yakin ingin mengeluarkan ${studentName} dari kelas ini? Semua data sesi mereka di kelas ini akan ikut terhapus.`)) return
    
    setIsDeleting(true)
    try {
      await removeStudentAction(classId, studentId)
    } catch (e) {
      alert('Gagal mengeluarkan mahasiswa.')
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={isDeleting}
      className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50"
    >
      {isDeleting ? 'Mengeluarkan...' : 'Keluarkan'}
    </button>
  )
}
