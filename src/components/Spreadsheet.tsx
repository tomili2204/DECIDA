'use client'

import { useState, useCallback } from 'react'

interface SpreadsheetCell {
  value: string | number | null
  formula?: string
  display?: string
}

type SheetData = SpreadsheetCell[][]

const FORMULA_FUNCTIONS: Record<string, (values: number[]) => number> = {
  SUM: (v) => v.reduce((a, b) => a + b, 0),
  AVERAGE: (v) => v.reduce((a, b) => a + b, 0) / v.length,
  MEAN: (v) => v.reduce((a, b) => a + b, 0) / v.length,
  MEDIAN: (v) => {
    const s = [...v].sort((a, b) => a - b)
    const m = Math.floor(s.length / 2)
    return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m]
  },
  MIN: (v) => Math.min(...v),
  MAX: (v) => Math.max(...v),
  COUNT: (v) => v.length,
  STDEV: (v) => {
    const mean = v.reduce((a, b) => a + b, 0) / v.length
    return Math.sqrt(v.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / v.length)
  },
  MODE: (v) => {
    const freq: Record<number, number> = {}
    v.forEach((n) => (freq[n] = (freq[n] || 0) + 1))
    return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])
  },
}

function colLetter(n: number) {
  let s = ''
  while (n >= 0) {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  }
  return s
}

function parseRange(ref: string, data: SheetData): number[] {
  // e.g. A1:A25
  const match = ref.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/)
  if (!match) return []
  const c1 = match[1].charCodeAt(0) - 65
  const r1 = parseInt(match[2]) - 1
  const c2 = match[3].charCodeAt(0) - 65
  const r2 = parseInt(match[4]) - 1
  const vals: number[] = []
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const v = data[r]?.[c]?.value
      if (v !== null && v !== undefined && v !== '') {
        const n = parseFloat(String(v))
        if (!isNaN(n)) vals.push(n)
      }
    }
  }
  return vals
}

function evaluateFormula(formula: string, data: SheetData): string {
  const f = formula.toUpperCase().replace(/\s/g, '')
  for (const fn of Object.keys(FORMULA_FUNCTIONS)) {
    const regex = new RegExp(`${fn}\\(([A-Z]+\\d+:[A-Z]+\\d+)\\)`)
    const match = f.match(regex)
    if (match) {
      const vals = parseRange(match[1], data)
      if (vals.length === 0) return '#NIL!'
      const result = FORMULA_FUNCTIONS[fn](vals)
      return isNaN(result) ? '#HITUNG!' : parseFloat(result.toFixed(4)).toString()
    }
  }
  return '#RUMUS!'
}

interface Props {
  initialData: (string | number | null)[][]
  headers: string[]
  onCellEdit?: (row: number, col: number, oldVal: string | number | null, newVal: string | number | null) => void
  onFormulaUse?: (fn: string, range: string, targetCell: string) => void
  onHighlightCells?: (cells: string[]) => void
}

