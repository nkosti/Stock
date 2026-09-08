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
  onMouseMove: ChartMouseMoveHandler
  onMouseLeave: () => void
}

export default function VolumeChart({ data, onMouseMove, onMouseLeave }: VolumeChartProps) {
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
        {/* Soft one-slot highlight that follows the crosshair over the bars */}
        <Tooltip content={() => null} cursor={{ fill: '#94a3b8', fillOpacity: 0.25 }} />
        <Bar dataKey="volume" opacity={0.8} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.volumeColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}