'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import type { EnhancedStockChartProps, ChartType } from '@/types'
import { useChartData } from '@/hooks/useChartData'
import { useChartInteractions } from '@/hooks/useChartInteractions'
import ChartHeader from './ChartHeader'
import ChartControls from './ChartControls'
import PriceChart from './PriceChart'
import VolumeChart from './VolumeChart'
import StaticTooltip, { formatVolume } from './StaticTooltip'

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
  const { crosshair, tooltipData, tooltipPosition, pointer, volumePointer, handleMouseMove, handleVolumeMouseMove, handleMouseLeave } = useChartInteractions(chartData)
  const priceAreaRef = useRef<HTMLDivElement>(null)
  const volumeAreaRef = useRef<HTMLDivElement>(null)

  // Y-axis domain mirror of the chart config: dataMin * 0.99 .. dataMax * 1.01
  const priceDomain = useMemo<[number, number] | null>(() => {
    if (!chartData.length) return null
    const values = chartType === 'candlestick'
      ? chartData.flatMap(d => [d.price, d.high, d.low])
      : chartData.map(d => d.price)
    return [Math.min(...values) * 0.99, Math.max(...values) * 1.01]
  }, [chartData, chartType])

  // Price at the mouse height, derived from the plot geometry (5px chart margins)
  const pointerPrice = useMemo(() => {
    if (!pointer || !priceDomain) return null
    const height = priceAreaRef.current?.clientHeight ?? 320
    const plotTop = 5
    const plotHeight = height - 10
    if (plotHeight <= 0) return null
    const [minD, maxD] = priceDomain
    const price = maxD - ((pointer.y - plotTop) / plotHeight) * (maxD - minD)
    return Math.min(Math.max(price, minD), maxD)
  }, [pointer, priceDomain])

  const maxVolume = useMemo(
    () => (chartData.length ? Math.max(...chartData.map(d => d.volume)) : 0),
    [chartData]
  )

  // Volume at the mouse height on the volume pane (5px margins + 30px x-axis strip)
  const pointerVolume = useMemo(() => {
    if (!volumePointer || !maxVolume) return null
    const height = volumeAreaRef.current?.clientHeight ?? 96
    const plotTop = 5
    const plotHeight = height - 5 - 30 - plotTop
    if (plotHeight <= 0) return null
    const volume = maxVolume * (1 - (volumePointer.y - plotTop) / plotHeight)
    return Math.min(Math.max(volume, 0), maxVolume)
  }, [volumePointer, maxVolume])
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

      <div ref={priceAreaRef} className="relative h-80 outline-none focus:outline-none" style={{ outline: 'none !important' }}>
        <PriceChart
          data={chartData}
          chartType={chartType}
          selectedTimeframe={selectedTimeframe}
          crosshair={crosshair}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {pointer && (
          <>
            {/* Free horizontal crosshair at the mouse height */}
            <div
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-500/70"
              style={{ top: pointer.y }}
            />
            {pointerPrice !== null && (
              <div
                className="pointer-events-none absolute right-0 -translate-y-1/2 rounded bg-slate-600 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums"
                style={{ top: pointer.y }}
              >
                ${pointerPrice.toFixed(2)}
              </div>
            )}
          </>
        )}
      </div>

      <div ref={volumeAreaRef} className="relative h-24 outline-none focus:outline-none" style={{ outline: 'none !important' }}>
        <VolumeChart
          data={chartData}
          activeDate={crosshair?.x ?? null}
          onMouseMove={handleVolumeMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {volumePointer && (
          <>
            {/* Free horizontal crosshair at the mouse height on the volume pane */}
            <div
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-500/70"
              style={{ top: volumePointer.y }}
            />
            {pointerVolume !== null && (
              <div
                className="pointer-events-none absolute right-0 -translate-y-1/2 rounded bg-slate-600 px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums"
                style={{ top: volumePointer.y }}
              >
                {formatVolume(pointerVolume)}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500 flex justify-between">
        <span>Volume chart directly below price chart</span>
        <span>Real-time data may be delayed</span>
      </div>
      
      <StaticTooltip tooltipData={tooltipData} tooltipPosition={tooltipPosition} />
    </div>
  )
}