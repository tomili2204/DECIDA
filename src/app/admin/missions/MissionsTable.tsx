
'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function MissionsTable({ initialMissions }: { initialMissions: any[] }) {
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(initialMissions.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedMissions = initialMissions.slice(startIndex, startIndex + pageSize)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Tampilkan</span>
          <select 
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="border border-slate-300 rounded px-2 py-1"
          >
            {[10, 20, 30, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>data per halaman</span>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="py-4 px-6 font-semibold text-sm text-slate-600">Judul Misi</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600">Mata Kuliah</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600">Dosen</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600">Tingkat Kesulitan</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600">Dibuat Pada</th>
              <th className="py-4 px-6 font-semibold text-sm text-slate-600">Konfigurasi Parameter AI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedMissions.map((m: any) => (
              <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6 text-slate-800 font-medium">{m.title}</td>
                <td className="py-4 px-6 text-slate-600">{(m.classes as any)?.name || '-'}</td>
                <td className="py-4 px-6 text-slate-600">{(m.profiles as any)?.full_name || '-'}</td>
                <td className="py-4 px-6">
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {m.difficulty || '-'}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-500 text-sm">
                  {new Date(m.created_at).toLocaleDateString('id-ID')}
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    <Link href={"/admin/missions//rubrics"} className="text-xs px-3 py-1.5 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200">
                      Rubrik
                    </Link>
                    <Link href={"/admin/missions//markers"} className="text-xs px-3 py-1.5 bg-white text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200">
                      Markers
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedMissions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada data misi.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <span className="text-sm text-slate-600">
            Menampilkan {startIndex + 1} - {Math.min(startIndex + pageSize, initialMissions.length)} dari {initialMissions.length}
          </span>
          <div className="flex gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
            >
              Sebelumnya
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 text-sm bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
            >
              Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

