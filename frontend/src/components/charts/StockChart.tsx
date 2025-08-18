'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const getTimeframeLabel = (timeframe: string): string => {
  const timeframeLabels: { [key: string]: string } = {
    '3h': '3 Hours',
    '1d': '1 Day',
    '5d': '5 Days', 
    '1mo': '1 Month',
    '3mo': '3 Months',
    '6mo': '6 Months', 
    '1y': '1 Year',
    '2y': '2 Years',
    '5y': '5 Years',
    'max': 'All Time'
  }
  return timeframeLabels[timeframe] || timeframe
}

interface StockChartProps {
  data: Array<{
    Date: string
    Close: number
    Volume: number
  }>
  symbol: string
  timeframe?: string
}

interface MinuteData {
  Date: string
  Close: number
  Volume: number
}

export default function StockChart({ data, symbol, timeframe = '1y' }: StockChartProps) {
  const [minuteData, setMinuteData] = useState<MinuteData[]>([])

  // Fetch minute data for hover functionality
  useEffect(() => {
    if (timeframe === '3h') {
      const fetchMinuteData = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/stocks/${symbol}/history?period=1m`)
          if (response.ok) {
            const result = await response.json()
            setMinuteData(result.data)
          }
        } catch (error) {
          console.error('Error fetching minute data:', error)
        }
      }
      fetchMinuteData()
    }
  }, [symbol, timeframe])

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Price Chart</h3>
        <div className="text-gray-500 text-center py-8">No chart data available</div>
      </div>
    )
  }

  // Format data for recharts with improved date formatting
  const chartData = data.map(item => {
    const date = new Date(item.Date)
    let formattedDate: string
    
    // Format date based on timeframe
    if (timeframe === '3h') {
      // For 15-minute data, show time in 24h format (16:15) in Poland timezone
      formattedDate = date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/Warsaw'
      })
    } else if (timeframe === '1d' || timeframe === '5d') {
      // For short periods, show month/day
      formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    } else if (timeframe === '1mo' || timeframe === '3mo') {
      // For medium periods, show month/day
      formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    } else {
      // For longer periods, show month/year
      formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: '2-digit' 
      })
    }
    
    return {
      date: formattedDate,
      fullDate: item.Date,
      price: item.Close,
      volume: item.Volume
    }
  })

  // Calculate custom Y-axis domain and ticks
  const prices = chartData.map(item => item.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  
  // Calculate increment based on price range
  const range = maxPrice - minPrice
  let increment: number
  
  if (range <= 2) {
    increment = 0.2  // Small range: 0.2 increments
  } else if (range <= 5) {
    increment = 0.5  // Medium range: 0.5 increments
  } else if (range <= 20) {
    increment = 1    // Larger range: 1.0 increments
  } else {
    increment = 5    // Very large range: 5.0 increments
  }
  
  // Calculate domain bounds
  const domainMin = Math.floor(minPrice / increment) * increment - increment
  const domainMax = Math.ceil(maxPrice / increment) * increment + increment
  
  // Generate tick array
  const ticks: number[] = []
  for (let value = domainMin; value <= domainMax; value += increment) {
    ticks.push(Number(value.toFixed(1)))
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{symbol} Price Chart ({getTimeframeLabel(timeframe)})</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: timeframe === '3h' ? 10 : 12 }}
              interval={
                timeframe === '3h' ? 0 : // Show all 15-minute interval labels for 3h
                timeframe === '1d' || timeframe === '5d' ? 0 : // Show all days for short periods
                timeframe === '1mo' ? Math.ceil(chartData.length / 6) : // Show ~6 labels for 1 month
                timeframe === '3mo' || timeframe === '6mo' ? Math.ceil(chartData.length / 8) : // Show ~8 labels
                'preserveStartEnd' // For longer periods, show start and end
              }
              angle={0}
              textAnchor="middle"
              height={30}
              includeHidden={true}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              domain={[domainMin, domainMax]}
              ticks={ticks}
              tickFormatter={(value) => `$${Number(value).toFixed(1)}`}
            />
            <Tooltip 
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
              labelFormatter={(label, payload) => {
                if (payload && payload[0] && payload[0].payload.fullDate) {
                  const fullDate = new Date(payload[0].payload.fullDate)
                  if (timeframe === '3h') {
                    const polandDate = fullDate.toLocaleDateString('en-GB', { timeZone: 'Europe/Warsaw' })
                    
                    // Show minute-level data when hovering over 3h timeframe
                    if (minuteData.length > 0) {
                      const hoveredTime = fullDate.getTime()
                      const minuteInterval = minuteData.filter(item => {
                        const itemTime = new Date(item.Date).getTime()
                        const timeDiff = Math.abs(itemTime - hoveredTime)
                        return timeDiff <= 15 * 60 * 1000 // Within 15 minutes
                      }).map(item => {
                        const time = new Date(item.Date).toLocaleTimeString('en-GB', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false,
                          timeZone: 'Europe/Warsaw'
                        })
                        return `${time}: $${item.Close.toFixed(2)}`
                      })
                      
                      if (minuteInterval.length > 0) {
                        return (
                          <div>
                            <div>{polandDate} at {label}</div>
                            <div className="text-xs mt-1 opacity-75">
                              <div>Minute-by-minute data:</div>
                              {minuteInterval.slice(0, 5).map((interval, idx) => (
                                <div key={idx}>{interval}</div>
                              ))}
                              {minuteInterval.length > 5 && <div>...and {minuteInterval.length - 5} more</div>}
                            </div>
                          </div>
                        )
                      }
                    }
                    
                    return `${polandDate} at ${label}`
                  } else {
                    return `Date: ${fullDate.toLocaleDateString()}`
                  }
                }
                return `Date: ${label}`
              }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                color: '#1f2937',
                fontWeight: '500'
              }}
              labelStyle={{
                color: '#374151',
                fontWeight: '600'
              }}
              itemStyle={{
                color: '#059669',
                fontWeight: '600'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#059669" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}