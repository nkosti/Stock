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

export function useChartData(data: ChartData | null, selectedTimeframe: string) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const mappedData = data.map((item, index) => {
      const date = new Date(item.Date)
      let formattedDate: string

      if (['2h', '1d', '2d'].includes(selectedTimeframe)) {
        formattedDate = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      } else {
        formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }

      return {
        date: ['2h', '1d', '2d'].includes(selectedTimeframe) ? date.getTime() : formattedDate,
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