'use client'

import { useState, useEffect } from 'react'
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react'

interface EmailVerificationProps {
  email: string
  onBack: () => void
  onVerified: () => void
}

export default function EmailVerification({ email, onBack, onVerified }: EmailVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newCode = [...code]
    newCode[index] = value

    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`)
      nextInput?.focus()
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('')
    if (codeToVerify.length !== 6) {
      setError('Please enter the complete verification code')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://localhost:8000/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeToVerify })
      })

      if (response.ok) {
        onVerified()
      } else {
        const data = await response.json()
        setError(data.message || 'Invalid verification code')
      }
    } catch {
      setError('Failed to verify code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (!canResend) return

    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      await fetch('http://localhost:8000/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      setCountdown(60)
      setCanResend(false)
      setError('')
    } catch {
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="text-center">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 flex items-center"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mb-6">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Verify Your Email
        </h2>
        <p className="text-slate-600">
          We&apos;ve sent a 6-digit verification code to
        </p>
        <p className="text-slate-900 font-semibold">{email}</p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
        <div className="flex justify-center space-x-2 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900"
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || code.join('').length !== 6}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors mb-4 ${
            isLoading || code.join('').length !== 6
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="text-center text-sm text-slate-600">
        <p>Didn&apos;t receive the code?</p>
        <button
          onClick={handleResendCode}
          disabled={!canResend || isLoading}
          className={`mt-2 font-semibold ${
            canResend && !isLoading
              ? 'text-emerald-600 hover:text-emerald-700'
              : 'text-slate-400'
          }`}
        >
          {canResend ? (
            <span className="flex items-center justify-center">
              <RefreshCw className="h-4 w-4 mr-1" />
              Resend Code
            </span>
          ) : (
            `Resend in ${countdown}s`
          )}
        </button>
      </div>
    </div>
  )
}