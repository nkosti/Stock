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
  Area,
  AreaChart,
  Cell,
  ReferenceLine
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
  { key: '2h', label: '2h' },
  { key: '1d', label: '1d' },
  { key: '2d', label: '2d' },
  { key: '1w', label: '1w' },
  { key: '1mo', label: '1m' },
  { key: '3mo', label: '3m' },
  { key: '6mo', label: '6m' },
  { key: '1y', label: '1y' },
  { key: '2y', label: '2y' },
  { key: '5y', label: '5y' },
  { key: 'max', label: 'Max' }
]


export default function EnhancedStockChart({ data, symbol, timeframe = '1mo', onTimeframeChange }: EnhancedStockChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line')
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  const [crosshair, setCrosshair] = useState<{x: string | number, y: number} | null>(null)

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

  // Get Y-axis label count based on interval
  const getYAxisTickCount = (timeframe: string) => {
    switch (timeframe) {
      case '2h': return 14
      case '1d': return 12
      default: return 10
    }
  }

  // Get X-axis configuration for 6 evenly distributed labels
  const getXAxisInterval = (dataLength: number) => {
    if (dataLength <= 6) return 0
    return Math.floor(dataLength / 6)
  }

  // Handle mouse events for crosshair
  const handleMouseMove = (e: {activeLabel?: string | number; activePayload?: any[]; activeIndex?: string | number}) => {
    // Try to get data from activePayload first, then fall back to using activeIndex
    let yValue = null
    let crosshairData = null
    
    if (e && e.activeLabel !== undefined) {
      if (e.activePayload && e.activePayload.length > 0) {
        // Standard approach - use activePayload
        yValue = e.activePayload[0].payload?.price || e.activePayload[0].payload?.close || e.activePayload[0].value
        crosshairData = {
          x: e.activeLabel,
          y: yValue
        }
      } else if (e.activeIndex !== undefined && chartData && chartData.length > 0) {
        // Fallback approach - use activeIndex to get data directly
        const index = parseInt(e.activeIndex)
        if (index >= 0 && index < chartData.length) {
          const dataPoint = chartData[index]
          yValue = dataPoint.price || dataPoint.close
          crosshairData = {
            x: e.activeLabel,
            y: yValue
          }
        }
      }
      
      if (crosshairData && yValue !== null && yValue !== undefined && isFinite(yValue)) {
        setCrosshair(crosshairData)
        console.log(`Crosshair positioned at: x=${crosshairData.x}, y=$${yValue.toFixed(2)}`, {
          symbol,
          timeframe: selectedTimeframe,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

  const handleMouseLeave = () => {
    setCrosshair(null)
    console.log(`Crosshair cleared for ${symbol}`, {
      symbol,
      timeframe: selectedTimeframe,
      timestamp: new Date().toISOString()
    })
  }

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const mappedData = data.map((item, index) => {
      const date = new Date(item.Date)
      let formattedDate: string

      // Format date based on timeframe
      if (['2h', '1d', '2d'].includes(selectedTimeframe)) {
        // For intraday views (2h, 1d, 2d), show hours
        formattedDate = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      } else {
        // For longer ranges, show dates
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }

      return {
        date: ['2h', '1d', '2d'].includes(selectedTimeframe) ? date.getTime() : formattedDate,
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

  const CustomTooltip = ({ active, payload }: {active?: boolean; payload?: any[]; label?: string; coordinate?: any}) => {
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
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              syncId="chart"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
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
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={['2h', '1d', '2d'].includes(selectedTimeframe) ? getXAxisInterval(chartData.length) : getXAxisInterval(chartData.length)}
                angle={0}
                textAnchor="middle"
                type={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'number' : 'category'}
                scale={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'time' : 'auto'}
                domain={['2h', '1d', '2d'].includes(selectedTimeframe) ? ['dataMin', 'dataMax'] : undefined}
                ticks={selectedTimeframe === '1d' ? 
                  (() => {
                    if (chartData.length === 0) return [];
                    const firstTime = Number(chartData[0].date);
                    const lastTime = Number(chartData[chartData.length - 1].date);
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
                tickFormatter={['2h', '1d', '2d'].includes(selectedTimeframe) ? 
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
                domain={['dataMin * 0.99', 'dataMax * 1.01']}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                axisLine={false}
                tickCount={getYAxisTickCount(selectedTimeframe)}
              />
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
              {crosshair && (
                <>
                  <ReferenceLine x={crosshair.x} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
                  <ReferenceLine y={crosshair.y} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
                </>
              )}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              syncId="chart"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#ddd" 
                strokeOpacity={0.3}
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={['2h', '1d', '2d'].includes(selectedTimeframe) ? getXAxisInterval(chartData.length) : getXAxisInterval(chartData.length)}
                angle={0}
                textAnchor="middle"
                type={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'number' : 'category'}
                scale={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'time' : 'auto'}
                domain={['2h', '1d', '2d'].includes(selectedTimeframe) ? ['dataMin', 'dataMax'] : undefined}
                ticks={selectedTimeframe === '1d' ? 
                  (() => {
                    if (chartData.length === 0) return [];
                    const firstTime = Number(chartData[0].date);
                    const lastTime = Number(chartData[chartData.length - 1].date);
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
                tickFormatter={['2h', '1d', '2d'].includes(selectedTimeframe) ? 
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
                domain={['dataMin * 0.99', 'dataMax * 1.01']}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                axisLine={false}
                tickCount={getYAxisTickCount(selectedTimeframe)}
              />
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
              {crosshair && (
                <>
                  <ReferenceLine x={crosshair.x} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
                  <ReferenceLine y={crosshair.y} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
                </>
              )}
            </LineChart>
          ) : (
            <LineChart 
              data={chartData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              syncId="chart"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#ddd" 
                strokeOpacity={0.3}
                horizontal={true}
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval={['2h', '1d', '2d'].includes(selectedTimeframe) ? getXAxisInterval(chartData.length) : getXAxisInterval(chartData.length)}
                angle={0}
                textAnchor="middle"
                type={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'number' : 'category'}
                scale={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'time' : 'auto'}
                domain={['2h', '1d', '2d'].includes(selectedTimeframe) ? ['dataMin', 'dataMax'] : undefined}
                ticks={selectedTimeframe === '1d' ? 
                  (() => {
                    if (chartData.length === 0) return [];
                    const firstTime = Number(chartData[0].date);
                    const lastTime = Number(chartData[chartData.length - 1].date);
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
                tickFormatter={['2h', '1d', '2d'].includes(selectedTimeframe) ? 
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
                domain={['dataMin * 0.99', 'dataMax * 1.01']}
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                axisLine={false}
                tickCount={getYAxisTickCount(selectedTimeframe)}
              />
              <Tooltip 
                content={CustomTooltip}
                cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.8 }}
              />
              {/* Show multiple lines for OHLC data */}
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
              {crosshair && (
                <>
                  <ReferenceLine x={crosshair.x} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
                  <ReferenceLine y={crosshair.y} stroke="#666" strokeDasharray="2 2" strokeWidth={1} />
                </>
              )}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Volume Chart */}
      <div className="h-24 outline-none focus:outline-none" style={{ outline: 'none !important' }}>
        <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
          <BarChart 
            data={chartData} 
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            syncId="chart"
          >
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval={['2h', '1d', '2d'].includes(selectedTimeframe) ? getXAxisInterval(chartData.length) : getXAxisInterval(chartData.length)}
              type={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'number' : 'category'}
              scale={['2h', '1d', '2d'].includes(selectedTimeframe) ? 'time' : 'auto'}
              domain={['2h', '1d', '2d'].includes(selectedTimeframe) ? ['dataMin', 'dataMax'] : undefined}
              tickFormatter={['2h', '1d', '2d'].includes(selectedTimeframe) ? 
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