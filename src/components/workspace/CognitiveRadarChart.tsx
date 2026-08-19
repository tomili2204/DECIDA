"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface CognitiveRadarChartProps {
  data: {
    subject: string
    A: number
    fullMark: number
  }[]
}

export default function CognitiveRadarChart({ data }: CognitiveRadarChartProps) {
  return (
    <div className="w-full h-[350px] mt-4 mb-8">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#e0e7ff" strokeOpacity={1} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#4f46e5', fontSize: 11, fontWeight: 600 }} 
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 4]} 
            tick={{ fill: '#6366f1', fontSize: 10 }} 
            tickCount={5}
            axisLine={false}
          />
          <Radar
            name="Profil Kognitif"
            dataKey="A"
            stroke="#6366f1"
            strokeWidth={2}
            fill="#818cf8"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
