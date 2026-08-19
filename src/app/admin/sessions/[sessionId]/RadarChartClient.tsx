'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts'

interface RadarData {
  indicator: string
  score: number
  level: string
}

export default function RadarChartClient({ data }: { data: RadarData[] }) {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="indicator" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickCount={5} />
          <Tooltip 
            formatter={(value: any, name: any, props: any) => [props.payload.level, 'Level']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Radar name="Mahasiswa" dataKey="score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
