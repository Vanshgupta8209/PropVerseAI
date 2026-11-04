import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export default function LoanCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState(5000000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);

  // EMI Calculation
  const p = loanAmount;
  const r = (interestRate / 12) / 100;
  const n = tenureYears * 12;
  const monthlyEmi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const totalPayment = monthlyEmi * n;
  const totalInterest = totalPayment - p;

  // Percentage for charts
  const principalPct = Math.round((p / totalPayment) * 100);
  const interestPct = 100 - principalPct;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
            <Calculator size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Financial Assistance Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">
            Home Loan & EMI Calculator
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Plan your home purchase with complete financial clarity. Estimate your monthly EMIs, total interest, and loan eligibility instantly.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Controls */}
          <div className="lg:col-span-7 space-y-6">
            <Card hover={false} className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6">Calculate Monthly EMI</h2>
              
              {/* Loan Amount */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Loan Amount</label>
                  <span className="text-base font-bold text-primary-600 dark:text-primary-400">{formatPrice(loanAmount)}</span>
                </div>
                <input
                  type="range"
                  min={500000}
                  max={50000000}
                  step={100000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
                  <span>₹5 Lakh</span>
                  <span>₹5 Crore</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Interest Rate (p.a.)</label>
                  <span className="text-base font-bold text-primary-600 dark:text-primary-400">{interestRate}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={15}
                  step={0.1}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
                  <span>5%</span>
                  <span>15%</span>
                </div>
              </div>

              {/* Tenure */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Loan Tenure</label>
                  <span className="text-base font-bold text-primary-600 dark:text-primary-400">{tenureYears} Years</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full accent-primary-600 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-1">
                  <span>1 Year</span>
                  <span>30 Years</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-5">
            <Card hover={false} className="p-6 sm:p-8 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-secondary)] border-2 border-primary-500/20">
              <h3 className="text-sm uppercase tracking-wider text-[var(--text-tertiary)] mb-2 font-medium">Monthly Payable EMI</h3>
              <p className="text-4xl font-extrabold gradient-text mb-6">{formatPrice(monthlyEmi)}<span className="text-sm text-[var(--text-secondary)] font-normal">/month</span></p>

              <div className="space-y-4 pt-4 border-t border-[var(--border-primary)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Principal Amount</span>
                  <span className="font-semibold text-[var(--text-primary)]">{formatPrice(loanAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Total Interest Payable</span>
                  <span className="font-semibold text-error-500">{formatPrice(totalInterest)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-[var(--border-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)]">Total Amount Payable</span>
                  <span className="font-bold text-[var(--text-primary)]">{formatPrice(totalPayment)}</span>
                </div>
              </div>

              {/* Progress visual */}
              <div className="mt-6">
                <div className="h-3 w-full rounded-full bg-error-500 overflow-hidden flex">
                  <div style={{ width: `${principalPct}%` }} className="bg-primary-600 h-full" />
                </div>
                <div className="flex justify-between text-xs mt-2 text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-600" /> Principal ({principalPct}%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-error-500" /> Interest ({interestPct}%)</span>
                </div>
              </div>

              <Button variant="gradient" size="lg" className="w-full mt-8">
                Apply for Pre-Approved Loan <ArrowRight size={18} />
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
