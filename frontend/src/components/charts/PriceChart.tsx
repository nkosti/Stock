'use client'

import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts'
import type { ChartType } from '@/types'
import type { ProcessedChartData } from '@/hooks/useChartData'
import type { ChartMouseMoveHandler } from '@/hooks/useChartInteractions'

interface PriceChartProps {
  data: ProcessedChartData[]
  chartType: ChartType
  selectedTimeframe: string
  crosshair: {x: string | number, y: number} | null
  onMouseMove: ChartMouseMoveHandler
  onMouseLeave: () => void
}

export default function PriceChart({
  data,
  chartType,
  selectedTimeframe,
  crosshair,
  onMouseMove,
  onMouseLeave
}: PriceChartProps) {
  const getYAxisTickCount = (timeframe: string) => {
    switch (timeframe) {
      case '2h': return 14
      case '1d': return 12
      default: return 10
    }
  }

  const getXAxisInterval = (dataLength: number) => {
    if (dataLength <= 6) return 0
    return Math.floor(dataLength / 6)
  }

  const CustomTooltip = () => null

  const commonChartProps = {
    data,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
    syncId: "chart",
    onMouseMove,
    onMouseLeave
  }

  // Category axis: every candle occupies one slot, so non-trading hours and
  // overnight gaps don't stretch the chart. The band scale puts line points
  // at slot centers - the same positions the volume bars occupy - so the
  // crosshair and the bar highlight line up on both panes.
  const commonXAxisProps = {
    dataKey: "date",
    tick: { fontSize: 12 },
    interval: getXAxisInterval(data.length),
    angle: 0,
    textAnchor: "middle" as const,
    scale: "band" as const,
    hide: true
  }

  const commonYAxisProps = {
    orientation: "right" as const,
    tick: { fontSize: 12 },
    domain: ['dataMin * 0.99', 'dataMax * 1.01'],
    tickFormatter: (value: number) => `$${value.toFixed(2)}`,
    axisLine: false,
    tickCount: getYAxisTickCount(selectedTimeframe)
  }

  // Date pill pinned to the top of the crosshair line
  const CrosshairDateLabel = (props: { viewBox?: { x?: number; y?: number } }) => {
    if (!crosshair) return null
    const text = String(crosshair.x)
    const x = props.viewBox?.x ?? 0
    const y = props.viewBox?.y ?? 0
    const width = text.length * 6.5 + 14
    return (
      <g>
        <rect
          x={x - width / 2}
          y={y}
          width={width}
          height={18}
          rx={4}
          fill="#475569"
        />
        <text
          x={x}
          y={y + 12.5}
          textAnchor="middle"
          fill="#fff"
          fontSize={11}
          fontWeight={600}
        >
          {text}
        </text>
      </g>
    )
  }

  const renderCrosshair = () => {
    if (!crosshair) return null
    return (
      <>
        <ReferenceLine
          x={crosshair.x}
          stroke="#666"
          strokeDasharray="2 2"
          strokeWidth={1}
          label={<CrosshairDateLabel />}
        />
      </>
    )
  }

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
        <AreaChart {...commonChartProps}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="2 2" 
            stroke="#ddd" 
            strokeOpacity={0.3}
            horizontal={true}
            vertical={false}
          />
          <XAxis {...commonXAxisProps} />
          <YAxis {...commonYAxisProps} />
          <Tooltip content={CustomTooltip} cursor={false} />
          <Area
            type="monotone"
            dataKey="price"
            isAnimationActive={false} 
            stroke="#3b82f6" 
            fillOpacity={1}
            fill="url(#colorPrice)"
            strokeWidth={2}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
          {renderCrosshair()}
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
        <LineChart {...commonChartProps}>
          <CartesianGrid 
            strokeDasharray="2 2" 
            stroke="#ddd" 
            strokeOpacity={0.3}
            horizontal={true}
            vertical={false}
          />
          <XAxis {...commonXAxisProps} />
          <YAxis {...commonYAxisProps} />
          <Tooltip content={CustomTooltip} cursor={false} />
          <Line
            type="monotone"
            dataKey="price"
            isAnimationActive={false} 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
          {renderCrosshair()}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // Candlestick/OHLC view
  return (
    <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
      <LineChart {...commonChartProps}>
        <CartesianGrid 
          strokeDasharray="2 2" 
          stroke="#ddd" 
          strokeOpacity={0.3}
          horizontal={true}
          vertical={false}
        />
        <XAxis {...commonXAxisProps} />
        <YAxis {...commonYAxisProps} />
        <Tooltip content={CustomTooltip} cursor={false} />
        <Line
          type="monotone"
          dataKey="high"
          isAnimationActive={false} 
          stroke="#10b981" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line
          type="monotone"
          dataKey="low"
          isAnimationActive={false} 
          stroke="#ef4444" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line
          type="monotone"
          dataKey="price"
          isAnimationActive={false} 
          stroke="#3b82f6" 
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
        />
        {renderCrosshair()}
      </LineChart>
    </ResponsiveContainer>
  )
}