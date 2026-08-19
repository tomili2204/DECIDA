'use client'

import { useState, useCallback, useMemo, useId, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, ResponsiveContainer
} from 'recharts'
import type { Mission, EvidenceLink, ChartDef } from '@/types/workspace'
import { JENJANG_CHART_TYPES, CHART_TYPE_LABELS } from '@/types/workspace'
import { useTelemetry } from '@/lib/telemetry'

// ─────────────────── formula engine ───────────────────

const FN: Record<string, (vals: number[]) => number> = {
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
    return Math.sqrt(v.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / v.length)
  },
  MODE: (v) => {
    const freq: Record<number, number> = {}
    v.forEach((n) => (freq[n] = (freq[n] || 0) + 1))
    return Number(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])
  },
}

type CellVal = string | number | null

interface Cell {
  raw: CellVal
  formula?: string
  display: string
  isHeader?: boolean
}

type Grid = Cell[][]

function colLetter(n: number): string {
  let s = ''
  let idx = n
  while (idx >= 0) {
    s = String.fromCharCode(65 + (idx % 26)) + s
    idx = Math.floor(idx / 26) - 1
  }
  return s
}

function parseRange(ref: string, grid: Grid): number[] {
  const m = ref.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/)
  if (!m) return []
  const c1 = m[1].charCodeAt(0) - 65, r1 = parseInt(m[2]) - 1
  const c2 = m[3].charCodeAt(0) - 65, r2 = parseInt(m[4]) - 1
  const vals: number[] = []
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      const cell = grid[r]?.[c]
      if (!cell) continue
      const v = cell.raw
      if (v !== null && v !== undefined && v !== '') {
        const n = parseFloat(String(v))
        if (!isNaN(n)) vals.push(n)
      }
    }
  }
  return vals
}

function evalFormula(formula: string, grid: Grid): string {
  const f = formula.toUpperCase().replace(/\s/g, '')
  for (const fn of Object.keys(FN)) {
    const rx = new RegExp(`^${fn}\\(([A-Z]+\\d+:[A-Z]+\\d+)\\)$`)
    const m = f.match(rx)
    if (m) {
      const vals = parseRange(m[1], grid)
      if (vals.length === 0) return '#NIL!'
      const res = FN[fn](vals)
      return isNaN(res) ? '#HITUNG!' : parseFloat(res.toFixed(4)).toString()
    }
  }
  return '#RUMUS!'
}

// ─────────────────── dataset → grid ───────────────────

function datasetToGrid(dataset: Record<string, number | null>[], ROWS: number, COLS: number): Grid {
  const headers = dataset.length > 0 ? Object.keys(dataset[0]) : []
  const grid: Grid = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ raw: null, display: '' }))
  )
  // Row 0: header (built into column header UI, not in grid cells themselves)
  // Rows 0..n-1: data
  dataset.forEach((row, r) => {
    headers.forEach((col, c) => {
      if (r < ROWS && c < headers.length) {
        const v = row[col]
        grid[r][c] = { raw: v, display: v === null ? '' : String(v) }
      }
    })
  })
  return grid
}

// ─────────────────── chart colors ───────────────────

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

// ─────────────────── SpreadsheetPanel ───────────────────

interface Props {
  mission: Mission
  onEvidenceLink: (link: EvidenceLink) => void
  onChartAdd: (chart: ChartDef) => void
  onChartRemove: (id: string) => void
  charts: ChartDef[]
  isLinkingMode: boolean
  linkingStep: number | null
  onDataUpdate?: (stats: Record<string, { count: number; hasNull: boolean }>) => void
}

const EXTRA_ROWS = 8
const EXTRA_COLS = 4

