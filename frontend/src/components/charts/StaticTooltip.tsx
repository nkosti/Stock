import type { ProcessedChartData } from '@/hooks/useChartData'

interface StaticTooltipProps {
  tooltipData: ProcessedChartData | null
  tooltipPosition: 'left' | 'right'
}

export default function StaticTooltip({ tooltipData, tooltipPosition }: StaticTooltipProps) {
  if (!tooltipData) return null
  
  const positionClass = tooltipPosition === 'left' ? 'top-43 left-4' : 'top-43 right-4'
  
  return (
    <div className={`absolute ${positionClass} bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-xs min-w-32 z-10 transition-all duration-300 ease-in-out`}>
      <div className="space-y-1">
        {tooltipData.open > 0 && (
          <div className="flex justify-between gap-4">
            <span className="font-medium text-gray-900">Open:</span>
            <span className="text-gray-900">${tooltipData.open.toFixed(2)}</span>
          </div>
        )}
        {tooltipData.high > 0 && (
          <div className="flex justify-between gap-4">
            <span className="font-medium text-gray-900">High:</span>
            <span className="text-green-600">${tooltipData.high.toFixed(2)}</span>
          </div>
        )}
        {tooltipData.low > 0 && (
          <div className="flex justify-between gap-4">
            <span className="font-medium text-gray-900">Low:</span>
            <span className="text-red-600">${tooltipData.low.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <span className="font-medium text-gray-900">Close:</span>
          <span className="text-gray-900">${(tooltipData.close || tooltipData.price).toFixed(2)}</span>
        </div>
        {tooltipData.volume > 0 && (
          <div className="flex justify-between gap-4">
            <span className="font-medium text-gray-900">Volume:</span>
            <span className="text-gray-900">{tooltipData.volume.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  )
}