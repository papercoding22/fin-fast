import { getPaymentAt, formatVND } from "../utils/loanCalculations";

export default function MonthlyPaymentTable({ banks, schedules, loanTermMonths, onViewDetail }) {
  // Key months to display
  const keyMonths = [
    1,
    ...banks.map((b) => b.fixedMonths),
    ...banks.map((b) => b.fixedMonths + 1),
    36,
    60,
    loanTermMonths,
  ]
    .filter((m) => m >= 1 && m <= loanTermMonths)
    .filter((m, i, arr) => arr.indexOf(m) === i)
    .sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-800">
          Tiền trả hàng tháng tại các mốc quan trọng
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Phương pháp dư nợ giảm dần — gốc trả đều, lãi giảm dần
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                Tháng
              </th>
              {banks.map((bank) => (
                <th
                  key={bank.id}
                  className="text-right px-4 py-3 font-medium whitespace-nowrap"
                  style={{ color: bank.color }}
                >
                  <div>{bank.name}</div>
                  {onViewDetail && (
                    <button
                      className="mt-1 text-[10px] font-normal px-2 py-0.5 rounded border transition-colors hover:opacity-80"
                      style={{ borderColor: bank.color, color: bank.color }}
                      onClick={() => onViewDetail(bank.id)}
                    >
                      Xem chi tiết
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keyMonths.map((month, idx) => {
              const isFixed = banks.some((b) => month === b.fixedMonths);
              const isAfterFixed = banks.some((b) => month === b.fixedMonths + 1);
              return (
                <tr
                  key={month}
                  className={`border-b border-slate-100 ${isFixed ? "bg-blue-50" : isAfterFixed ? "bg-orange-50" : idx % 2 === 0 ? "" : "bg-slate-50/50"}`}
                >
                  <td className="px-4 py-2.5 text-slate-700 font-medium whitespace-nowrap">
                    Tháng {month}
                    {month === 1 && <span className="ml-1 text-xs text-blue-600">(đầu tiên)</span>}
                    {isFixed && <span className="ml-1 text-xs text-blue-600">(cuối ưu đãi)</span>}
                    {isAfterFixed && (
                      <span className="ml-1 text-xs text-orange-600">(đầu thả nổi)</span>
                    )}
                    {month === loanTermMonths && (
                      <span className="ml-1 text-xs text-green-600">(tháng cuối)</span>
                    )}
                  </td>
                  {banks.map((bank) => {
                    const schedule = schedules[bank.id];
                    if (!schedule)
                      return (
                        <td key={bank.id} className="px-4 py-2.5 text-right text-slate-400">
                          —
                        </td>
                      );
                    const payment = getPaymentAt(schedule, month);
                    if (!payment)
                      return (
                        <td key={bank.id} className="px-4 py-2.5 text-right text-slate-400">
                          —
                        </td>
                      );
                    return (
                      <td key={bank.id} className="px-4 py-2.5 text-right">
                        <div className="font-medium text-slate-800">
                          {formatVND(payment.totalPayment)}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Gốc: {formatVND(payment.principal)} | Lãi: {formatVND(payment.interest)}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: bank.color }}>
                          Lãi suất: {payment.annualRate}%/năm
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
