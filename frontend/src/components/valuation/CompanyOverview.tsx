import { TrendingUp } from 'lucide-react'
import type { StockData } from '@/types'

interface CompanyOverviewProps {
  stockData: StockData
}

export default function CompanyOverview({ stockData }: CompanyOverviewProps) {
  const formatMarketCap = (marketCap?: number) => {
    if (!marketCap) return 'N/A'
    return `$${(marketCap / 1000000000).toFixed(2)}B`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="h-6 w-6 text-emerald-600" />
        <h2 className="text-2xl font-bold text-blue-900">
          {stockData.company_name} ({stockData.symbol})
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-slate-600">Sector</p>
          <p className="font-semibold text-slate-900">{stockData.sector || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Industry</p>
          <p className="font-semibold text-slate-900">{stockData.industry || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-slate-600">Market Cap</p>
          <p className="font-semibold text-slate-900">{formatMarketCap(stockData.market_cap)}</p>
        </div>
      </div>
    </div>
  )
}