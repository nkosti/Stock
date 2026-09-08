interface ChartControlsProps {
  selectedTimeframe: string
  onTimeframeChange: (timeframe: string) => void
}

const timeframeButtons = [
  { key: '2h', label: '2h' },
  { key: '1d', label: '1d' },
  { key: '2d', label: '2d' },
  { key: '1w', label: '1w' },
  { key: '1mo', label: '1m' },
  { key: '3mo', label: '3m' },
  { key: '6mo', label: '6m' },
  { key: 'ytd', label: 'YTD' },
  { key: '1y', label: '1y' },
  { key: '2y', label: '2y' },
  { key: '5y', label: '5y' },
  { key: 'max', label: 'Max' }
]

export default function ChartControls({ selectedTimeframe, onTimeframeChange }: ChartControlsProps) {
  return (
    <div className="flex gap-1 mb-4 overflow-x-auto">
      {timeframeButtons.map((btn) => (
        <button
          key={btn.key}
          onClick={() => onTimeframeChange(btn.key)}
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
  )
}