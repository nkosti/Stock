import type { ChartType } from '@/types'

interface ChartHeaderProps {
  symbol: string
  currentPrice: number
  priceChange: number
  changePercent: number
  isPositive: boolean
  chartType: ChartType
  onChartTypeChange: (type: ChartType) => void
  showCandlestick: boolean
}

export default function ChartHeader({
  symbol,
  currentPrice,
  priceChange,
  changePercent,
  isPositive,
  chartType,
  onChartTypeChange,
  showCandlestick
}: ChartHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{symbol}</h2>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-3xl font-bold text-gray-900">
            ${currentPrice.toFixed(2)}
          </span>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-lg font-semibold">
              {isPositive ? '+' : ''}${priceChange.toFixed(2)}
            </span>
            <span className="text-lg font-semibold">
              ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChartTypeChange('line')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            chartType === 'line'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Line
        </button>
        <button
          onClick={() => onChartTypeChange('area')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            chartType === 'area'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Area
        </button>
        {showCandlestick && (
          <button
            onClick={() => onChartTypeChange('candlestick')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              chartType === 'candlestick'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Candles
          </button>
        )}
      </div>
    </div>
  )
}