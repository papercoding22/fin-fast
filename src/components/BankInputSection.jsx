import { useState } from 'react';
import { formatNumber } from '../utils/loanCalculations';

const BANK_COLORS = ['#7c3aed', '#0891b2', '#059669', '#dc2626', '#d97706', '#db2777'];

function PrepaymentFeeRow({ row, index, onChange, onRemove }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-slate-500 w-16 shrink-0">Đến năm</span>
      <input
        type="number"
        min="1"
        max="999"
        className="w-16 border border-slate-300 rounded px-2 py-1 text-xs"
        value={row.upToYear === 999 ? '' : row.upToYear}
        placeholder="∞"
        onChange={e => {
          const v = e.target.value === '' ? 999 : parseInt(e.target.value) || 1;
          onChange(index, { ...row, upToYear: v });
        }}
      />
      <span className="text-xs text-slate-500">Phí</span>
      <input
        type="number"
        step="0.1"
        min="0"
        max="20"
        className="w-20 border border-slate-300 rounded px-2 py-1 text-xs"
        value={row.rate}
        onChange={e => onChange(index, { ...row, rate: parseFloat(e.target.value) || 0 })}
      />
      <span className="text-xs text-slate-500">%</span>
      <button
        className="text-red-400 hover:text-red-600 text-xs ml-1"
        onClick={() => onRemove(index)}
      >✕</button>
    </div>
  );
}

function AdditionalCostRow({ cost, index, carPrice, onChange, onRemove }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-1 bg-amber-50 rounded p-2">
      <input
        type="text"
        placeholder="Tên chi phí"
        className="border border-slate-300 rounded px-2 py-1 text-xs flex-1 min-w-32"
        value={cost.label}
        onChange={e => onChange(index, { ...cost, label: e.target.value })}
      />
      <select
        className="border border-slate-300 rounded px-2 py-1 text-xs"
        value={cost.type}
        onChange={e => onChange(index, { ...cost, type: e.target.value })}
      >
        <option value="fixed">Cố định (VNĐ)</option>
        <option value="percent_car">% giá xe</option>
        <option value="percent_loan">% số tiền vay</option>
      </select>
      {cost.type === 'fixed' ? (
        <input
          type="text"
          className="w-32 border border-slate-300 rounded px-2 py-1 text-xs"
          value={formatNumber(cost.amount)}
          onChange={e => {
            const amt = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
            onChange(index, { ...cost, amount: amt });
          }}
        />
      ) : (
        <>
          <input
            type="number"
            step="0.01"
            min="0"
            className="w-16 border border-slate-300 rounded px-2 py-1 text-xs"
            value={cost.percent}
            onChange={e => {
              const pct = parseFloat(e.target.value) || 0;
              const base = cost.type === 'percent_car' ? carPrice : 0;
              onChange(index, { ...cost, percent: pct, amount: base * pct / 100 });
            }}
          />
          <span className="text-xs text-slate-500">%</span>
          <span className="text-xs text-slate-400">≈ {formatNumber(cost.amount)} đ</span>
        </>
      )}
      <button className="text-red-400 hover:text-red-600 text-xs" onClick={() => onRemove(index)}>✕</button>
    </div>
  );
}

