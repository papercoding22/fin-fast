import { formatNumber } from '../utils/loanCalculations';

export default function LoanInputSection({ loan, onChange }) {
  const ltvPercent = loan.carPrice > 0 ? (loan.loanAmount / loan.carPrice * 100).toFixed(1) : 0;

  function handleChange(field, raw) {
    const value = parseInt(raw.replace(/\D/g, ''), 10) || 0;
    const updated = { ...loan, [field]: value };

    // Auto-sync loanAmount = carPrice - downPayment
    if (field === 'carPrice' || field === 'downPayment') {
      updated.loanAmount = Math.max(0, updated.carPrice - updated.downPayment);
    }
    onChange(updated);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Thông tin khoản vay</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Giá xe lăn bánh (VNĐ)</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formatNumber(loan.carPrice)}
            onChange={e => handleChange('carPrice', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Tiền tự có (VNĐ)</label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formatNumber(loan.downPayment)}
            onChange={e => handleChange('downPayment', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Số tiền vay (VNĐ)
            <span className="ml-1 text-xs text-slate-400">({ltvPercent}% giá xe)</span>
          </label>
          <input
            type="text"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formatNumber(loan.loanAmount)}
            onChange={e => handleChange('loanAmount', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Thời hạn vay (tháng)</label>
          <input
            type="number"
            min="6"
            max="120"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={loan.loanTermMonths}
            onChange={e => onChange({ ...loan, loanTermMonths: parseInt(e.target.value) || 96 })}
          />
        </div>
      </div>
    </div>
  );
}
