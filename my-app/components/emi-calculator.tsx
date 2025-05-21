'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { EMISchedule } from '@/components/emi-schedule'

type LoanType = 'home' | 'car' | 'personal' | 'education' | 'business'

interface ValidationError {
  principal?: string
  interestRate?: string
  tenure?: string
}

interface LoanConfig {
  type: LoanType
  minAmount: number
  maxAmount: number
  minAnnualInterest: number
  maxAnnualInterest: number
  minMonthlyInterest: number
  maxMonthlyInterest: number
  maxTenure: number
}

const LOAN_CONFIGS: Record<LoanType, LoanConfig> = {
  home: {
    type: 'home',
    minAmount: 100000,
    maxAmount: 10000000,
    minAnnualInterest: 5,
    maxAnnualInterest: 30,
    minMonthlyInterest: 0.7,
    maxMonthlyInterest: 5,
    maxTenure: 360 // 30 years
  },
  car: {
    type: 'car',
    minAmount: 50000,
    maxAmount: 2000000,
    minAnnualInterest: 5,
    maxAnnualInterest: 30,
    minMonthlyInterest: 0.7,
    maxMonthlyInterest: 5,
    maxTenure: 84 // 7 years
  },
  personal: {
    type: 'personal',
    minAmount: 10000,
    maxAmount: 1000000,
    minAnnualInterest: 5,
    maxAnnualInterest: 30,
    minMonthlyInterest: 0.7,
    maxMonthlyInterest: 5,
    maxTenure: 60 // 5 years
  },
  education: {
    type: 'education',
    minAmount: 50000,
    maxAmount: 5000000,
    minAnnualInterest: 5,
    maxAnnualInterest: 30,
    minMonthlyInterest: 0.7,
    maxMonthlyInterest: 5,
    maxTenure: 180 // 15 years
  },
  business: {
    type: 'business',
    minAmount: 100000,
    maxAmount: 20000000,
    minAnnualInterest: 5,
    maxAnnualInterest: 30,
    minMonthlyInterest: 0.7,
    maxMonthlyInterest: 5,
    maxTenure: 120 // 10 years
  }
}

