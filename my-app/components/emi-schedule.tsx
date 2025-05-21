'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useMemo, useState } from 'react'
import { format, addMonths } from 'date-fns'
import jsPDF from 'jspdf'

interface EMIScheduleProps {
  principal: number
  interestRate: number
  tenure: number
  emi: number
  prepaymentAmount?: number
  isAnnualRate: boolean
}

interface ScheduleRow {
  month: number
  date: Date
  emi: number
  principal: number
  interest: number
  balance: number
  totalPrincipalPaid: number
  totalInterestPaid: number
  effectiveRate: number
}

export function EMISchedule({   principal, 
  interestRate, 
  tenure, 
  emi,
  prepaymentAmount = 0,
  isAnnualRate = true
}: EMIScheduleProps) {
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  const schedule = useMemo(() => {
    const monthlyRate = isAnnualRate ? interestRate / 12 / 100 : interestRate / 100
    let balance = principal - prepaymentAmount
    const rows: ScheduleRow[] = []
    let totalPrincipalPaid = prepaymentAmount
    let totalInterestPaid = 0
    const start = new Date(startDate)

    if (isAnnualRate) {
      // For annual interest, group by year
      const paymentsPerYear = 12
      const years = Math.ceil(tenure / paymentsPerYear)
      
      for (let year = 0; year < years; year++) {
        let yearlyInterest = 0
        let yearlyPrincipal = 0
        const startingBalance = balance
        
        // Calculate total payments for the year
        for (let month = 0; month < paymentsPerYear && (year * paymentsPerYear + month) < tenure; month++) {
          const monthlyInterest = balance * monthlyRate
          const monthlyPrincipal = emi - monthlyInterest
          
          yearlyInterest += monthlyInterest
          yearlyPrincipal += monthlyPrincipal
          balance = balance - monthlyPrincipal
        }
        
        totalPrincipalPaid += yearlyPrincipal
        totalInterestPaid += yearlyInterest

        rows.push({
          month: year + 1,
          date: addMonths(start, year * paymentsPerYear),
          emi: emi * paymentsPerYear,
          principal: yearlyPrincipal,
          interest: yearlyInterest,
          balance: Math.max(0, balance),
          totalPrincipalPaid,
          totalInterestPaid,
          effectiveRate: (startingBalance > 0) ? (yearlyInterest / startingBalance) * 100 : 0
        })
      }
    } else {
      // For monthly interest, show monthly breakdown
      for (let month = 1; month <= tenure; month++) {
        const startingBalance = balance
        const interest = balance * monthlyRate
        const principalPaid = emi - interest
        balance = balance - principalPaid
        totalPrincipalPaid += principalPaid
        totalInterestPaid += interest

        rows.push({
          month,
          date: addMonths(start, month - 1),
          emi,
          principal: principalPaid,
          interest,
          balance: Math.max(0, balance),
          totalPrincipalPaid,
          totalInterestPaid,
          effectiveRate: (startingBalance > 0) ? (interest / startingBalance) * 100 * 12 : 0
        })
      }
    }

    return rows
  }, [principal, interestRate, tenure, emi, prepaymentAmount, startDate, isAnnualRate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getProgressPercentage = (amount: number) => {
    return (amount / (principal + schedule[schedule.length - 1].totalInterestPaid)) * 100
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Title
    doc.setFontSize(16)
    doc.text('EMI Repayment Schedule', pageWidth / 2, 15, { align: 'center' })
    
    // Loan Details
    doc.setFontSize(12)
    doc.text([
      `Loan Amount: ${formatCurrency(principal)}`,
      `Interest Rate: ${interestRate}% ${isAnnualRate ? '(Annual)' : '(Monthly)'}`,
      `Tenure: ${tenure} months`,
      `${isAnnualRate ? 'Monthly' : ''} EMI: ${formatCurrency(emi)}`,
      `Start Date: ${format(new Date(startDate), 'dd MMM yyyy')}`,
      `End Date: ${format(addMonths(new Date(startDate), tenure - 1), 'dd MMM yyyy')}`,
    ], 15, 30)

    // Table headers
    const headers = [
      'Date',
      isAnnualRate ? 'Yearly Payment' : 'Monthly EMI',
      isAnnualRate ? 'Yearly Principal' : 'Monthly Principal',
      isAnnualRate ? 'Yearly Interest' : 'Monthly Interest',
      'Balance',
      'Effective Rate'
    ]
    let y = 70

    doc.setFontSize(10)
    headers.forEach((header, i) => {
      doc.cell(15 + (i * 35), y, 35, 10, header, 0, 'center')
    })

    // Table data
    schedule.forEach((row, index) => {
      y = 80 + (index * 7)
      
      // Add new page if needed
      if (y > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage()
        y = 20
      }

      doc.cell(15, y, 35, 7, format(row.date, isAnnualRate ? 'yyyy' : 'dd/MM/yyyy'), 0, 'center')
      doc.cell(50, y, 35, 7, formatCurrency(row.emi), 0, 'right')
      doc.cell(85, y, 35, 7, formatCurrency(row.principal), 0, 'right')
      doc.cell(120, y, 35, 7, formatCurrency(row.interest), 0, 'right')
      doc.cell(155, y, 35, 7, formatCurrency(row.balance), 0, 'right')
      doc.cell(190, y, 35, 7, row.effectiveRate.toFixed(2) + '%', 0, 'right')
    })

    doc.save('emi-schedule.pdf')
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Amortization Schedule</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Start Date:</label>
            <Input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <Button onClick={exportToPDF}>
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {prepaymentAmount > 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Prepayment Summary</h4>
            <p className="text-sm">Upfront payment: {formatCurrency(prepaymentAmount)}</p>
            <p className="text-sm">Reduced loan amount: {formatCurrency(principal - prepaymentAmount)}</p>
          </div>
        )}
        
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Start Date</p>
            <p className="text-lg">{format(new Date(startDate), 'dd MMM yyyy')}</p>
          </div>
          <div>
            <p className="text-sm font-medium">End Date</p>
            <p className="text-lg">{format(addMonths(new Date(startDate), tenure - 1), 'dd MMM yyyy')}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-right">{isAnnualRate ? 'Yearly Payment' : 'Monthly EMI'}</th>
                <th className="p-2 text-right">{isAnnualRate ? 'Yearly Principal' : 'Monthly Principal'}</th>
                <th className="p-2 text-right">{isAnnualRate ? 'Yearly Interest' : 'Monthly Interest'}</th>
                <th className="p-2 text-right">Balance</th>
                <th className="p-2 text-right">Effective Rate (APR)</th>
                <th className="p-2 text-right">Progress</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row) => (
                <tr key={row.month} className="border-b hover:bg-muted/50">
                  <td className="p-2 text-left">{format(row.date, isAnnualRate ? 'yyyy' : 'dd MMM yyyy')}</td>
                  <td className="p-2 text-right font-medium">{formatCurrency(row.emi)}</td>
                  <td className="p-2 text-right text-green-600 dark:text-green-400">
                    {formatCurrency(row.principal)}
                  </td>
                  <td className="p-2 text-right text-red-600 dark:text-red-400">
                    {formatCurrency(row.interest)}
                  </td>
                  <td className="p-2 text-right">{formatCurrency(row.balance)}</td>
                  <td className="p-2 text-right">{row.effectiveRate.toFixed(2)}%</td>
                  <td className="p-2">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${getProgressPercentage(row.totalPrincipalPaid + row.totalInterestPaid)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
