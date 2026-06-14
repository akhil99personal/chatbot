import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

function inr(n) { return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(n || 0)); }

export default function EmiCalculator({ init }) {
  const [amount, setAmount] = useState(init?.loanAmount || 5000000);
  const [rate, setRate] = useState(init?.annualInterestRate || 8.5);
  const [years, setYears] = useState(init?.tenureYears || 20);

  const { emi, totalInterest, totalPayable } = useMemo(() => {
    const r = rate / 12 / 100;
    const n = years * 12;
    if (r === 0) return { emi: amount / n, totalInterest: 0, totalPayable: amount };
    const e = (amount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = e * n;
    return { emi: e, totalInterest: total - amount, totalPayable: total };
  }, [amount, rate, years]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="cb-card"
    >
      <div className="cb-card-header cb-card-header-gradient">
        <Calculator className="h-5 w-5" />
        <div style={{ fontWeight: 700 }}>EMI Calculator</div>
        {init?.propertyTitle && <div style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.9 }}>{init.propertyTitle}</div>}
      </div>
      <div className="cb-emi-inputs">
        <Field label="Loan amount (₹)" value={amount} min={100000} max={100000000} step={50000} onChange={setAmount} />
        <Field label="Interest rate (%)" value={rate} min={1} max={20} step={0.1} onChange={setRate} float />
        <Field label="Tenure (years)" value={years} min={1} max={30} step={1} onChange={setYears} />
      </div>
      <div className="cb-emi-results">
        <Out label="Monthly EMI" value={`₹${inr(emi)}`} />
        <Out label="Total interest" value={`₹${inr(totalInterest)}`} />
        <Out label="Total payable" value={`₹${inr(totalPayable)}`} />
      </div>
    </motion.div>
  );
}
function Field({ label, value, min, max, step, onChange, float }) {
  return (
    <div className="cb-emi-field">
      <label>
        <span className="label-text">{label}</span>
        <input
          type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => onChange(float ? parseFloat(e.target.value) : parseInt(e.target.value || "0", 10))}
        />
        <input type="range" value={value} min={min} max={max} step={step}
          onChange={(e) => onChange(float ? parseFloat(e.target.value) : parseInt(e.target.value, 10))}
        />
      </label>
    </div>
  );
}
function Out({ label, value }) {
  return (
    <div>
      <div className="cb-emi-result-label">{label}</div>
      <div className="cb-emi-result-value">{value}</div>
    </div>
  );
}