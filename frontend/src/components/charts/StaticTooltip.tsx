import type { ProcessedChartData } from '@/hooks/useChartData'

interface StaticTooltipProps {
  tooltipData: ProcessedChartData | null
  tooltipPosition: 'left' | 'right'
}

const formatVolume = (volume: number) => {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`
  return volume.toString()
}

export default function StaticTooltip({ tooltipData, tooltipPosition }: StaticTooltipProps) {
  if (!tooltipData) return null

  const positionClass = tooltipPosition === 'left' ? 'top-43 left-4' : 'top-43 right-4'

  const rows: Array<{ label: string; value: string; className: string }> = [
    { label: 'High', value: `$${tooltipData.high.toFixed(2)}`, className: 'text-green-600' },
    { label: 'Low', value: `$${tooltipData.low.toFixed(2)}`, className: 'text-red-600' },
    { label: 'Open', value: `$${tooltipData.open.toFixed(2)}`, className: 'text-gray-900' },
    { label: 'Close', value: `$${(tooltipData.close || tooltipData.price).toFixed(2)}`, className: 'text-gray-900' },
    { label: 'Volume', value: formatVolume(tooltipData.volume), className: 'text-gray-900' }
  ]

  return (
    <div className={`absolute ${positionClass} bg-white/95 p-2.5 border border-gray-200 rounded-lg shadow-lg text-xs min-w-28 z-10 transition-all duration-300 ease-in-out`}>
      <div className="space-y-0.5">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <span className="font-medium text-gray-500">{row.label}</span>
            <span className={`font-semibold tabular-nums ${row.className}`}>{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
