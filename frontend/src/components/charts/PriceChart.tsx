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

  const commonXAxisProps = {
    dataKey: "date",
    tick: { fontSize: 12 },
    interval: ['2h', '1d', '2d'].includes(selectedTimeframe) ? getXAxisInterval(data.length) : getXAxisInterval(data.length),
    angle: 0,
    textAnchor: "middle" as const,
    type: ['2h', '1d', '2d'].includes(selectedTimeframe) ? 'number' as const : 'category' as const,
    scale: ['2h', '1d', '2d'].includes(selectedTimeframe) ? 'time' as const : 'auto' as const,
    domain: ['2h', '1d', '2d'].includes(selectedTimeframe) ? ['dataMin', 'dataMax'] : undefined,
    ticks: selectedTimeframe === '1d' ? 
      (() => {
        if (data.length === 0) return [];
        const firstTime = Number(data[0].date);
        const lastTime = Number(data[data.length - 1].date);
        const ticks = [];
        for (let time = firstTime; time <= lastTime; time += 15 * 60 * 1000) {
          const date = new Date(time);
          if (date.getMinutes() % 15 === 0) {
            ticks.push(time);
          }
        }
        return ticks;
      })() : undefined,
    tickFormatter: ['2h', '1d', '2d'].includes(selectedTimeframe) ?
      (value: number | string) => new Date(Number(value)).toLocaleTimeString('en-US', {
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }) : undefined,
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

  const renderCrosshair = () => {
    if (!crosshair) return null
    return (
      <>
        <ReferenceLine x={crosshair.x} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
        <ReferenceLine y={crosshair.y} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
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
          <Tooltip 
            content={CustomTooltip}
            cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.8 }}
          />
          <Area 
            type="monotone" 
            dataKey="price" 
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
          <Tooltip 
            content={CustomTooltip}
            cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.8 }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
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
        <Tooltip 
          content={CustomTooltip}
          cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.8 }}
        />
        <Line 
          type="monotone" 
          dataKey="high" 
          stroke="#10b981" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line 
          type="monotone" 
          dataKey="low" 
          stroke="#ef4444" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line 
          type="monotone" 
          dataKey="price" 
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