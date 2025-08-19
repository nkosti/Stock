'use client'

import { useState } from 'react'
import { Calculator, Info } from 'lucide-react'

interface OptionsResult {
  option_price: number
  intrinsic_value: number
  time_value: number
  greeks: {
    delta: number
    gamma: number
    theta: number
    vega: number
    rho: number
  }
}

export default function OptionsPage() {
  const [inputs, setInputs] = useState({
    stock_price: 100,
    strike_price: 100,
    time_to_expiry: 0.25, // 3 months
    risk_free_rate: 0.05, // 5%
    volatility: 0.20, // 20%
    option_type: 'call'
  })
  
  const [result, setResult] = useState<OptionsResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInputChange = (field: string, value: string | number) => {
    setInputs(prev => ({
      ...prev,
      [field]: field === 'option_type' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : value)
    }))
  }

  const calculateOptionPrice = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/options/black-scholes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputs)
      })
      
      if (response.ok) {
        const data = await response.json()
        setResult(data)
      } else {
        alert('Error calculating option price')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error calculating option price')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-blue-900 mb-4">Options Pricing</h1>
        <p className="text-lg text-gray-600 font-medium">
          Calculate option prices and Greeks using the Black-Scholes model
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-blue-900 mb-6">Option Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-2">
                Option Type
              </label>
              <select
                value={inputs.option_type}
                onChange={(e) => handleInputChange('option_type', e.target.value)}
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              >
                <option value="call">Call Option</option>
                <option value="put">Put Option</option>
              </select>
            </div>

            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-2">
                Current Stock Price ($)
              </label>
              <input
                type="number"
                step="1"
                value={inputs.stock_price}
                onChange={(e) => handleInputChange('stock_price', e.target.value)}
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-2">
                Strike Price ($)
              </label>
              <input
                type="number"
                step="1"
                value={inputs.strike_price}
                onChange={(e) => handleInputChange('strike_price', e.target.value)}
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-2">
                Time to Expiry (years)
              </label>
              <input
                type="number"
                step="1"
                value={inputs.time_to_expiry}
                onChange={(e) => handleInputChange('time_to_expiry', e.target.value)}
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              />
              <p className="text-xs text-gray-500 mt-1">
                Examples: 0.25 = 3 months, 0.5 = 6 months, 1.0 = 1 year
              </p>
            </div>

            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-2">
                Risk-Free Rate (%)
              </label>
              <input
                type="number"
                step="1"
                value={inputs.risk_free_rate * 100}
                onChange={(e) => handleInputChange('risk_free_rate', parseFloat(e.target.value) / 100)}
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-slate-900 mb-2">
                Volatility (%)
              </label>
              <input
                type="number"
                step="1"
                value={inputs.volatility * 100}
                onChange={(e) => handleInputChange('volatility', parseFloat(e.target.value) / 100)}
                className="w-full px-3 py-3 border-2 border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <button
              onClick={calculateOptionPrice}
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Calculator className="h-4 w-4" />
              {loading ? 'Calculating...' : 'Calculate Option Price'}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {result && (
            <>
              {/* Option Pricing Results */}
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-4">Option Valuation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Option Price</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      ${result.option_price.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Intrinsic Value</span>
                    <span className="font-semibold text-slate-900">${result.intrinsic_value.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Time Value</span>
                    <span className="font-semibold text-slate-900">${result.time_value.toFixed(4)}</span>
                  </div>
                </div>
              </div>

              {/* Greeks */}
              <div className="bg-white rounded-lg shadow-lg border border-slate-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-blue-900">Option Greeks</h3>
                  <Info className="h-4 w-4 text-slate-400" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-sm text-slate-600">Delta</div>
                    <div className="text-lg font-semibold text-slate-900">{result.greeks.delta}</div>
                    <div className="text-xs text-slate-500">Price sensitivity</div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-sm text-slate-600">Gamma</div>
                    <div className="text-lg font-semibold text-slate-900">{result.greeks.gamma}</div>
                    <div className="text-xs text-slate-500">Delta sensitivity</div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-sm text-slate-600">Theta</div>
                    <div className="text-lg font-semibold text-slate-900">{result.greeks.theta}</div>
                    <div className="text-xs text-slate-500">Time decay (per day)</div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded">
                    <div className="text-sm text-slate-600">Vega</div>
                    <div className="text-lg font-semibold text-slate-900">{result.greeks.vega}</div>
                    <div className="text-xs text-slate-500">Volatility sensitivity</div>
                  </div>
                  
                  <div className="p-3 bg-slate-50 rounded col-span-1 sm:col-span-2">
                    <div className="text-sm text-slate-600">Rho</div>
                    <div className="text-lg font-semibold text-slate-900">{result.greeks.rho}</div>
                    <div className="text-xs text-slate-500">Interest rate sensitivity</div>
                  </div>
                </div>
              </div>

              {/* Greeks Explanation */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Understanding Greeks</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Delta:</strong> How much the option price changes for $1 change in stock price</p>
                  <p><strong>Gamma:</strong> How much delta changes for $1 change in stock price</p>
                  <p><strong>Theta:</strong> How much the option loses value each day (time decay)</p>
                  <p><strong>Vega:</strong> How much the option price changes for 1% change in volatility</p>
                  <p><strong>Rho:</strong> How much the option price changes for 1% change in interest rates</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}