export default function SpreadsheetPanel({ mission, onEvidenceLink, onChartAdd, onChartRemove, charts, isLinkingMode, linkingStep, onDataUpdate }: Props) {
  const headers = useMemo(() => mission.dataset.length > 0 ? Object.keys(mission.dataset[0]) : [], [mission.dataset])
  const ROWS = mission.dataset.length + EXTRA_ROWS
  const COLS = headers.length + EXTRA_COLS

  const [grid, setGrid] = useState<Grid>(() => datasetToGrid(mission.dataset, ROWS, COLS))
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null)
  const [editing, setEditing] = useState<{ r: number; c: number } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const [sortState, setSortState] = useState<{ col: number; dir: 'asc' | 'desc' } | null>(null)
  const [filterCol, setFilterCol] = useState<number | null>(null)
  const [filterVal, setFilterVal] = useState('')
  const [activeTab, setActiveTab] = useState<'table' | 'chart'>('table')
  const [showChartBuilder, setShowChartBuilder] = useState(false)
  const { logEvent } = useTelemetry()

  useEffect(() => {
    if (!onDataUpdate) return
    const stats: Record<string, { count: number; hasNull: boolean }> = {}
    headers.forEach((h, c) => {
      let count = 0
      let hasNull = false
      for (let r = 0; r < ROWS; r++) {
        const val = grid[r][c]?.raw
        const hasVal = val !== null && val !== undefined && val !== ''
        if (hasVal && !grid[r][c]?.formula) count++
      }
      stats[h] = { count, hasNull }
    })
    onDataUpdate(stats)
  }, [grid, headers, ROWS, onDataUpdate])

  // Chart builder state
  const [newChart, setNewChart] = useState<Partial<ChartDef>>({ type: 'bar', yCols: [] })
  const uid = useId()

  const getDisplay = (cell: Cell) => cell.display

  const commitEdit = (r: number, c: number, val: string) => {
    setGrid((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })))
      const oldVal = prev[r][c].raw
      if (val.startsWith('=')) {
        const formula = val.slice(1)
        const display = evalFormula(formula, next)
        next[r][c] = { raw: val, formula, display }
        
        // detect formula
        const fnMatch = formula.toUpperCase().match(/^([A-Z]+)\(/)
        const rangeMatch = formula.match(/([A-Z]+\d+:[A-Z]+\d+)/)
        if (fnMatch) {
          setTimeout(() => {
            logEvent('formula_use', { fn: fnMatch[1], range: rangeMatch?.[1] ?? '', target: `${colLetter(c)}${r + 1}` })
          }, 0)
        }
      } else {
        const numVal: CellVal = val === '' ? null : isNaN(Number(val)) ? val : Number(val)
        next[r][c] = { raw: numVal, display: val === '' ? '' : String(numVal) }
        if (oldVal !== numVal) {
          setTimeout(() => {
            logEvent('cell_edit', { cell: `${colLetter(c)}${r + 1}`, old: oldVal, new: numVal })
          }, 0)
        }
      }
      return next
    })
    setEditing(null)
    setEditVal('')
  }

  const handleCellClick = (r: number, c: number) => {
    setSelected({ r, c })
    if (isLinkingMode) {
      const colName = c < headers.length ? headers[c] : colLetter(c)
      const display = grid[r][c].display
      const cellRef = `${colLetter(c)}${r + 1}`
      onEvidenceLink({
        type: display.startsWith('=') || grid[r][c].formula ? 'formula' : 'cell',
        ref: cellRef,
        value: display,
        label: `${colName} baris ${r + 1}${display ? ': ' + display : ''}`,
      })
      // Visual highlight
      setHighlighted((prev) => {
        const next = new Set(prev)
        next.add(cellRef)
        return next
      })
    }
  }

  // Sort data rows (only dataset rows, keep formula rows)
  const handleSort = (col: number, dir: 'asc' | 'desc') => {
    logEvent('data_sort', { column: headers[col] || col, direction: dir })
    setSortState({ col, dir })
    setGrid((prev) => {
      const dataRows = prev.slice(0, mission.dataset.length)
      const extraRows = prev.slice(mission.dataset.length)
      const sorted = [...dataRows].sort((a, b) => {
        const av = parseFloat(String(a[col].raw ?? ''))
        const bv = parseFloat(String(b[col].raw ?? ''))
        if (isNaN(av) && isNaN(bv)) return String(a[col].raw).localeCompare(String(b[col].raw))
        if (isNaN(av)) return 1
        if (isNaN(bv)) return -1
        return dir === 'asc' ? av - bv : bv - av
      })
      return [...sorted, ...extraRows]
    })
  }

  // Filter
  const displayedRows = useMemo(() => {
    if (filterCol === null || filterVal.trim() === '') return Array.from({ length: ROWS }, (_, i) => i)
    return Array.from({ length: ROWS }, (_, i) => i).filter((i) => {
      const cell = grid[i][filterCol]
      return String(cell.display).toLowerCase().includes(filterVal.toLowerCase())
    })
  }, [filterCol, filterVal, grid, ROWS])

  // Chart rendering
  const renderChart = (chart: ChartDef) => {
    const dataRows = mission.dataset
    if (chart.type === 'pie') {
      const col = chart.yCols[0]
      if (!col) return null
      const pieData = dataRows.slice(0, 20).map((row, i) => ({
        name: chart.xCol ? String(row[chart.xCol] ?? i + 1) : `Baris ${i + 1}`,
        value: Number(row[col] ?? 0),
      })).filter((d) => !isNaN(d.value))
      return (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )
    }

    if (chart.type === 'scatter' && chart.xCol && chart.yCols[0]) {
      const scatterData = dataRows.map((row) => ({
        x: Number(row[chart.xCol!] ?? 0),
        y: Number(row[chart.yCols[0]] ?? 0),
      })).filter((d) => !isNaN(d.x) && !isNaN(d.y))
      return (
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name={chart.xCol} />
            <YAxis dataKey="y" name={chart.yCols[0]} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter data={scatterData} fill={COLORS[0]} />
          </ScatterChart>
        </ResponsiveContainer>
      )
    }

    // Bar / Line
    const chartData = dataRows.map((row, i) => {
      const entry: Record<string, number | string> = {
        name: chart.xCol ? String(row[chart.xCol] ?? i + 1) : `${i + 1}`,
      }
      chart.yCols.forEach((col) => { entry[col] = Number(row[col] ?? 0) })
      return entry
    })

    if (chart.type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend />
            {chart.yCols.map((col, i) => (
              <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )
    }

    return (
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend />
          {chart.yCols.map((col, i) => (
            <Bar key={col} dataKey={col} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  const allowedChartTypes = JENJANG_CHART_TYPES[mission.jenjang] ?? JENJANG_CHART_TYPES.SMA

  const handleAddChart = () => {
    if (!newChart.title || !newChart.type || newChart.yCols!.length === 0) return
    onChartAdd({
      id: `chart-${Date.now()}`,
      type: newChart.type as ChartDef['type'],
      title: newChart.title,
      xCol: newChart.xCol,
      yCols: newChart.yCols!,
    })
    // Link as evidence
    onEvidenceLink({
      type: 'chart',
      ref: newChart.title,
      label: `Grafik ${CHART_TYPE_LABELS[newChart.type!]}: ${newChart.title}`,
    })
    setShowChartBuilder(false)
    setNewChart({ type: 'bar', yCols: [] })
    setActiveTab('chart')
  }

  const formulaBarVal = selected
    ? grid[selected.r][selected.c].formula
      ? `=${grid[selected.r][selected.c].formula}`
      : grid[selected.r][selected.c].display
    : ''

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white border-r border-slate-200">
      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-2 flex items-center gap-2 flex-wrap">
        {/* Tabs */}
        <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden text-xs">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 font-medium transition-colors ${activeTab === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            📋 Tabel
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1.5 font-medium transition-colors ${activeTab === 'chart' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            📊 Grafik {charts.length > 0 && <span className="ml-1 bg-indigo-100 text-indigo-700 px-1.5 rounded-full">{charts.length}</span>}
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200" />

        {/* Sort buttons */}
        {activeTab === 'table' && (
          <>
            <span className="text-xs text-slate-400">Urutkan:</span>
            <select
              value={sortState?.col ?? ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  setSortState(null)
                } else {
                  handleSort(parseInt(e.target.value), 'asc')
                }
              }}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 max-w-[120px] truncate outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Pilih kolom</option>
              {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
            </select>
            {sortState !== null && (
              <div className="flex gap-0.5">
                <button
                  onClick={() => handleSort(sortState.col, 'asc')}
                  title="Urutkan A→Z"
                  className={`text-xs px-2 py-1 rounded border transition-colors ${sortState.dir === 'asc' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  ↑
                </button>
                <button
                  onClick={() => handleSort(sortState.col, 'desc')}
                  title="Urutkan Z→A"
                  className={`text-xs px-2 py-1 rounded border transition-colors ${sortState.dir === 'desc' ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  ↓
                </button>
                <button onClick={() => setSortState(null)} className="text-xs text-slate-400 hover:text-red-500 ml-1">✕</button>
              </div>
            )}

            <div className="w-px h-5 bg-slate-200" />

            {/* Filter */}
            <span className="text-xs text-slate-400">Filter:</span>
            <select
              value={filterCol ?? ''}
              onChange={(e) => setFilterCol(e.target.value === '' ? null : parseInt(e.target.value))}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700"
            >
              <option value="">Pilih kolom</option>
              {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
            </select>
            {filterCol !== null && (
              <>
                <input
                  value={filterVal}
                  onChange={(e) => {
                    setFilterVal(e.target.value)
                    if (e.target.value.trim().length > 0) {
                      logEvent('data_filter', { column: headers[filterCol] || filterCol, criteria: e.target.value })
                    }
                  }}
                  placeholder="Nilai filter..."
                  className="text-xs border border-slate-200 rounded px-2 py-1 w-24"
                />
                <button onClick={() => { setFilterCol(null); setFilterVal('') }} className="text-xs text-slate-400 hover:text-red-500">✕</button>
              </>
            )}
          </>
        )}

        {activeTab === 'chart' && (
          <button
            onClick={() => setShowChartBuilder(true)}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            + Buat Grafik
          </button>
        )}

        {isLinkingMode && (
          <div className="ml-auto text-xs bg-amber-50 border border-amber-300 text-amber-700 px-3 py-1.5 rounded-lg font-medium animate-pulse">
            🔗 Klik sel untuk menautkan sebagai bukti
          </div>
        )}
      </div>

      {/* Formula bar */}
      {activeTab === 'table' && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-xs flex-shrink-0">
          <span className="text-slate-400 font-mono w-10 text-center shrink-0">
            {selected ? `${colLetter(selected.c)}${selected.r + 1}` : ''}
          </span>
          <div className="w-px h-3.5 bg-slate-300" />
          <span className="font-mono text-slate-600 truncate">{formulaBarVal || <span className="text-slate-300">Ketik rumus di sel (awali dengan =)</span>}</span>
        </div>
      )}

      {/* Table view */}
      {activeTab === 'table' && (
        <div className="flex-1 overflow-auto">
          <table className="border-collapse text-xs w-max min-w-full">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="w-8 bg-slate-100 border border-slate-200 text-slate-400 text-center py-1.5 font-normal sticky left-0 z-20">#</th>
                {Array.from({ length: COLS }, (_, c) => (
                  <th key={c} className="bg-slate-100 border border-slate-200 text-slate-500 font-medium px-3 py-1.5 min-w-[90px] text-left">
                    {c < headers.length ? (
                      <span className="text-indigo-700 font-bold">{headers[c]}</span>
                    ) : (
                      <span className="text-slate-400">{colLetter(c)}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedRows.map((rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/50">
                  <td className="bg-slate-50 border border-slate-200 text-slate-400 text-center px-1 py-0.5 font-mono sticky left-0">
                    {rowIdx + 1}
                  </td>
                  {Array.from({ length: COLS }, (_, c) => {
                    const cellKey = `${colLetter(c)}${rowIdx + 1}`
                    const isSelected = selected?.r === rowIdx && selected?.c === c
                    const isEditing = editing?.r === rowIdx && editing?.c === c
                    const isHL = highlighted.has(cellKey)
                    const cell = grid[rowIdx][c]
                    const display = getDisplay(cell)
                    const isErr = display.startsWith('#')
                    const isFormula = !!cell.formula

                    return (
                      <td
                        key={c}
                        onClick={() => handleCellClick(rowIdx, c)}
                        onDoubleClick={() => {
                          if (!isLinkingMode) {
                            setEditing({ r: rowIdx, c })
                            setEditVal(cell.formula ? `=${cell.formula}` : display)
                            setSelected({ r: rowIdx, c })
                          }
                        }}
                        className={[
                          'border border-slate-200 px-2 py-0.5 cursor-cell relative transition-colors',
                          isSelected ? 'outline outline-2 outline-indigo-500 z-10 bg-indigo-50' : '',
                          isHL ? 'bg-amber-100 border-amber-400' : '',
                          isFormula && !isHL ? 'bg-blue-50' : '',
                          isErr ? 'text-red-500' : isFormula ? 'text-blue-700 font-medium' : 'text-slate-800',
                          isLinkingMode && c < headers.length ? 'hover:bg-amber-50 cursor-pointer' : '',
                        ].join(' ')}
                        style={{ minWidth: 90 }}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editVal}
                            onChange={(e) => setEditVal(e.target.value)}
                            onBlur={() => commitEdit(rowIdx, c, editVal)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); commitEdit(rowIdx, c, editVal); setSelected({ r: rowIdx + 1, c }) }
                              if (e.key === 'Escape') { setEditing(null); setEditVal('') }
                              if (e.key === 'Tab') { e.preventDefault(); commitEdit(rowIdx, c, editVal); setSelected({ r: rowIdx, c: c + 1 }); setEditing(null) }
                            }}
                            className="w-full bg-white outline-none font-mono text-slate-900 border-0 p-0"
                          />
                        ) : (
                          <span className={`font-mono whitespace-nowrap ${display === '' ? 'text-slate-200' : ''}`}>
                            {display || (rowIdx < mission.dataset.length && c < headers.length ? '' : '')}
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
      )}

      {/* Chart view */}
      {activeTab === 'chart' && (
        <div className="flex-1 overflow-auto p-4">
          {charts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="text-5xl mb-3">📊</div>
              <p className="font-medium text-slate-500 mb-1">Belum ada grafik</p>
              <p className="text-sm mb-4">Buat grafik untuk menganalisis data secara visual.</p>
              <button
                onClick={() => setShowChartBuilder(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                + Buat Grafik Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {charts.map((chart) => (
                <div key={chart.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-700 text-sm">{chart.title}</h3>
                    <div className="flex gap-1">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {CHART_TYPE_LABELS[chart.type]}
                      </span>
                      <button
                        onClick={() => {
                          onEvidenceLink({ type: 'chart', ref: chart.title, label: `Grafik: ${chart.title}` })
                        }}
                        title="Tautkan grafik ini sebagai bukti"
                        className="text-xs text-amber-600 hover:text-amber-800 px-1.5 py-0.5 rounded hover:bg-amber-50 transition-colors"
                      >
                        🔗
                      </button>
                      <button
                        onClick={() => onChartRemove(chart.id)}
                        title="Hapus grafik"
                        className="text-xs text-slate-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {renderChart(chart)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hint bar */}
      {activeTab === 'table' && (
        <div className="flex-shrink-0 px-3 py-1 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 flex items-center gap-3">
          <span>Klik dua kali untuk edit</span>
          <span>·</span>
          <span>Awali dengan <code className="font-mono bg-slate-100 px-1 rounded">=</code> untuk rumus (contoh: <code className="font-mono bg-slate-100 px-1 rounded">=AVERAGE(A1:A25)</code>)</span>
          <span>·</span>
          <span className="text-amber-600">Klik sel saat mode Tautkan Bukti aktif untuk menandainya</span>
        </div>
      )}

      {/* Chart Builder Modal */}
      {showChartBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-800">📊 Buat Grafik Baru</h2>
              <button onClick={() => setShowChartBuilder(false)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Grafik</label>
                <input
                  value={newChart.title ?? ''}
                  onChange={(e) => setNewChart((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Misal: Perbandingan Kelas A dan B"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Grafik</label>
                <div className="flex gap-2 flex-wrap">
                  {allowedChartTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewChart((p) => ({ ...p, type: type as ChartDef['type'] }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${newChart.type === type ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {type === 'bar' ? '📊' : type === 'line' ? '📈' : type === 'pie' ? '🥧' : '⚡'} {CHART_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sumbu X (opsional)</label>
                  <select
                    value={newChart.xCol ?? ''}
                    onChange={(e) => setNewChart((p) => ({ ...p, xCol: e.target.value || undefined }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Nomor urut</option>
                    {headers.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kolom Data (Y) *</label>
                  <div className="space-y-1">
                    {headers.map((h) => (
                      <label key={h} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newChart.yCols?.includes(h) ?? false}
                          onChange={(e) => {
                            setNewChart((p) => ({
                              ...p,
                              yCols: e.target.checked
                                ? [...(p.yCols ?? []), h]
                                : (p.yCols ?? []).filter((c) => c !== h),
                            }))
                          }}
                          className="w-3.5 h-3.5 text-indigo-600"
                        />
                        {h}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {newChart.title && newChart.yCols && newChart.yCols.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-2">
                  <p className="text-xs text-slate-400 text-center mb-1">Preview</p>
                  {renderChart({
                    id: 'preview',
                    type: (newChart.type ?? 'bar') as ChartDef['type'],
                    title: newChart.title ?? '',
                    xCol: newChart.xCol,
                    yCols: newChart.yCols ?? [],
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowChartBuilder(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Batal
              </button>
              <button
                onClick={handleAddChart}
                disabled={!newChart.title || !newChart.yCols?.length}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50"
              >
                Tambahkan Grafik
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