export default function BankInputSection({ banks, loan, onChange, onAdd, onRemove }) {
  const [collapsed, setCollapsed] = useState({});

  function toggleCollapse(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function updateBank(id, field, value) {
    onChange(banks.map(b => b.id === id ? { ...b, [field]: value } : b));
  }

  function updatePrepaymentFee(id, feeIndex, newRow) {
    onChange(banks.map(b => {
      if (b.id !== id) return b;
      const fees = [...b.prepaymentFees];
      fees[feeIndex] = newRow;
      return { ...b, prepaymentFees: fees };
    }));
  }

  function removePrepaymentFee(id, feeIndex) {
    onChange(banks.map(b => {
      if (b.id !== id) return b;
      return { ...b, prepaymentFees: b.prepaymentFees.filter((_, i) => i !== feeIndex) };
    }));
  }

  function addPrepaymentFee(id) {
    onChange(banks.map(b => {
      if (b.id !== id) return b;
      return { ...b, prepaymentFees: [...b.prepaymentFees, { upToYear: 999, rate: 0 }] };
    }));
  }

  function updateAdditionalCost(id, costIndex, newCost) {
    onChange(banks.map(b => {
      if (b.id !== id) return b;
      // If percent_car type, recompute amount with current carPrice
      let cost = { ...newCost };
      if (cost.type === 'percent_car') cost.amount = loan.carPrice * cost.percent / 100;
      if (cost.type === 'percent_loan') cost.amount = loan.loanAmount * cost.percent / 100;
      const costs = [...b.additionalCosts];
      costs[costIndex] = cost;
      return { ...b, additionalCosts: costs };
    }));
  }

  function removeAdditionalCost(id, costIndex) {
    onChange(banks.map(b => {
      if (b.id !== id) return b;
      return { ...b, additionalCosts: b.additionalCosts.filter((_, i) => i !== costIndex) };
    }));
  }

  function addAdditionalCost(id) {
    onChange(banks.map(b => {
      if (b.id !== id) return b;
      return {
        ...b,
        additionalCosts: [...b.additionalCosts, { id: Date.now().toString(), label: '', type: 'fixed', percent: 0, amount: 0 }],
      };
    }));
  }

  const maxLtv = (loanAmount, carPrice) => carPrice > 0 ? (loanAmount / carPrice * 100) : 0;

  return (
    <div className="space-y-4">
      {banks.map((bank, bankIdx) => {
        const ltv = maxLtv(loan.loanAmount, loan.carPrice);
        const ltvWarning = ltv > bank.maxLtvPercent;
        const termWarning = loan.loanTermMonths > bank.maxTermMonths;
        const isCollapsed = collapsed[bank.id];

        return (
          <div key={bank.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-slate-50"
              onClick={() => toggleCollapse(bank.id)}
              style={{ borderLeft: `4px solid ${bank.color}` }}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bank.color }} />
                <h3 className="font-semibold text-slate-800">{bank.name || `Ngân hàng ${bankIdx + 1}`}</h3>
                {ltvWarning && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    ⚠ LTV vượt {bank.maxLtvPercent}% (thực tế {ltv.toFixed(1)}%)
                  </span>
                )}
                {termWarning && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                    ⚠ Thời hạn vượt {bank.maxTermMonths} tháng
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {banks.length > 1 && (
                  <button
                    className="text-red-400 hover:text-red-600 text-sm px-2"
                    onClick={e => { e.stopPropagation(); onRemove(bank.id); }}
                  >Xóa</button>
                )}
                <span className="text-slate-400 text-sm">{isCollapsed ? '▼' : '▲'}</span>
              </div>
            </div>

            {/* Body */}
            {!isCollapsed && (
              <div className="px-6 pb-6 space-y-5">
                {/* Basic info */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tên ngân hàng</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bank.name}
                      onChange={e => updateBank(bank.id, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Lãi suất cố định (%/năm)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bank.fixedRate}
                      onChange={e => updateBank(bank.id, 'fixedRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Số tháng ưu đãi</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bank.fixedMonths}
                      onChange={e => updateBank(bank.id, 'fixedMonths', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Lãi suất thả nổi (%/năm)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bank.floatingRate}
                      onChange={e => updateBank(bank.id, 'floatingRate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tỷ lệ vay tối đa (%)</label>
                    <input
                      type="number"
                      step="1"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bank.maxLtvPercent}
                      onChange={e => updateBank(bank.id, 'maxLtvPercent', parseFloat(e.target.value) || 80)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Thời hạn vay tối đa (tháng)</label>
                    <input
                      type="number"
                      step="1"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={bank.maxTermMonths}
                      onChange={e => updateBank(bank.id, 'maxTermMonths', parseInt(e.target.value) || 96)}
                    />
                  </div>
                </div>

                {/* Prepayment fees */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-700">Phí trả trước hạn</h4>
                    <button
                      className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 rounded px-2 py-0.5"
                      onClick={() => addPrepaymentFee(bank.id)}
                    >+ Thêm mức phí</button>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">Nhập "Đến năm" để xác định khoảng thời gian áp dụng (để trống = áp dụng mãi)</p>
                  {bank.prepaymentFees.map((row, i) => (
                    <PrepaymentFeeRow
                      key={i}
                      row={row}
                      index={i}
                      onChange={(idx, updated) => updatePrepaymentFee(bank.id, idx, updated)}
                      onRemove={(idx) => removePrepaymentFee(bank.id, idx)}
                    />
                  ))}
                </div>

                {/* Additional costs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-slate-700">Chi phí phụ / ràng buộc</h4>
                    <button
                      className="text-xs text-amber-600 hover:text-amber-800 border border-amber-300 rounded px-2 py-0.5"
                      onClick={() => addAdditionalCost(bank.id)}
                    >+ Thêm chi phí</button>
                  </div>
                  {bank.additionalCosts.length === 0 && (
                    <p className="text-xs text-slate-400">Chưa có chi phí phụ</p>
                  )}
                  {bank.additionalCosts.map((cost, i) => (
                    <AdditionalCostRow
                      key={cost.id || i}
                      cost={cost}
                      index={i}
                      carPrice={loan.carPrice}
                      onChange={(idx, updated) => updateAdditionalCost(bank.id, idx, updated)}
                      onRemove={(idx) => removeAdditionalCost(bank.id, idx)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add bank button */}
      <button
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 text-sm font-medium transition-colors"
        onClick={onAdd}
      >
        + Thêm ngân hàng
      </button>
    </div>
  );
}
