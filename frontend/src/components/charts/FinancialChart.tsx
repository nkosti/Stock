'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

interface ChartData {
  Date: string
  Open?: number
  High?: number
  Low?: number
  Close: number
  Volume: number
}

interface FinancialChartProps {
  data: ChartData[]
  symbol: string
  timeframe?: string
}

type ChartType = 'line' | 'candlestick'

const timeframeButtons = [
  { key: '1D', label: '1D' },
  { key: '5D', label: '5D' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: '2Y', label: '2Y' },
  { key: '5Y', label: '5Y' },
  { key: 'MAX', label: 'MAX' }
]

export default function FinancialChart({ data, symbol, timeframe = '1Y' }: FinancialChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const priceSeriesRef = useRef<any>(null)
  const volumeSeriesRef = useRef<any>(null)
  
  const [chartType, setChartType] = useState<ChartType>('line')
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number | null>(null)
  const [priceChangePercent, setPriceChangePercent] = useState<number | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return

    // Create chart
    const chart: any = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { type: ColorType.Solid, color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#758085',
          style: 2,
        },
        horzLine: {
          width: 1,
          color: '#758085',
          style: 2,
        },
      },
      rightPriceScale: {
        borderColor: '#d1d4dc',
        visible: true,
      },
      timeScale: {
        borderColor: '#d1d4dc',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    chartRef.current = chart

    // Prepare data
    const formatTime = (dateStr: string) => {
      const date = new Date(dateStr)
      return (date.getTime() / 1000)
    }

    // Calculate price statistics
    if (data.length > 0) {
      const latestPrice = data[data.length - 1].Close
      const firstPrice = data[0].Close
      const change = latestPrice - firstPrice
      const changePercent = (change / firstPrice) * 100

      setCurrentPrice(latestPrice)
      setPriceChange(change)
      setPriceChangePercent(changePercent)
    }

    // Create price series based on chart type
    let priceSeries: any

    if (chartType === 'candlestick' && data.some(d => d.Open && d.High && d.Low)) {
      priceSeries = chart.addCandlestickSeries({
        upColor: '#4ade80',
        downColor: '#ef4444',
        borderUpColor: '#4ade80',
        borderDownColor: '#ef4444',
        wickUpColor: '#4ade80',
        wickDownColor: '#ef4444',
      })

      const candlestickData = data
        .filter(d => d.Open && d.High && d.Low)
        .map(d => ({
          time: formatTime(d.Date),
          open: d.Open!,
          high: d.High!,
          low: d.Low!,
          close: d.Close,
        }))

      priceSeries.setData(candlestickData)
    } else {
      priceSeries = chart.addLineSeries({
        color: '#2563eb',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderColor: '#ffffff',
        crosshairMarkerBackgroundColor: '#2563eb',
      })

      const lineData = data.map(d => ({
        time: formatTime(d.Date),
        value: d.Close,
      }))

      priceSeries.setData(lineData)
    }

    priceSeriesRef.current = priceSeries

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: '#9ca3af',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    })

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.7,
        bottom: 0,
      },
    })

    const volumeData = data.map(d => ({
      time: formatTime(d.Date),
      value: d.Volume,
      color: d.Close >= (d.Open || d.Close) ? '#4ade8066' : '#ef444466',
    }))

    volumeSeries.setData(volumeData)
    volumeSeriesRef.current = volumeSeries

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }
    }
  }, [data, chartType])

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Chart</h3>
        <div className="text-gray-500 text-center py-8">No chart data available</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{symbol}</h2>
          <div className="flex items-center gap-4 mt-1">
            {currentPrice && (
              <span className="text-3xl font-bold text-gray-900">
                ${currentPrice.toFixed(2)}
              </span>
            )}
            {priceChange !== null && priceChangePercent !== null && (
              <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span className="text-lg font-semibold">
                  {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}
                </span>
                <span className="text-lg font-semibold">
                  ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
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
            onClick={() => setChartType('candlestick')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              chartType === 'candlestick'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Candles
          </button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {timeframeButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => setSelectedTimeframe(btn.key)}
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

      {/* Chart Container */}
      <div className="relative">
        <div ref={chartContainerRef} className="w-full h-96" />
      </div>

      {/* Chart Info */}
      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Volume included in lower panel</span>
        <span>Real-time data may be delayed</span>
      </div>
    </div>
  )
}