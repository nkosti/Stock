'use client'

import { useState } from 'react'
import { X, Mail, Lock, User, Check, AlertCircle } from 'lucide-react'
import EmailVerification from './EmailVerification'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showVerification, setShowVerification] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false
  })

  const validatePassword = (password: string) => {
    const validation = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    setPasswordValidation(validation)
    return Object.values(validation).every(Boolean)
  }

  const isPasswordValid = isLogin || Object.values(passwordValidation).every(Boolean)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate password for signup
    if (!isLogin && !isPasswordValid) {
      alert('Please ensure your password meets all requirements')
      return
    }
    
    try {
      if (isLogin) {
        // Handle login
        const response = await fetch('http://localhost:8000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('token', data.access_token)
          onClose()
          alert('Login successful!')
        } else {
          const error = await response.json()
          alert(error.detail || 'Login failed')
        }
      } else {
        // Handle signup
        const response = await fetch('http://localhost:8000/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password
          })
        })
        
        if (response.ok) {
          setShowVerification(true)
        } else {
          const error = await response.json()
          alert(error.detail || 'Registration failed')
        }
      }
    } catch {
      alert('Network error. Please try again.')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Validate password on change if it's the password field
    if (name === 'password' && !isLogin) {
      validatePassword(value)
    }
  }

  const handleVerified = () => {
    setShowVerification(false)
    onClose()
    alert('Email verified successfully! You can now log in.')
  }

  const handleBackToLogin = () => {
    setShowVerification(false)
    setIsLogin(true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 relative">
        {showVerification ? (
          <EmailVerification
            email={formData.email}
            onBack={handleBackToLogin}
            onVerified={handleVerified}
          />
        ) : (
          <>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <p className="text-slate-600 mt-2">
            {isLogin ? 'Welcome back to StockValuer' : 'Join StockValuer today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 placeholder-slate-400"
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 placeholder-slate-400"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 placeholder-slate-400"
                placeholder="••••••••"
                required
              />
            </div>
            
            {!isLogin && formData.password && (
              <div className="mt-2 p-3 bg-slate-50 rounded-lg border">
                <p className="text-sm font-medium text-slate-700 mb-2">Password Requirements:</p>
                <div className="space-y-1">
                  <div className={`flex items-center text-xs ${passwordValidation.minLength ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {passwordValidation.minLength ? <Check className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasUppercase ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {passwordValidation.hasUppercase ? <Check className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    One uppercase letter
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasLowercase ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {passwordValidation.hasLowercase ? <Check className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    One lowercase letter
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasNumber ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {passwordValidation.hasNumber ? <Check className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    One number
                  </div>
                  <div className={`flex items-center text-xs ${passwordValidation.hasSpecial ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {passwordValidation.hasSpecial ? <Check className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                    One special character
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!isLogin && !isPasswordValid}
            className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
              isLogin || isPasswordValid 
                ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
          </>
        )}
      </div>
    </div>
  )
}