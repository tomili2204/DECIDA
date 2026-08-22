'use client'

import { useState } from 'react'

export default function DatasetEditor({ value, onChange }: { value: any[], onChange: (v: any[]) => void }) {
  const [data, setData] = useState<any[]>(Array.isArray(value) && value.length > 0 ? value : [{}])
  
  // Extract all unique keys as columns
  const columns = Array.from(new Set(data.flatMap(Object.keys)))
  if (columns.length === 0) columns.push('kolom_1')

  const updateCell = (rowIndex: number, col: string, val: string) => {
    const newData = [...data]
    // If it's empty string, store it as empty string. 
    // If it's numeric, parse it.
    const parsed = val.trim() === '' ? '' : isNaN(Number(val)) ? val : Number(val)
    newData[rowIndex] = { ...newData[rowIndex], [col]: parsed }
    setData(newData)
    onChange(newData)
  }

  const addRow = () => {
    const newRow: any = {}
    columns.forEach(c => newRow[c] = '')
    const newData = [...data, newRow]
    setData(newData)
    onChange(newData)
  }

  const removeRow = (idx: number) => {
    const newData = data.filter((_, i) => i !== idx)
    setData(newData)
    onChange(newData)
  }

  const addColumn = () => {
    const colName = prompt('Nama kolom baru:')
    if (!colName || columns.includes(colName)) return
    const newData = data.map(r => ({ ...r, [colName]: '' }))
    setData(newData)
    onChange(newData)
  }

  const removeColumn = (col: string) => {
    if (!confirm(`Hapus kolom ${col}?`)) return
    const newData = data.map(r => {
      const copy = { ...r }
      delete copy[col]
      return copy
    })
    setData(newData)
    onChange(newData)
  }

  const renameColumn = (oldCol: string) => {
    const newCol = prompt('Nama kolom baru:', oldCol)
    if (!newCol || newCol === oldCol || columns.includes(newCol)) return
    const newData = data.map(r => {
      const copy = { ...r }
      copy[newCol] = copy[oldCol]
      delete copy[oldCol]
      return copy
    })
    setData(newData)
    onChange(newData)
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-100 border-b border-slate-200 text-slate-700">
            <tr>
              <th className="w-10 p-2 text-center border-r border-slate-200 bg-slate-50">#</th>
              {columns.map(col => (
                <th key={col} className="p-0 border-r border-slate-200 min-w-[120px] font-semibold bg-slate-50">
                  <div className="flex justify-between items-center group px-3 py-2">
                    <span>{col}</span>
                    <div className="hidden group-hover:flex gap-1 ml-2">
                      <button type="button" onClick={() => renameColumn(col)} className="text-blue-500 hover:text-blue-700 p-0.5 bg-white rounded shadow-sm" title="Ganti Nama">✏️</button>
                      <button type="button" onClick={() => removeColumn(col)} className="text-red-500 hover:text-red-700 p-0.5 bg-white rounded shadow-sm" title="Hapus Kolom">❌</button>
                    </div>
                  </div>
                </th>
              ))}
              <th className="p-2 text-center w-12 bg-slate-50">
                <button type="button" onClick={addColumn} className="text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200 rounded p-1 w-full flex justify-center" title="Tambah Kolom">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="p-2 text-center text-slate-400 border-r border-slate-100 text-xs">{rIdx + 1}</td>
                {columns.map(col => (
                  <td key={col} className="border-r border-slate-100 p-0">
                    <input 
                      type="text" 
                      value={row[col] !== undefined && row[col] !== null ? String(row[col]) : ''} 
                      onChange={e => updateCell(rIdx, col, e.target.value)}
                      className="w-full px-3 py-2 bg-transparent outline-none focus:bg-indigo-50/50 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </td>
                ))}
                <td className="p-2 text-center">
                  <button type="button" onClick={() => removeRow(rIdx)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Hapus Baris">
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-50 border-t border-slate-200">
        <button type="button" onClick={addRow} className="text-sm text-indigo-600 font-bold hover:text-indigo-800 flex items-center gap-1.5 transition-colors">
          <div className="bg-indigo-100 p-1 rounded-md">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          </div>
          Tambah Baris Data
        </button>
      </div>
    </div>
  )
}
