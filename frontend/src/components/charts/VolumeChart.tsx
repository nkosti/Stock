'use client'

import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from 'recharts'

import type { ProcessedChartData } from '@/hooks/useChartData'
import type { ChartMouseMoveHandler } from '@/hooks/useChartInteractions'

interface VolumeChartProps {
  data: ProcessedChartData[]
  activeDate: string | number | null
  onMouseMove: ChartMouseMoveHandler
  onMouseLeave: () => void
}

// Hovered bar gets a darker shade of its own color
const ACTIVE_FILL: Record<string, string> = {
  '#10b981': '#047857',
  '#ef4444': '#b91c1c'
}

export default function VolumeChart({ data, activeDate, onMouseMove, onMouseLeave }: VolumeChartProps) {
  const getXAxisInterval = (dataLength: number) => {
    if (dataLength <= 6) return 0
    return Math.floor(dataLength / 6)
  }

  return (
    <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        syncId="chart"
        barCategoryGap="15%"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          interval={getXAxisInterval(data.length)}
        />
        <YAxis 
          orientation="right"
          tick={{ fontSize: 10 }}
          tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
          axisLine={false}
        />
        {/* Faint slot tint; the hovered bar itself is emphasized via its fill */}
        <Tooltip content={() => null} cursor={{ fill: '#94a3b8', fillOpacity: 0.1 }} />
        <Bar dataKey="volume" opacity={0.8} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.date === activeDate
                  ? ACTIVE_FILL[entry.volumeColor] ?? entry.volumeColor
                  : entry.volumeColor
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}