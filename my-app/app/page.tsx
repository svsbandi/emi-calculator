import { EMICalculator } from "@/components/emi-calculator"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            EMI Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate your Equated Monthly Installment (EMI) with ease
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          <EMICalculator />
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        <p>Built with Next.js and shadcn/ui</p>
      </footer>
    </div>
  )
}
