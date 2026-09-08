import { useMemo } from 'react'
import type { ChartData } from '@/types'

export interface ProcessedChartData {
  date: string | number
  displayDate: string
  fullDate: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  volumeColor: string
  index: number
}

export interface PriceStats {
  current: number
  change: number
  changePercent: number
  isPositive: boolean
}

// SVG charts degrade badly beyond a few hundred points (every mouse move
// re-renders the whole series), so long timeframes are downsampled first.
const MAX_CHART_POINTS = 600

export function useChartData(data: ChartData | null, selectedTimeframe: string) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    let sampled = data
    if (data.length > MAX_CHART_POINTS) {
      const stride = Math.ceil(data.length / MAX_CHART_POINTS)
      sampled = data.filter(
        (_, i) => i % stride === 0 || i === data.length - 1
      )
    }

    const mappedData = sampled.map((item, index) => {
      const date = new Date(item.Date)
      let formattedDate: string

      if (['2h', '1d', '2d', '1w', '1mo', '3mo'].includes(selectedTimeframe)) {
        const time = date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
        // Multi-session timeframes prefix the day so labels stay unique;
        // duplicate category labels break the crosshair and active-dot lookup
        formattedDate = ['2h', '1d'].includes(selectedTimeframe)
          ? time
          : `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time}`
      } else if (['2y', '5y', 'max'].includes(selectedTimeframe)) {
        // Include the year: month-day labels repeat across years, which both
        // confuses readers and breaks the category-based crosshair lookup
        formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          year: selectedTimeframe === '2y' ? '2-digit' : 'numeric',
          ...(selectedTimeframe === '2y' ? { day: 'numeric' } : {})
        })
      } else {
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }

      return {
        // Category value: index-position based, so non-trading hours and
        // overnight gaps don't stretch the time axis
        date: formattedDate,
        displayDate: formattedDate,
        fullDate: item.Date,
        price: item.Close,
        open: item.Open || item.Close,
        high: item.High || item.Close,
        low: item.Low || item.Close,
        close: item.Close,
        volume: item.Volume,
        volumeColor: (item.Close >= (item.Open || item.Close)) ? '#10b981' : '#ef4444',
        index
      }
    })

    // Category values must be unique: duplicate labels collapse in the band
    // scale and produce NaN tick coordinates. Repeats get invisible
    // zero-width-space suffixes - identical on screen, distinct for the scale.
    const seen = new Map<string, number>()
    for (const point of mappedData) {
      const count = seen.get(point.date) ?? 0
      seen.set(point.date, count + 1)
      if (count > 0) {
        point.date = `${point.date}${'\u200B'.repeat(count)}`
      }
    }

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

  return {
    chartData,
    priceStats
  }
}