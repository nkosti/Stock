'use client'

import { useState, useEffect } from 'react'
import type { EnhancedStockChartProps, ChartType } from '@/types'
import { useChartData } from '@/hooks/useChartData'
import { useChartInteractions } from '@/hooks/useChartInteractions'
import ChartHeader from './ChartHeader'
import ChartControls from './ChartControls'
import PriceChart from './PriceChart'
import VolumeChart from './VolumeChart'
import StaticTooltip from './StaticTooltip'

export default function EnhancedStockChart({ data, symbol, timeframe = '1mo', onTimeframeChange }: EnhancedStockChartProps) {
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

  // Use custom hooks for data processing and interactions
  const { chartData, priceStats } = useChartData(data, selectedTimeframe)
  const { crosshair, tooltipData, tooltipPosition, handleMouseMove, handleMouseLeave } = useChartInteractions(chartData)
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Financial Chart</h3>
        <div className="text-gray-500 text-center py-8">No chart data available</div>
      </div>
    )
  }

  if (!priceStats) return null

  const showCandlestick = data.some(d => d.Open && d.High && d.Low)

  return (
    <div className="relative bg-white rounded-lg shadow-lg border border-slate-200 p-6" style={{ 
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
      
      <ChartHeader
        symbol={symbol}
        currentPrice={priceStats.current}
        priceChange={priceStats.change}
        changePercent={priceStats.changePercent}
        isPositive={priceStats.isPositive}
        chartType={chartType}
        onChartTypeChange={setChartType}
        showCandlestick={showCandlestick}
      />

      <ChartControls
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={handleTimeframeChange}
      />

      <div className="h-80 outline-none focus:outline-none" style={{ outline: 'none !important' }}>
        <PriceChart
          data={chartData}
          chartType={chartType}
          selectedTimeframe={selectedTimeframe}
          crosshair={crosshair}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      <div className="h-24 outline-none focus:outline-none" style={{ outline: 'none !important' }}>
        <VolumeChart data={chartData} />
      </div>

      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Volume chart directly below price chart</span>
        <span>Real-time data may be delayed</span>
      </div>
      
      <StaticTooltip tooltipData={tooltipData} tooltipPosition={tooltipPosition} />
    </div>
  )
}