'use client'

import Link from 'next/link'
import { useState } from 'react'
import { TrendingUp, Calculator, BarChart3, Briefcase, LogIn, UserPlus } from 'lucide-react'
import AuthModal from '../auth/AuthModal'

export default function Header() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  return (
    <>
      <header className="bg-slate-900 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-emerald-400" />
                <span className="text-xl font-bold text-white">StockValuer</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-6">
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
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-1 text-slate-300 hover:text-emerald-400 transition-colors px-3 py-1 rounded-md hover:bg-slate-800"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-1 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  )
}