'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Calculator, TrendingUp } from 'lucide-react'
import EnhancedStockChart from '@/components/charts/EnhancedStockChart'

export default function ValuationPage() {
  const searchParams = useSearchParams()
  const [symbol, setSymbol] = useState('')
  const [stockData, setStockData] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1y')

  // Auto-search when symbol is provided in URL
  useEffect(() => {
    const symbolParam = searchParams.get('symbol')
    if (symbolParam) {
      setSymbol(symbolParam.toUpperCase())
      // Trigger search after setting symbol
      setTimeout(() => {
        handleSearchForSymbol(symbolParam.toUpperCase())
      }, 100)
    }
  }, [searchParams])

  const handleSearchForSymbol = async (searchSymbol: string) => {
    if (!searchSymbol.trim()) return
    
    setLoading(true)
    try {
      // Fetch stock info and chart data in parallel
      const [infoResponse, historyResponse] = await Promise.all([
        fetch(`http://localhost:8001/api/stocks/${searchSymbol}/info`),
        fetch(`http://localhost:8001/api/stocks/${searchSymbol}/history?period=${selectedTimeframe}`)
      ])
      
      if (infoResponse.ok) {
        const data = await infoResponse.json()
        setStockData(data)
      } else {
        alert('Stock not found')
        return
      }
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json()
        setChartData(historyData.data)
      }
    } catch (error) {
      console.error('Error fetching stock data:', error)
      alert('Error fetching stock data')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    await handleSearchForSymbol(symbol)
  }

  const handleTimeframeChange = async (newTimeframe: string) => {
    setSelectedTimeframe(newTimeframe)
    if (symbol) {
      setLoading(true)
      try {
        const historyResponse = await fetch(`http://localhost:8001/api/stocks/${symbol}/history?period=${newTimeframe}`)
        if (historyResponse.ok) {
          const historyData = await historyResponse.json()
          setChartData(historyData.data)
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-blue-900 mb-4">Stock Valuation</h1>
        <p className="text-lg text-gray-600 font-medium">
          Analyze stocks using fundamental analysis, DCF models, and key valuation ratios
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6 mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="symbol" className="block text-lg font-semibold text-slate-900 mb-2">
              Stock Symbol
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                id="symbol"
                type="text"
                placeholder="Enter stock symbol (e.g., AAPL)"
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading || !symbol.trim()}
              className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 flex items-center gap-2 shadow-lg transition-colors"
            >
              <Calculator className="h-4 w-4" />
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      </div>

      {/* Stock Info Display */}
      {stockData && (
        <div className="space-y-6">
          {/* Company Overview */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
              <h2 className="text-2xl font-bold text-blue-900">{stockData.company_name} ({stockData.symbol})</h2>
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
                <p className="font-semibold text-slate-900">
                  {stockData.market_cap 
                    ? `$${(stockData.market_cap / 1000000000).toFixed(2)}B` 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Price and Valuation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Current Price Info */}
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Price Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-700">Current Price</span>
                  <span className="font-bold text-lg text-emerald-600">
                    ${stockData.current_price?.toFixed(2) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">52 Week High</span>
                  <span className="font-semibold text-slate-900">${stockData['52_week_high']?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">52 Week Low</span>
                  <span className="font-semibold text-slate-900">${stockData['52_week_low']?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Valuation Ratios */}
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-blue-900 mb-4">Valuation Ratios</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-700">P/E Ratio</span>
                  <span className="font-semibold text-slate-900">{stockData.pe_ratio?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Forward P/E</span>
                  <span className="font-semibold text-slate-900">{stockData.forward_pe?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">P/B Ratio</span>
                  <span className="font-semibold text-slate-900">{stockData.price_to_book?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">PEG Ratio</span>
                  <span className="font-semibold text-slate-900">{stockData.peg_ratio?.toFixed(2) || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Health */}
          <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
            <h3 className="text-xl font-bold text-blue-900 mb-4">Financial Health</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-slate-600">Debt to Equity</p>
                <p className="font-semibold text-slate-900">{stockData.debt_to_equity?.toFixed(2) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">ROE</p>
                <p className="font-semibold text-slate-900">
                  {stockData.return_on_equity 
                    ? `${(stockData.return_on_equity * 100).toFixed(2)}%` 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Revenue Growth</p>
                <p className="font-semibold text-slate-900">
                  {stockData.revenue_growth 
                    ? `${(stockData.revenue_growth * 100).toFixed(2)}%` 
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Beta</p>
                <p className="font-semibold text-slate-900">{stockData.beta?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
          </div>


          {/* Stock Chart */}
          {chartData && (
            <EnhancedStockChart 
              data={chartData} 
              symbol={stockData.symbol} 
              timeframe={selectedTimeframe}
              onTimeframeChange={handleTimeframeChange}
            />
          )}
        </div>
      )}
    </div>
  )
}