export function EMICalculator() {
  const [loanType, setLoanType] = useState<LoanType>('home')
  const [principal, setPrincipal] = useState(1000000)
  const [interestRate, setInterestRate] = useState(8.5)
  const [tenure, setTenure] = useState(120)
  const [emi, setEmi] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalInterest, setTotalInterest] = useState(0)
  const [isAnnualRate, setIsAnnualRate] = useState(true)
  const [errors, setErrors] = useState<ValidationError>({})
  const [prepaymentAmount, setPrepaymentAmount] = useState(0)

  const currentLoanConfig = LOAN_CONFIGS[loanType]

  const validateInputs = (value: number, type: keyof ValidationError): string | undefined => {
    switch (type) {
      case 'principal':
        if (value < currentLoanConfig.minAmount) 
          return `Minimum loan amount is ${formatCurrency(currentLoanConfig.minAmount)}`
        if (value > currentLoanConfig.maxAmount) 
          return `Maximum loan amount is ${formatCurrency(currentLoanConfig.maxAmount)}`
        break
      case 'interestRate':
        if (isAnnualRate) {
          if (value < currentLoanConfig.minAnnualInterest) 
            return `Minimum annual interest rate is ${currentLoanConfig.minAnnualInterest}%`
          if (value > currentLoanConfig.maxAnnualInterest) 
            return `Maximum annual interest rate is ${currentLoanConfig.maxAnnualInterest}%`
        } else {
          if (value < currentLoanConfig.minMonthlyInterest) 
            return `Minimum monthly interest rate is ${currentLoanConfig.minMonthlyInterest}%`
          if (value > currentLoanConfig.maxMonthlyInterest) 
            return `Maximum monthly interest rate is ${currentLoanConfig.maxMonthlyInterest}%`
        }
        break
      case 'tenure':
        if (value < 1) return 'Minimum tenure is 1 month'
        if (value > currentLoanConfig.maxTenure) 
          return `Maximum tenure is ${currentLoanConfig.maxTenure} months`
        break
    }
  }

  const handlePrincipalChange = (value: number) => {
    const error = validateInputs(value, 'principal')
    setErrors(prev => ({ ...prev, principal: error }))
    setPrincipal(value)
  }

  const handleInterestChange = (value: number) => {
    const error = validateInputs(value, 'interestRate')
    setErrors(prev => ({ ...prev, interestRate: error }))
    setInterestRate(value)
  }

  const handleTenureChange = (value: number) => {
    const error = validateInputs(value, 'tenure')
    setErrors(prev => ({ ...prev, tenure: error }))
    setTenure(value)
  }

  const calculateEMI = () => {
    if (Object.values(errors).some(error => error)) return

    const p = principal - prepaymentAmount
    const r = (isAnnualRate ? interestRate / 12 / 100 : interestRate / 100)
    const n = tenure
    const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
    const totalAmt = emi * n
    
    setEmi(Math.round(emi))
    setTotalAmount(Math.round(totalAmt))
    setTotalInterest(Math.round(totalAmt - p))
  }

  useEffect(() => {
    const config = LOAN_CONFIGS[loanType]
    setPrincipal(Math.min(Math.max(principal, config.minAmount), config.maxAmount))
    if (isAnnualRate) {
      setInterestRate(Math.min(Math.max(interestRate, config.minAnnualInterest), config.maxAnnualInterest))
    } else {
      setInterestRate(Math.min(Math.max(interestRate, config.minMonthlyInterest), config.maxMonthlyInterest))
    }
    setTenure(Math.min(tenure, config.maxTenure))
  }, [loanType, isAnnualRate])

  useEffect(() => {
    calculateEMI()
  }, [principal, interestRate, tenure, prepaymentAmount, isAnnualRate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getBreakdownPercentage = () => {
    const principalPercentage = (principal / totalAmount) * 100
    const interestPercentage = (totalInterest / totalAmount) * 100
    return { principalPercentage, interestPercentage }
  }

  const { principalPercentage, interestPercentage } = getBreakdownPercentage()
  const handleShare = async () => {
    const shareData = {
      title: 'EMI Calculator Results',
      text: `Loan Amount: ${formatCurrency(principal)}
Interest Rate: ${interestRate}%
Tenure: ${tenure} months
Monthly EMI: ${formatCurrency(emi)}
Total Interest: ${formatCurrency(totalInterest)}
Total Amount: ${formatCurrency(totalAmount)}`
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareData.text)
        alert('Results copied to clipboard!')
      } else {
        // Fallback for browsers that don't support clipboard API
        const textarea = document.createElement('textarea')
        textarea.value = shareData.text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        try {
          document.execCommand('copy')
          alert('Results copied to clipboard!')
        } catch (err) {
          console.error('Failed to copy: ', err)
          alert('Could not copy results. Your browser may not support this feature.')
        } finally {
          document.body.removeChild(textarea)
        }
      }
    } catch (err) {
      console.error('Share failed:', err)
      alert('Could not share results. Your browser may not support this feature.')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">EMI Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Loan Type</label>
              <select 
                className="w-full p-2 border rounded-md"
                value={loanType}
                onChange={(e) => setLoanType(e.target.value as LoanType)}
              >
                <option value="home">Home Loan</option>
                <option value="car">Car Loan</option>
                <option value="personal">Personal Loan</option>
                <option value="education">Education Loan</option>
                <option value="business">Business Loan</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Interest Rate Type</label>
              <div className="flex gap-4">
                <Button 
                  variant={isAnnualRate ? "default" : "outline"}
                  onClick={() => setIsAnnualRate(true)}
                >
                  Annual (APR)
                </Button>
                <Button 
                  variant={!isAnnualRate ? "default" : "outline"}
                  onClick={() => setIsAnnualRate(false)}
                >
                  Monthly
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Loan Amount</label>
            <Input 
              type="number" 
              value={principal}
              onChange={(e) => handlePrincipalChange(Number(e.target.value))}
              min={currentLoanConfig.minAmount}
              max={currentLoanConfig.maxAmount}
              className={`w-full ${errors.principal ? 'border-red-500' : ''}`}
            />
            {errors.principal && (
              <p className="text-red-500 text-sm mt-1">{errors.principal}</p>
            )}
            <Slider 
              value={[principal]}
              onValueChange={(value) => handlePrincipalChange(value[0])}
              min={currentLoanConfig.minAmount}
              max={currentLoanConfig.maxAmount}
              step={10000}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground">
              Range: {formatCurrency(currentLoanConfig.minAmount)} - {formatCurrency(currentLoanConfig.maxAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Interest Rate (%)</label>
            <Input 
              type="number" 
              value={interestRate}
              onChange={(e) => handleInterestChange(Number(e.target.value))}
              min={isAnnualRate ? currentLoanConfig.minAnnualInterest : currentLoanConfig.minMonthlyInterest}
              max={isAnnualRate ? currentLoanConfig.maxAnnualInterest : currentLoanConfig.maxMonthlyInterest}
              step={0.1}
              className={`w-full ${errors.interestRate ? 'border-red-500' : ''}`}
            />
            {errors.interestRate && (
              <p className="text-red-500 text-sm mt-1">{errors.interestRate}</p>
            )}
            <Slider 
              value={[interestRate]}
              onValueChange={(value) => handleInterestChange(value[0])}
              min={isAnnualRate ? currentLoanConfig.minAnnualInterest : currentLoanConfig.minMonthlyInterest}
              max={isAnnualRate ? currentLoanConfig.maxAnnualInterest : currentLoanConfig.maxMonthlyInterest}
              step={0.1}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground">
              Range: {isAnnualRate ? currentLoanConfig.minAnnualInterest : currentLoanConfig.minMonthlyInterest}% - 
              {isAnnualRate ? currentLoanConfig.maxAnnualInterest : currentLoanConfig.maxMonthlyInterest}%
              {isAnnualRate ? ' (Annual)' : ' (Monthly)'}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Loan Tenure (months)</label>
            <Input 
              type="number" 
              value={tenure}
              onChange={(e) => handleTenureChange(Number(e.target.value))}
              min={1}
              max={currentLoanConfig.maxTenure}
              className={`w-full ${errors.tenure ? 'border-red-500' : ''}`}
            />
            {errors.tenure && (
              <p className="text-red-500 text-sm mt-1">{errors.tenure}</p>
            )}
            <Slider 
              value={[tenure]}
              onValueChange={(value) => handleTenureChange(value[0])}
              min={1}
              max={currentLoanConfig.maxTenure}
              step={1}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground">
              Range: 1 - {currentLoanConfig.maxTenure} months
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Prepayment Amount (Optional)</label>
            <Input 
              type="number" 
              value={prepaymentAmount}
              onChange={(e) => setPrepaymentAmount(Number(e.target.value))}
              min={0}
              max={principal}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Enter any upfront payment to reduce the loan amount
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Monthly EMI</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-4">
                <p className="text-2xl font-bold text-primary">{formatCurrency(emi)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Total Interest</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-4">
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalInterest)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-lg">Total Amount</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 p-4">
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-4">
              <div className="h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${principalPercentage}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Principal ({Math.round(principalPercentage)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                  <span>Interest ({Math.round(interestPercentage)}%)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button onClick={handleShare}>
              Share Results
            </Button>
          </div>
        </CardContent>
      </Card>
        {!Object.values(errors).some(error => error) && emi > 0 && (
        <EMISchedule
          principal={principal}
          interestRate={interestRate}
          tenure={tenure}
          emi={emi}
          prepaymentAmount={prepaymentAmount}
          isAnnualRate={isAnnualRate}
        />
      )}
    </div>
  )
}