export default function Spreadsheet({ initialData, headers, onCellEdit, onFormulaUse, onHighlightCells }: Props) {
  const ROWS = 30
  const COLS = headers.length + 3 // extra cols for formulas

  const initSheet = useCallback((): SheetData => {
    const sheet: SheetData = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => ({ value: null }))
    )
    // fill initial data
    initialData.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (r < ROWS && c < COLS) {
          sheet[r][c] = { value: cell }
        }
      })
    })
    return sheet
  }, [initialData, ROWS, COLS])

  const [data, setData] = useState<SheetData>(initSheet)
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null)
  const [editing, setEditing] = useState<{ r: number; c: number } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())

  const getCellDisplay = (cell: SpreadsheetCell) => {
    if (cell.formula) return cell.display ?? ''
    if (cell.value === null || cell.value === undefined) return ''
    return String(cell.value)
  }

  const commitEdit = (r: number, c: number, val: string) => {
    setData((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })))
      if (val.startsWith('=')) {
        const formula = val.slice(1)
        const display = evaluateFormula(formula, next)
        next[r][c] = { value: val, formula, display }
        // detect formula type
        const fnMatch = formula.toUpperCase().match(/^([A-Z]+)\(/)
        if (fnMatch && onFormulaUse) {
          const rangeMatch = formula.match(/([A-Z]+\d+:[A-Z]+\d+)/)
          onFormulaUse(fnMatch[1], rangeMatch?.[1] ?? '', `${colLetter(c)}${r + 1}`)
        }
      } else {
        const oldVal = prev[r][c].value
        const numVal = val === '' ? null : isNaN(Number(val)) ? val : Number(val)
        next[r][c] = { value: numVal }
        if (onCellEdit) onCellEdit(r, c, oldVal, numVal)
      }
      return next
    })
    setEditing(null)
    setEditValue('')
  }

  const startEdit = (r: number, c: number) => {
    const cell = data[r][c]
    setEditing({ r, c })
    setEditValue(cell.formula ? `=${cell.formula}` : getCellDisplay(cell))
  }

  const toggleHighlight = (r: number, c: number) => {
    const key = `${colLetter(c)}${r + 1}`
    setHighlighted((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      if (onHighlightCells) onHighlightCells([...next])
      return next
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Formula bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-sm">
        <span className="text-gray-400 font-mono w-12 text-center">
          {selected ? `${colLetter(selected.c)}${selected.r + 1}` : ''}
        </span>
        <div className="w-px h-4 bg-gray-300" />
        <span className="text-gray-600 font-mono flex-1 truncate">
          {selected ? (data[selected.r][selected.c].formula ? `=${data[selected.r][selected.c].formula}` : getCellDisplay(data[selected.r][selected.c])) : ''}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        <table className="border-collapse text-sm w-full">
          <thead>
            <tr>
              <th className="w-8 min-w-[2rem] bg-gray-100 border border-gray-200 sticky top-0 z-10 text-gray-400 text-xs font-normal"></th>
              {Array.from({ length: COLS }, (_, c) => (
                <th
                  key={c}
                  className="bg-gray-100 border border-gray-200 sticky top-0 z-10 text-gray-500 text-xs font-medium px-2 py-1 min-w-[80px]"
                >
                  {c < headers.length ? (
                    <span className="text-blue-700 font-semibold">{headers[c]}</span>
                  ) : (
                    colLetter(c)
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, r) => (
              <tr key={r}>
                <td className="bg-gray-100 border border-gray-200 text-gray-400 text-xs text-center px-1 select-none">
                  {r + 1}
                </td>
                {Array.from({ length: COLS }, (_, c) => {
                  const cellKey = `${colLetter(c)}${r + 1}`
                  const isSelected = selected?.r === r && selected?.c === c
                  const isEditing = editing?.r === r && editing?.c === c
                  const isHL = highlighted.has(cellKey)
                  const cell = data[r][c]
                  const display = getCellDisplay(cell)
                  const isFormula = !!cell.formula
                  const isError = display.startsWith('#')

                  return (
                    <td
                      key={c}
                      onClick={() => {
                        setSelected({ r, c })
                        setEditing(null)
                      }}
                      onDoubleClick={() => startEdit(r, c)}
                      className={[
                        'border border-gray-200 px-1.5 py-0.5 cursor-cell relative select-none',
                        isSelected ? 'outline outline-2 outline-blue-500 z-10' : '',
                        isHL ? 'bg-yellow-100' : isFormula ? 'bg-blue-50' : '',
                        isError ? 'text-red-500' : isFormula ? 'text-blue-700' : 'text-gray-800',
                      ].join(' ')}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(r, c, editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(r, c, editValue)
                            if (e.key === 'Escape') { setEditing(null); setEditValue('') }
                            if (e.key === 'Tab') {
                              e.preventDefault()
                              commitEdit(r, c, editValue)
                              setSelected({ r, c: c + 1 })
                            }
                          }}
                          className="w-full bg-white outline-none text-gray-800 font-mono"
                        />
                      ) : (
                        <span className={`font-mono ${isFormula ? 'font-medium' : ''}`}>
                          {display}
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hint bar */}
      <div className="px-3 py-1 bg-gray-50 border-t border-gray-200 text-xs text-gray-400">
        Klik dua kali untuk edit • Awali dengan <span className="font-mono bg-gray-100 px-1 rounded">=</span> untuk rumus (contoh: <span className="font-mono bg-gray-100 px-1 rounded">=AVERAGE(A1:A25)</span>)
      </div>
    </div>
  )
}
