import { formatVND } from '../utils/loanCalculations';

export default function ComparisonTable({ banks, scenarios, results }) {
  // results[scenarioId][bankId] = { totalInterestPaid, prepaymentFee, totalAdditional, totalCost, ... }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">So sánh tổng chi phí theo kịch bản</h2>
        <p className="text-xs text-slate-500 mt-1">Màu xanh lá = chi phí thấp nhất trong kịch bản</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Kịch bản</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Ngân hàng</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Tổng lãi</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Dư nợ còn lại</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Phí tất toán</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Chi phí phụ</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Chi phí thực (ngoài gốc)</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">Chênh lệch</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(scenario => {
              const scenarioResults = results[scenario.id] || {};
              const costs = banks.map(b => scenarioResults[b.id]?.costExcludingPrincipal ?? Infinity);
              const minCost = Math.min(...costs);

              return banks.map((bank, bankIdx) => {
                const r = scenarioResults[bank.id];
                if (!r) return null;
                const isBest = Math.abs(r.costExcludingPrincipal - minCost) < 1;
                const diff = r.costExcludingPrincipal - minCost;

                return (
                  <tr
                    key={`${scenario.id}-${bank.id}`}
                    className={`border-b border-slate-100 ${isBest ? 'bg-green-50' : ''}`}
                  >
                    {bankIdx === 0 && (
                      <td
                        className="px-4 py-3 font-medium text-slate-700 align-top whitespace-nowrap"
                        rowSpan={banks.length}
                      >
                        {scenario.label}
                        {!r.isFullTerm && (
                          <div className="text-xs text-slate-400 font-normal">Tháng {r.settleMonth}</div>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bank.color }} />
                        <span style={{ color: bank.color }} className="font-medium">{bank.name}</span>
                        {isBest && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Tốt nhất</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatVND(r.totalInterestPaid)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {r.isFullTerm ? <span className="text-green-600 text-xs">Đã tất toán</span> : formatVND(r.remainingBalance)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.prepaymentFee > 0 ? (
                        <span className="text-red-600">{formatVND(r.prepaymentFee)}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">{r.isFullTerm ? 'Không có' : '0 đ'}</span>
                      )}
                      {r.prepaymentFeeRate > 0 && (
                        <div className="text-xs text-slate-400">{r.prepaymentFeeRate}% dư nợ</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {r.totalAdditional > 0 ? formatVND(r.totalAdditional) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: isBest ? '#16a34a' : '#1e293b' }}>
                      {formatVND(r.costExcludingPrincipal)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isBest ? (
                        <span className="text-xs font-medium text-green-600">Rẻ nhất</span>
                      ) : (
                        <span className="text-red-600 font-medium">+{formatVND(diff)}</span>
                      )}
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
