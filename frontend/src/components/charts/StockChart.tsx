'use client'

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts'
import type { ChartType } from '@/types'
import type { ProcessedChartData } from '@/hooks/useChartData'
import type { ChartMouseMoveHandler } from '@/hooks/useChartInteractions'

// Volume bars live on their own hidden axis with 4x headroom,
// so they occupy roughly the bottom quarter of the shared plot
export const VOLUME_HEADROOM = 4

// Hovered bar gets a darker shade of its own color
const ACTIVE_FILL: Record<string, string> = {
  '#10b981': '#047857',
  '#ef4444': '#b91c1c'
}

interface StockChartProps {
  data: ProcessedChartData[]
  chartType: ChartType
  crosshair: { x: string | number; y: number } | null
  priceDomain: [number, number] | null
  priceTicks: number[] | null
  onMouseMove: ChartMouseMoveHandler
  onMouseLeave: () => void
}

export default function StockChart({
  data,
  chartType,
  crosshair,
  priceDomain,
  priceTicks,
  onMouseMove,
  onMouseLeave
}: StockChartProps) {
  const getXAxisInterval = (dataLength: number) => {
    if (dataLength <= 6) return 0
    return Math.floor(dataLength / 6)
  }

  return (
    <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
      <ComposedChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        {chartType === 'area' && (
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
        )}
        <CartesianGrid
          strokeDasharray="2 2"
          stroke="#ddd"
          strokeOpacity={0.3}
          horizontal={true}
          vertical={false}
        />
        {/* Category axis: every candle occupies one slot, so non-trading hours
            and overnight gaps don't stretch the chart; the band scale keeps
            line points at the same slot centers the volume bars occupy */}
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          interval={getXAxisInterval(data.length)}
          angle={0}
          textAnchor="middle"
          scale="band"
        />
        <YAxis
          yAxisId="price"
          orientation="right"
          tick={{ fontSize: 12 }}
          domain={priceDomain ?? ['auto', 'auto']}
          ticks={priceTicks ?? undefined}
          tickFormatter={(value: number) => `$${value.toFixed(2)}`}
          axisLine={false}
        />
        <YAxis
          yAxisId="volume"
          hide
          domain={[0, (dataMax: number) => dataMax * VOLUME_HEADROOM]}
        />
        <Tooltip content={() => null} cursor={false} />
        {crosshair && (
          <ReferenceLine
            yAxisId="price"
            x={crosshair.x}
            stroke="#666"
            strokeDasharray="2 2"
            strokeWidth={1}
          />
        )}
        <Bar yAxisId="volume" dataKey="volume" opacity={0.8} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.date === crosshair?.x
                  ? ACTIVE_FILL[entry.volumeColor] ?? entry.volumeColor
                  : entry.volumeColor
              }
            />
          ))}
        </Bar>
        {chartType === 'candlestick' && (
          <>
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="high"
              isAnimationActive={false}
              stroke="#10b981"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
            />
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="low"
              isAnimationActive={false}
              stroke="#ef4444"
              strokeWidth={1}
              dot={false}
              strokeDasharray="3 3"
            />
          </>
        )}
        {chartType === 'area' ? (
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="price"
            isAnimationActive={false}
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorPrice)"
            strokeWidth={2}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        ) : (
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="price"
            isAnimationActive={false}
            stroke="#3b82f6"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
