'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'

interface PortfolioHolding {
  id: string
  symbol: string
  shares: number
  avgPrice: number
  currentPrice?: number
  value?: number
  gainLoss?: number
  gainLossPercent?: number
}

export default function PortfolioPage() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([
    {
      id: '1',
      symbol: 'AAPL',
      shares: 10,
      avgPrice: 150.00,
      currentPrice: 175.00,
      value: 1750,
      gainLoss: 250,
      gainLossPercent: 16.67
    },
    {
      id: '2',
      symbol: 'GOOGL',
      shares: 5,
      avgPrice: 2800.00,
      currentPrice: 2650.00,
      value: 13250,
      gainLoss: -750,
      gainLossPercent: -5.36
    }
  ])

  const [newHolding, setNewHolding] = useState({
    symbol: '',
    shares: '',
    avgPrice: ''
  })

  const [loading, setLoading] = useState(false)

  const totalValue = holdings.reduce((sum, holding) => sum + (holding.value || 0), 0)
  const totalCost = holdings.reduce((sum, holding) => sum + (holding.shares * holding.avgPrice), 0)
  const totalGainLoss = totalValue - totalCost
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  const addHolding = async () => {
    if (!newHolding.symbol || !newHolding.shares || !newHolding.avgPrice) return

    setLoading(true)
    try {
      // Fetch current price
      const response = await fetch(`http://localhost:8001/api/stocks/${newHolding.symbol.toUpperCase()}/info`)
      let currentPrice = parseFloat(newHolding.avgPrice)
      
      if (response.ok) {
        const data = await response.json()
        currentPrice = data.current_price || parseFloat(newHolding.avgPrice)
      }

      const shares = parseFloat(newHolding.shares)
      const avgPrice = parseFloat(newHolding.avgPrice)
      const value = shares * currentPrice
      const gainLoss = value - (shares * avgPrice)
      const gainLossPercent = ((gainLoss / (shares * avgPrice)) * 100)

      const holding: PortfolioHolding = {
        id: Date.now().toString(),
        symbol: newHolding.symbol.toUpperCase(),
        shares,
        avgPrice,
        currentPrice,
        value,
        gainLoss,
        gainLossPercent
      }

      setHoldings([...holdings, holding])
      setNewHolding({ symbol: '', shares: '', avgPrice: '' })
    } catch (error) {
      console.error('Error adding holding:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeHolding = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id))
  }

  const refreshPrices = async () => {
    setLoading(true)
    try {
      const updatedHoldings = await Promise.all(
        holdings.map(async (holding) => {
          try {
            const response = await fetch(`http://localhost:8001/api/stocks/${holding.symbol}/info`)
            if (response.ok) {
              const data = await response.json()
              const currentPrice = data.current_price || holding.avgPrice
              const value = holding.shares * currentPrice
              const gainLoss = value - (holding.shares * holding.avgPrice)
              const gainLossPercent = ((gainLoss / (holding.shares * holding.avgPrice)) * 100)

              return {
                ...holding,
                currentPrice,
                value,
                gainLoss,
                gainLossPercent
              }
            }
          } catch (error) {
            console.error(`Error fetching price for ${holding.symbol}:`, error)
          }
          return holding
        })
      )
      setHoldings(updatedHoldings)
    } catch (error) {
      console.error('Error refreshing prices:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-blue-900 mb-4">Portfolio Analysis</h1>
        <p className="text-lg text-gray-600 font-medium">
          Track your investments and analyze portfolio performance
        </p>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-emerald-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Value</p>
              <p className="text-2xl font-bold text-slate-900">${totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-slate-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Cost</p>
              <p className="text-2xl font-bold text-slate-900">${totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
          <div className="flex items-center">
            {totalGainLoss >= 0 ? (
              <TrendingUp className="h-8 w-8 text-green-600" />
            ) : (
              <TrendingDown className="h-8 w-8 text-red-600" />
            )}
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Gain/Loss</p>
              <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalGainLoss.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
          <div className="flex items-center">
            <Percent className={`h-8 w-8 ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Return %</p>
              <p className={`text-2xl font-bold ${totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Holding */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Add New Holding</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-lg font-semibold text-slate-900 mb-2">Symbol</label>
            <input
              type="text"
              placeholder="AAPL"
              className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              value={newHolding.symbol}
              onChange={(e) => setNewHolding({...newHolding, symbol: e.target.value.toUpperCase()})}
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-slate-900 mb-2">Shares</label>
            <input
              type="number"
              step="0.01"
              placeholder="10"
              className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              value={newHolding.shares}
              onChange={(e) => setNewHolding({...newHolding, shares: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-lg font-semibold text-slate-900 mb-2">Avg Price</label>
            <input
              type="number"
              step="0.01"
              placeholder="150.00"
              className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              value={newHolding.avgPrice}
              onChange={(e) => setNewHolding({...newHolding, avgPrice: e.target.value})}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={addHolding}
              disabled={loading}
              className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Add Holding
            </button>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-900">Holdings</h2>
          <button
            onClick={refreshPrices}
            disabled={loading}
            className="bg-emerald-600 text-white px-4 py-3 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 shadow-lg transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Prices'}
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Shares</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Avg Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Market Value</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Gain/Loss</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Return %</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {holdings.map((holding) => (
                <tr key={holding.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      href={`/valuation?symbol=${holding.symbol}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors"
                    >
                      {holding.symbol}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {holding.shares}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${holding.avgPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${holding.currentPrice?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${holding.value?.toLocaleString() || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    (holding.gainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ${holding.gainLoss?.toFixed(2) || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                    (holding.gainLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {holding.gainLossPercent?.toFixed(2) || 'N/A'}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => removeHolding(holding.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}