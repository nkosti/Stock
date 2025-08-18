'use client'

import Link from 'next/link'
import { TrendingUp, Calculator, BarChart3, Briefcase } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-slate-900 shadow-lg border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-bold text-white">StockValuer</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/valuation" className="flex items-center space-x-1 text-slate-300 hover:text-emerald-400 transition-colors">
              <Calculator className="h-4 w-4" />
              <span>Valuation</span>
            </Link>
            <Link href="/options" className="flex items-center space-x-1 text-slate-300 hover:text-emerald-400 transition-colors">
              <BarChart3 className="h-4 w-4" />
              <span>Options</span>
            </Link>
            <Link href="/portfolio" className="flex items-center space-x-1 text-slate-300 hover:text-emerald-400 transition-colors">
              <Briefcase className="h-4 w-4" />
              <span>Portfolio</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}