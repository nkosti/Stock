'use client'

import { useState, useMemo, useEffect } from 'react'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart,
  Bar,
  ComposedChart,
  Area,
  AreaChart,
  Cell
} from 'recharts'

interface ChartData {
  Date: string
  Open?: number
  High?: number
  Low?: number
  Close: number
  Volume: number
}

interface EnhancedStockChartProps {
  data: ChartData[]
  symbol: string
  timeframe?: string
  onTimeframeChange?: (newTimeframe: string) => void
}

type ChartType = 'line' | 'area' | 'candlestick'

const timeframeButtons = [
  { key: '1d', label: '1D' },
  { key: '5d', label: '5D' },
  { key: '1mo', label: '1M' },
  { key: '3mo', label: '3M' },
  { key: '6mo', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '2y', label: '2Y' },
  { key: '5y', label: '5Y' },
  { key: 'max', label: 'MAX' }
]

// Custom Candlestick component  
interface CandlestickProps {
  payload?: {
    open: number
    high: number
    low: number
    close: number
  }
  x: number
  y: number
  width: number
  height: number
}

const CustomCandlestick = (props: CandlestickProps) => {
  const { payload, x, y, width, height } = props
  if (!payload || !payload.open || !payload.high || !payload.low || !payload.close) return null

  const { open, high, low, close } = payload
  const isUp = close >= open
  const color = isUp ? '#10b981' : '#ef4444'
  
  const priceRange = high - low
  const scale = height / priceRange
  
  const wickX = x + width / 2
  const highY = y + (high - Math.max(close, open)) * scale
  const lowY = y + height - (Math.min(close, open) - low) * scale
  const bodyTop = y + (high - Math.max(close, open)) * scale
  const bodyBottom = y + (high - Math.min(close, open)) * scale

  return (
    <g>
      {/* Wick */}
      <line
        x1={wickX}
        y1={highY}
        x2={wickX}
        y2={lowY}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x + width * 0.25}
        y={bodyTop}
        width={width * 0.5}
        height={bodyBottom - bodyTop}
        fill={color}
        stroke={color}
      />
    </g>
  )
}

