'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import type { EnhancedStockChartProps, ChartType } from '@/types'
import { useChartData } from '@/hooks/useChartData'
import { useChartInteractions } from '@/hooks/useChartInteractions'
import ChartHeader from './ChartHeader'
import ChartControls from './ChartControls'
import StockChart, { VOLUME_HEADROOM } from './StockChart'
import StaticTooltip, { formatVolume } from './StaticTooltip'

// Plot geometry mirrors the chart config: 5px chart margins + 30px x-axis strip
const PLOT_TOP = 5
const PLOT_BOTTOM_RESERVED = 5 + 30

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
  const { crosshair, tooltipData, tooltipPosition, pointer, handleMouseMove, handleMouseLeave } = useChartInteractions(chartData)
  const chartAreaRef = useRef<HTMLDivElement>(null)

  // Price axis domain: 2% headroom above, 35% padding below so the price
  // line stays clear of the volume bars sharing the same plot
  const { priceDomain, priceTicks } = useMemo<{
    priceDomain: [number, number] | null
    priceTicks: number[] | null
  }>(() => {
    if (!chartData.length) return { priceDomain: null, priceTicks: null }
    const values = chartType === 'candlestick'
      ? chartData.flatMap(d => [d.price, d.high, d.low])
      : chartData.map(d => d.price)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || max * 0.01 || 1
    // Ticks only inside the actual price range, so no labels bleed into
    // the volume region at the bottom of the shared plot
    const tickCount = 7
    const ticks = Array.from(
      { length: tickCount },
      (_, i) => min + (i * (max - min)) / (tickCount - 1)
    )
    return {
      priceDomain: [min - range * 0.35, max + range * 0.02],
      priceTicks: max > min ? ticks : [min]
    }
  }, [chartData, chartType])

  const maxVolume = useMemo(
    () => (chartData.length ? Math.max(...chartData.map(d => d.volume)) : 0),
    [chartData]
  )

  // Value at the mouse height: a price in the upper region, a volume once
  // the cursor descends into the volume-bar quarter of the plot
  const pointerLabel = useMemo(() => {
    if (!pointer || !priceDomain) return null
    const height = chartAreaRef.current?.clientHeight ?? 416
    const plotHeight = height - PLOT_TOP - PLOT_BOTTOM_RESERVED
    if (plotHeight <= 0) return null
    const fraction = Math.min(Math.max((pointer.y - PLOT_TOP) / plotHeight, 0), 1)
    const volume = maxVolume * VOLUME_HEADROOM * (1 - fraction)
    if (maxVolume > 0 && volume <= maxVolume * 1.02) {
      return formatVolume(Math.max(volume, 0))
    }
    const [minD, maxD] = priceDomain
    const price = maxD - fraction * (maxD - minD)
    return `$${price.toFixed(2)}`
  }, [pointer, priceDomain, maxVolume])

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

      <div ref={chartAreaRef} className="relative h-[26rem] outline-none focus:outline-none" style={{ outline: 'none !important' }}>
        <StockChart
          data={chartData}
          chartType={chartType}
          crosshair={crosshair}
          priceDomain={priceDomain}
          priceTicks={priceTicks}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {/* Subtle static divider between the price and volume regions */}
        <div
          className="pointer-events-none absolute left-0 right-0 border-t border-slate-200/70"
          style={{ top: 'calc(5px + (100% - 40px) * 0.75)' }}
        />
        {pointer && (
          <>
            {/* Free horizontal crosshair at the mouse height */}
            <div
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-500/70"
              style={{ top: pointer.y }}
            />
            {pointerLabel !== null && (
              <div
                className="pointer-events-none absolute right-0 -translate-y-1/2 rounded bg-slate-600 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums"
                style={{ top: pointer.y }}
              >
                {pointerLabel}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Price with trading volume overlay</span>
        <span>Real-time data may be delayed</span>
      </div>

      <StaticTooltip tooltipData={tooltipData} tooltipPosition={tooltipPosition} />
    </div>
  )
}
