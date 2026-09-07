import { useState, useCallback, useEffect } from 'react'
import type { SyntheticEvent } from 'react'
import type { ProcessedChartData } from './useChartData'

export interface ChartInteractionState {
  crosshair: { x: string | number; y: number } | null
  tooltipData: ProcessedChartData | null
  mousePosition: { x: number; y: number } | null
  tooltipPosition: 'left' | 'right'
}

// Shape of the state recharts passes to chart-level mouse handlers
export interface ChartMouseState {
  activeLabel?: string | number
  activeIndex?: string | number | null
  activePayload?: Array<{ value?: unknown; payload?: ProcessedChartData }>
}

export type ChartMouseMoveHandler = (
  e: ChartMouseState,
  event?: SyntheticEvent
) => void

export function useChartInteractions(chartData: ProcessedChartData[]) {
  const [crosshair, setCrosshair] = useState<{ x: string | number; y: number } | null>(null)
  const [tooltipData, setTooltipData] = useState<ProcessedChartData | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<'left' | 'right'>('left')

  // Check for crosshair/tooltip collision and update position
  useEffect(() => {
    if (crosshair && tooltipData && mousePosition) {
      const tooltipBounds = {
        left: 16,
        right: 16 + 128,
        top: 172,
        bottom: 172 + 80
      }
      
      const isMouseInTooltipArea = mousePosition.x >= tooltipBounds.left && 
                                   mousePosition.x <= tooltipBounds.right &&
                                   mousePosition.y >= tooltipBounds.top && 
                                   mousePosition.y <= tooltipBounds.bottom
      
      const isMouseInLeftSide = mousePosition.x < 200
      
      setTooltipPosition((isMouseInTooltipArea || isMouseInLeftSide) ? 'right' : 'left')
    } else {
      setTooltipPosition('left')
    }
  }, [crosshair, tooltipData, mousePosition])

  // Throttled mouse position update to prevent excessive re-renders
  const updateMousePosition = useCallback((x: number, y: number) => {
    setMousePosition(prev => {
      if (!prev || Math.abs(prev.x - x) > 10 || Math.abs(prev.y - y) > 10) {
        return { x, y }
      }
      return prev
    })
  }, [])

  // Handle mouse events for crosshair - optimized to prevent unnecessary re-renders
  const handleMouseMove = useCallback<ChartMouseMoveHandler>((e, event) => {
    // Track actual mouse position for tooltip collision detection (throttled)
    if (event && event.nativeEvent instanceof MouseEvent) {
      const rect = (event.currentTarget as Element | null)?.getBoundingClientRect?.()
      if (rect) {
        const x = event.nativeEvent.clientX - rect.left
        const y = event.nativeEvent.clientY - rect.top
        updateMousePosition(x, y)
      }
    }

    let yValue: number | null | undefined = null
    let newX: string | number | null = null
    let newY: number | null = null
    let tooltipPayload: ProcessedChartData | null = null
    
    if (e && e.activeLabel !== undefined) {
      if (e.activePayload && e.activePayload.length > 0) {
        const payloadValue = e.activePayload[0].value
        yValue =
          e.activePayload[0].payload?.price ||
          e.activePayload[0].payload?.close ||
          (typeof payloadValue === 'number' ? payloadValue : undefined)
        newX = e.activeLabel
        newY = yValue ?? null
        tooltipPayload = e.activePayload[0].payload ?? null
      } else if (e.activeIndex !== undefined && e.activeIndex !== null && chartData && chartData.length > 0) {
        const index = typeof e.activeIndex === 'string' ? parseInt(e.activeIndex) : e.activeIndex
        if (index >= 0 && index < chartData.length) {
          const dataPoint = chartData[index]
          yValue = dataPoint.close
          newX = e.activeLabel
          newY = yValue ?? null
          tooltipPayload = dataPoint
        }
      }
      
      if (tooltipPayload && tooltipPayload !== tooltipData) {
        setTooltipData(tooltipPayload)
      }
      
      if (newX !== null && newY !== null && yValue !== null && yValue !== undefined && isFinite(yValue)) {
        if (!crosshair || crosshair.x !== newX || crosshair.y !== newY) {
          const crosshairData = { x: newX, y: newY }
          setCrosshair(crosshairData)
        }
      }
    }
  }, [crosshair, chartData, tooltipData, updateMousePosition])

  const handleMouseLeave = useCallback(() => {
    setCrosshair(null)
    setTooltipData(null)
    setMousePosition(null)
    setTooltipPosition('left')
  }, [])

  return {
    crosshair,
    tooltipData,
    mousePosition,
    tooltipPosition,
    handleMouseMove,
    handleMouseLeave
  }
}