export default function EnhancedStockChart({ data, symbol, timeframe = '1y', onTimeframeChange }: EnhancedStockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)

  // Sync with parent timeframe changes
  useEffect(() => {
    setSelectedTimeframe(timeframe)
  }, [timeframe])

  const handleTimeframeChange = (newTimeframe: string) => {
    setSelectedTimeframe(newTimeframe)
    if (onTimeframeChange) {
      onTimeframeChange(newTimeframe)
    }
  }

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const mappedData = data.map((item, index) => {
      const date = new Date(item.Date)
      let formattedDate: string

      // Format date based on timeframe
      if (selectedTimeframe === '1d') {
        // For 1D timeframe, show time (HH:MM)
        formattedDate = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      } else if (selectedTimeframe === '5d') {
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else if (selectedTimeframe === '1mo' || selectedTimeframe === '3mo') {
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      } else {
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      }

      return {
        date: selectedTimeframe === '1d' ? date.getTime() : formattedDate,
        displayDate: formattedDate,
        fullDate: item.Date,
        price: item.Close,
        open: item.Open,
        high: item.High,
        low: item.Low,
        close: item.Close,
        volume: item.Volume,
        volumeColor: (item.Close >= (item.Open || item.Close)) ? '#10b981' : '#ef4444',
        index
      }
    })

    return mappedData
  }, [data, selectedTimeframe])

  const priceStats = useMemo(() => {
    if (!chartData.length) return null

    const latestPrice = chartData[chartData.length - 1].price
    const firstPrice = chartData[0].price
    const change = latestPrice - firstPrice
    const changePercent = (change / firstPrice) * 100

    return {
      current: latestPrice,
      change,
      changePercent,
      isPositive: change >= 0
    }
  }, [chartData])


  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Chart</h3>
        <div className="text-gray-500 text-center py-8">No chart data available</div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: unknown[]; label?: string }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const date = new Date(data.fullDate)
      const formatDate = () => {
        const day = date.getDate().toString().padStart(2, '0')
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${day}/${month} ${hours}:${minutes}`
      }
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-xs min-w-32">
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="font-medium text-gray-900">Date:</span>
              <span className="text-gray-900">{formatDate()}</span>
            </div>
            {data.open && (
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-900">Open:</span>
                <span className="text-gray-900">${data.open.toFixed(2)}</span>
              </div>
            )}
            {data.high && (
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-900">High:</span>
                <span className="text-green-600">${data.high.toFixed(2)}</span>
              </div>
            )}
            {data.low && (
              <div className="flex justify-between gap-4">
                <span className="font-medium text-gray-900">Low:</span>
                <span className="text-red-600">${data.low.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="font-medium text-gray-900">Close:</span>
              <span className="text-gray-900">${(data.close || data.price).toFixed(2)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="font-medium text-gray-900">Volume:</span>
              <span className="text-gray-900">{data.volume.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6" style={{ 
      outline: 'none',
    }}>
      <style jsx>{`
        div :global(svg) {
          outline: none !important;
        }
        div :global(svg *) {
          outline: none !important;
        }
        div :global(*:focus) {
          outline: none !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{symbol}</h2>
          {priceStats && (
            <div className="flex items-center gap-4 mt-1">
              <span className="text-3xl font-bold text-gray-900">
                ${priceStats.current.toFixed(2)}
              </span>
              <div className={`flex items-center gap-1 ${priceStats.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-lg font-semibold">
                  {priceStats.isPositive ? '+' : ''}${priceStats.change.toFixed(2)}
                </span>
                <span className="text-lg font-semibold">
                  ({priceStats.isPositive ? '+' : ''}{priceStats.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Chart Type Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              chartType === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              chartType === 'area'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Area
          </button>
          {data.some(d => d.Open && d.High && d.Low) && (
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                chartType === 'candlestick'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Candles
            </button>
          )}
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {timeframeButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleTimeframeChange(btn.key)}
            className={`px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              selectedTimeframe === btn.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Main Price Chart */}
      <div className="h-80 outline-none focus:outline-none" style={{ outline: 'none !important' }}>
        <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
          {chartType === 'area' ? (
            <AreaChart 
              data={chartData} 
              margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              syncId="chart"
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={selectedTimeframe === '1d' ? 0 : "preserveStartEnd"}
                angle={0}
                textAnchor="middle"
                type={selectedTimeframe === '1d' ? 'number' : 'category'}
                scale={selectedTimeframe === '1d' ? 'time' : 'auto'}
                domain={selectedTimeframe === '1d' ? ['dataMin', 'dataMax'] : undefined}
                ticks={selectedTimeframe === '1d' ? 
                  (() => {
                    if (chartData.length === 0) return [];
                    const firstTime = chartData[0].date;
                    const lastTime = chartData[chartData.length - 1].date;
                    const ticks = [];
                    // Generate ticks every 15 minutes for 1-minute data
                    for (let time = firstTime; time <= lastTime; time += 15 * 60 * 1000) {
                      const date = new Date(time);
                      // Only show ticks for times ending in :00, :15, :30, :45
                      if (date.getMinutes() % 15 === 0) {
                        ticks.push(time);
                      }
                    }
                    return ticks;
                  })() : undefined
                }
                tickFormatter={selectedTimeframe === '1d' ? 
                  (value) => new Date(value).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }) : undefined
                }
                hide
              />
              <YAxis 
                orientation="right"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 3', 'dataMax + 2']}
                tickFormatter={(value) => {
                  const rounded = Math.round(value * 5) / 5;
                  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
                }}
                axisLine={false}
                tickCount={6}
              />
              <Tooltip 
                content={CustomTooltip} 
                cursor={{ 
                  stroke: '#888', 
                  strokeWidth: 1, 
                  strokeDasharray: '3 3',
                  crosshair: true 
                }} 
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
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              syncId="chart"
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={selectedTimeframe === '1d' ? 0 : "preserveStartEnd"}
                angle={0}
                textAnchor="middle"
                type={selectedTimeframe === '1d' ? 'number' : 'category'}
                scale={selectedTimeframe === '1d' ? 'time' : 'auto'}
                domain={selectedTimeframe === '1d' ? ['dataMin', 'dataMax'] : undefined}
                ticks={selectedTimeframe === '1d' ? 
                  (() => {
                    if (chartData.length === 0) return [];
                    const firstTime = chartData[0].date;
                    const lastTime = chartData[chartData.length - 1].date;
                    const ticks = [];
                    // Generate ticks every 15 minutes for 1-minute data
                    for (let time = firstTime; time <= lastTime; time += 15 * 60 * 1000) {
                      const date = new Date(time);
                      // Only show ticks for times ending in :00, :15, :30, :45
                      if (date.getMinutes() % 15 === 0) {
                        ticks.push(time);
                      }
                    }
                    return ticks;
                  })() : undefined
                }
                tickFormatter={selectedTimeframe === '1d' ? 
                  (value) => new Date(value).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }) : undefined
                }
                hide
              />
              <YAxis 
                orientation="right"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 3', 'dataMax + 2']}
                tickFormatter={(value) => {
                  const rounded = Math.round(value * 5) / 5;
                  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
                }}
                axisLine={false}
                tickCount={6}
              />
              <Tooltip 
                content={CustomTooltip} 
                cursor={{ 
                  stroke: '#888', 
                  strokeWidth: 1, 
                  strokeDasharray: '3 3',
                  crosshair: true 
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          ) : (
            <ComposedChart 
              data={chartData} 
              margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              syncId="chart"
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#e0e0e0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={selectedTimeframe === '1d' ? 0 : "preserveStartEnd"}
                angle={0}
                textAnchor="middle"
                type={selectedTimeframe === '1d' ? 'number' : 'category'}
                scale={selectedTimeframe === '1d' ? 'time' : 'auto'}
                domain={selectedTimeframe === '1d' ? ['dataMin', 'dataMax'] : undefined}
                ticks={selectedTimeframe === '1d' ? 
                  (() => {
                    if (chartData.length === 0) return [];
                    const firstTime = chartData[0].date;
                    const lastTime = chartData[chartData.length - 1].date;
                    const ticks = [];
                    // Generate ticks every 15 minutes for 1-minute data
                    for (let time = firstTime; time <= lastTime; time += 15 * 60 * 1000) {
                      const date = new Date(time);
                      // Only show ticks for times ending in :00, :15, :30, :45
                      if (date.getMinutes() % 15 === 0) {
                        ticks.push(time);
                      }
                    }
                    return ticks;
                  })() : undefined
                }
                tickFormatter={selectedTimeframe === '1d' ? 
                  (value) => new Date(value).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                  }) : undefined
                }
                hide
              />
              <YAxis 
                orientation="right"
                tick={{ fontSize: 12 }}
                domain={['dataMin - 3', 'dataMax + 2']}
                tickFormatter={(value) => {
                  const rounded = Math.round(value * 5) / 5;
                  return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
                }}
                axisLine={false}
                tickCount={6}
              />
              <Tooltip 
                content={CustomTooltip} 
                cursor={{ 
                  stroke: '#888', 
                  strokeWidth: 1, 
                  strokeDasharray: '3 3',
                  crosshair: true 
                }} 
              />
              <Bar 
                dataKey="close" 
                fill="transparent" 
                shape={(props: CandlestickProps) => {
                  const { payload, x, y, width, height } = props;
                  if (!payload || !payload.open || !payload.high || !payload.low || !payload.close) return null;
                  
                  const { open, high, low, close } = payload;
                  const isUp = close >= open;
                  const color = isUp ? '#10b981' : '#ef4444';
                  
                  // For now, use the current value's position and calculate relative positions
                  const currentPrice = close;
                  const baseY = y; // This is the Y position for the close price
                  
                  // Calculate relative positions based on price differences
                  // This is an approximation - we'll need to refine this
                  const pricePerPixel = 0.1; // Rough estimate, needs refinement
                  
                  const openY = baseY + (currentPrice - open) / pricePerPixel;
                  const closeY = baseY;
                  const highY = baseY + (currentPrice - high) / pricePerPixel;
                  const lowY = baseY + (currentPrice - low) / pricePerPixel;
                  
                  const wickX = x + width / 2;
                  const bodyTop = Math.min(openY, closeY);
                  const bodyHeight = Math.abs(openY - closeY);
                  
                  return (
                    <g>
                      {/* Wick */}
                      <line
                        x1={wickX}
                        y1={highY}
                        x2={wickX}
                        y2={lowY}
                        stroke={color}
                        strokeWidth={1}
                      />
                      {/* Body */}
                      <rect
                        x={x + width * 0.25}
                        y={bodyTop}
                        width={width * 0.5}
                        height={Math.max(bodyHeight, 2)}
                        fill={color}
                        stroke={color}
                      />
                    </g>
                  );
                }} 
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="h-24 outline-none focus:outline-none" style={{ outline: 'none !important' }}>
        <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
          <BarChart 
            data={chartData} 
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            syncId="chart"
          >
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={selectedTimeframe === '1d' ? 0 : "preserveStartEnd"}
              type={selectedTimeframe === '1d' ? 'number' : 'category'}
              scale={selectedTimeframe === '1d' ? 'time' : 'auto'}
              domain={selectedTimeframe === '1d' ? ['dataMin', 'dataMax'] : undefined}
              ticks={selectedTimeframe === '1d' ? 
                (() => {
                  if (chartData.length === 0) return [];
                  const firstTime = chartData[0].date;
                  const lastTime = chartData[chartData.length - 1].date;
                  const ticks = [];
                  // Generate ticks every 30 minutes
                  for (let time = firstTime; time <= lastTime; time += 30 * 60 * 1000) {
                    const date = new Date(time);
                    // Only show ticks for times ending in :00 or :30
                    if (date.getMinutes() === 0 || date.getMinutes() === 30) {
                      ticks.push(time);
                    }
                  }
                  return ticks;
                })() : undefined
              }
              tickFormatter={selectedTimeframe === '1d' ? 
                (value) => new Date(value).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                }) : undefined
              }
            />
            <YAxis 
              orientation="right"
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              axisLine={false}
            />
            <Tooltip content={() => null} />
            <Bar dataKey="volume" opacity={0.8}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.volumeColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Volume chart directly below price chart</span>
        <span>Real-time data may be delayed</span>
      </div>
    </div>
  )
}