import { useState, useMemo } from "react";
import {
  formatVND,
  buildSchedule,
  calcScenario,
  getPrepaymentFeeRate,
  resolveAdditionalCosts,
  calcEffectiveRate,
  computeFloatingRate,
  scheduleToCSV,
} from "../utils/loanCalculations";
import { STRESS_OFFSETS } from "../data/defaultData";

// ─── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, accent, warn }) {
  let bg = "bg-white border-slate-200";
  let textColor = "text-slate-900";
  if (accent) {
    bg = "bg-blue-50 border-blue-200";
    textColor = "text-blue-700";
  }
  if (warn) {
    bg = "bg-amber-50 border-amber-200";
    textColor = "text-amber-800";
  }
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${textColor}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Floating rate info panel ──────────────────────────────────────────────────

function FloatingRateInfoPanel({ bank, referenceIndexes }) {
  const mode = bank.floatingRateMode ?? "direct";
  const ref = referenceIndexes?.find((r) => r.id === bank.refIndexId);

  if (mode === "direct") {
    return (
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-xs font-semibold text-slate-600 mb-1">Lãi suất thả nổi</p>
        <p className="text-xl font-bold text-slate-800">{bank.floatingRate}%/năm</p>
        <p className="text-xs text-slate-400 mt-1">
          Nhập trực tiếp — không liên kết chỉ số tham chiếu
        </p>
        <p className="text-xs text-orange-600 mt-2 font-medium">
          ⚠ Lãi suất thả nổi có thể thay đổi theo quyết định của ngân hàng
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
      <p className="text-xs font-semibold text-blue-700 mb-2">Công thức lãi suất thả nổi</p>

      {/* Formula display */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-mono font-semibold text-blue-800">
          {ref ? ref.name : "?"}
        </span>
        <span className="text-slate-500 font-medium">+</span>
        <span className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm font-mono font-semibold text-blue-800">
          {bank.spread ?? 0}%
        </span>
        <span className="text-slate-500 font-medium">=</span>
        <span className="px-3 py-1.5 bg-blue-600 rounded-lg text-sm font-bold text-white">
          {bank.floatingRate.toFixed(2)}%/năm
        </span>
      </div>

      {ref ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-blue-600">Chỉ số tham chiếu:</span>{" "}
            <span className="font-medium text-slate-800">{ref.name}</span>
          </div>
          <div>
            <span className="text-blue-600">Ngân hàng phát hành:</span>{" "}
            <span className="font-medium text-slate-800">{ref.provider}</span>
          </div>
          <div>
            <span className="text-blue-600">Giá trị hiện tại:</span>{" "}
            <span className="font-semibold text-slate-900">{ref.currentValue}%/năm</span>
          </div>
          <div>
            <span className="text-blue-600">Ngày hiệu lực:</span>{" "}
            <span className="font-medium text-slate-800">{ref.effectiveDate}</span>
          </div>
          <div>
            <span className="text-blue-600">Tần suất điều chỉnh:</span>{" "}
            <span className="font-medium text-slate-800">{ref.adjustmentFrequency}</span>
          </div>
          <div>
            <span className="text-blue-600">Biên độ cộng thêm:</span>{" "}
            <span className="font-medium text-slate-800">+{bank.spread}%</span>
          </div>
          {ref.notes && <div className="col-span-2 mt-1 text-slate-500 italic">{ref.notes}</div>}
        </div>
      ) : (
        <p className="text-xs text-amber-600">⚠ Chưa liên kết chỉ số tham chiếu</p>
      )}

      <p className="text-xs text-orange-600 mt-3 font-medium">
        ⚠ Lãi suất thả nổi sẽ được ngân hàng điều chỉnh định kỳ theo{" "}
        {ref?.adjustmentFrequency ?? "—"} — số liệu chỉ mang tính tham khảo tại thời điểm hiện tại.
      </p>
    </div>
  );
}

// ─── Stress test table ─────────────────────────────────────────────────────────

function StressTestSection({ bank, loan, additionalCosts, referenceIndexes }) {
  const mode = bank.floatingRateMode ?? "direct";
  const ref = referenceIndexes?.find((r) => r.id === bank.refIndexId);

  // Compute results for each offset
  const stressResults = useMemo(() => {
    return STRESS_OFFSETS.map((offset) => {
      const floatingRate = computeFloatingRate(bank, referenceIndexes ?? [], offset);
      const schedule = buildSchedule(
        loan.loanAmount,
        loan.loanTermMonths,
        bank.fixedRate,
        bank.fixedMonths,
        floatingRate
      );
      const fullTermResult = calcScenario(
        schedule,
        loan.loanTermMonths,
        bank.prepaymentFees,
        additionalCosts
      );
      const settle36 = calcScenario(
        schedule,
        Math.min(36, loan.loanTermMonths),
        bank.prepaymentFees,
        additionalCosts
      );
      return { offset, floatingRate, fullTermResult, settle36 };
    });
  }, [bank, loan, additionalCosts, referenceIndexes]);

  const baseResult = stressResults.find((r) => r.offset === 0);

  const indexLabel =
    mode === "formula" && ref ? `${ref.name} (hiện tại ${ref.currentValue}%)` : "Lãi suất thả nổi";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="text-base font-semibold text-slate-800">Stress Test lãi suất</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tác động khi {indexLabel} thay đổi — so sánh tổng lãi và tổng chi phí thực tế
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                Kịch bản
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                Lãi sau ưu đãi
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                Tổng lãi (hết hạn)
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                Chi phí ngoài gốc (hết hạn)
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                Chênh lệch vs hiện tại
              </th>
              <th className="text-right px-4 py-3 font-medium text-slate-600 whitespace-nowrap">
                Tổng lãi (36 tháng)
              </th>
            </tr>
          </thead>
          <tbody>
            {stressResults.map(({ offset, floatingRate, fullTermResult, settle36 }) => {
              const isBase = offset === 0;
              const diff = baseResult
                ? fullTermResult.costExcludingPrincipal -
                  baseResult.fullTermResult.costExcludingPrincipal
                : 0;

              let rowBg = "";
              if (isBase) rowBg = "bg-blue-50";
              else if (offset > 0) rowBg = offset >= 2 ? "bg-red-50" : "bg-orange-50";
              else rowBg = "bg-green-50";

              const label =
                offset === 0
                  ? "Giữ nguyên (hiện tại)"
                  : offset > 0
                    ? `Tăng ${offset}% (${indexLabel.split(" ")[0]} + ${offset}%)`
                    : `Giảm ${Math.abs(offset)}% (${indexLabel.split(" ")[0]} − ${Math.abs(offset)}%)`;

              return (
                <tr key={offset} className={`border-b border-slate-100 ${rowBg}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {isBase && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          Hiện tại
                        </span>
                      )}
                      <span className="text-slate-700 font-medium text-xs">{label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span
                      className={
                        offset > 0
                          ? "text-red-700"
                          : offset < 0
                            ? "text-green-700"
                            : "text-blue-700"
                      }
                    >
                      {floatingRate.toFixed(2)}%/năm
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {formatVND(fullTermResult.totalInterestPaid)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatVND(fullTermResult.costExcludingPrincipal)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isBase ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : diff > 0 ? (
                      <span className="text-red-600 font-medium">+{formatVND(diff)}</span>
                    ) : (
                      <span className="text-green-600 font-medium">{formatVND(diff)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">
                    {formatVND(settle36.totalInterestPaid)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-orange-50 border-t border-orange-100">
        <p className="text-xs text-orange-700">
          ⚠ Stress test giả định lãi suất thay đổi ngay từ tháng ưu đãi kết thúc và giữ nguyên đến
          hết kỳ hạn. Thực tế lãi suất có thể biến động nhiều lần trong suốt thời gian vay.
        </p>
      </div>
    </div>
  );
}

// ─── Amortization table ────────────────────────────────────────────────────────

function AmortizationTable({ schedule, bank, referenceIndexes }) {
  const [showMonths, setShowMonths] = useState(schedule.length);

  const FILTERS = [
    { label: "12 tháng", months: 12 },
    { label: "36 tháng", months: 36 },
    { label: "60 tháng", months: 60 },
    { label: `Tất cả (${schedule.length} tháng)`, months: schedule.length },
  ].filter((f) => f.months <= schedule.length);

  const visible = schedule.slice(0, showMonths);
  const totalPrincipal = visible.reduce((s, r) => s + r.principal, 0);
  const totalInterest = visible.reduce((s, r) => s + r.interest, 0);
  const totalPayment = visible.reduce((s, r) => s + r.totalPayment, 0);

  function downloadCSV() {
    // Build floating rate meta for richer CSV
    const ref = referenceIndexes?.find((r) => r.id === bank.refIndexId);
    const meta =
      bank.floatingRateMode === "formula" && ref
        ? {
            formula: `${ref.name} + ${bank.spread}% = ${bank.floatingRate.toFixed(2)}%/năm`,
            refName: ref.name,
            refValue: ref.currentValue,
            effectiveDate: ref.effectiveDate,
            adjustmentFrequency: ref.adjustmentFrequency,
            spread: bank.spread,
          }
        : null;

    const csv = scheduleToCSV(schedule, bank.name, meta);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lich-tra-no-${bank.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Lịch trả nợ chi tiết</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dòng nền cam = bắt đầu lãi suất thả nổi (từ tháng {bank.fixedMonths + 1})
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {FILTERS.map((f) => (
              <button
                key={f.months}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${showMonths === f.months ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                onClick={() => setShowMonths(f.months)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-700 border border-slate-300 hover:border-blue-400 rounded-lg px-3 py-1.5 transition-colors"
            onClick={downloadCSV}
          >
            ↓ Xuất CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="border-b border-slate-200">
              <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                Tháng
              </th>
              <th className="text-center px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                Lãi suất
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                Dư nợ đầu kỳ
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                Gốc trả
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                Lãi trả
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                Tổng trả tháng
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-slate-600 whitespace-nowrap">
                Dư nợ cuối kỳ
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => {
              const openingBalance =
                i === 0 ? row.principal * schedule.length : schedule[i - 1].remainingAfter;
              const isTransition = row.month === bank.fixedMonths + 1;
              const isFixed = row.month <= bank.fixedMonths;

              return (
                <tr
                  key={row.month}
                  className={`border-b border-slate-100 hover:bg-slate-50/70 ${isTransition ? "bg-orange-50 border-orange-200" : ""}`}
                >
                  <td className="px-3 py-2 text-center font-medium text-slate-700">
                    {row.month}
                    {isTransition && (
                      <div className="text-orange-600 text-[10px] font-semibold leading-tight">
                        thả nổi
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${isFixed ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}
                    >
                      {row.annualRate}%/năm
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right text-slate-600">
                    {formatVND(openingBalance)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {formatVND(row.principal)}
                  </td>
                  <td className="px-3 py-2 text-right text-red-600">{formatVND(row.interest)}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">
                    {formatVND(row.totalPayment)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">
                    {formatVND(row.remainingAfter)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0 bg-slate-100 border-t-2 border-slate-300">
            <tr>
              <td colSpan={3} className="px-3 py-2.5 font-semibold text-slate-700 text-xs">
                Tổng cộng ({showMonths} tháng)
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                {formatVND(totalPrincipal)}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold text-red-600">
                {formatVND(totalInterest)}
              </td>
              <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                {formatVND(totalPayment)}
              </td>
              <td className="px-3 py-2.5 text-right text-slate-400 text-xs">
                {showMonths === schedule.length
                  ? "Đã tất toán"
                  : formatVND(schedule[showMonths - 1]?.remainingAfter)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Prepayment simulator ──────────────────────────────────────────────────────

function PrepaymentSimulator({ schedule, bank, additionalCosts }) {
  const loanTermMonths = schedule.length;
  const [settleMonth, setSettleMonth] = useState(Math.min(36, loanTermMonths));

  const result = useMemo(() => {
    if (!schedule.length) return null;
    const isFullTerm = settleMonth >= loanTermMonths;
    const effective = isFullTerm ? loanTermMonths : settleMonth;

    let principalPaid = 0;
    let interestPaid = 0;
    for (let i = 0; i < effective; i++) {
      principalPaid += schedule[i].principal;
      interestPaid += schedule[i].interest;
    }
    const remaining = isFullTerm ? 0 : schedule[effective - 1].remainingAfter;
    const penaltyRate = isFullTerm ? 0 : getPrepaymentFeeRate(bank.prepaymentFees, effective);
    const penalty = (remaining * penaltyRate) / 100;
    const extraCosts = additionalCosts.reduce((s, c) => s + (c.amount || 0), 0);
    const totalPayoffCash = remaining + penalty;
    const totalActualCost = principalPaid + remaining + interestPaid + penalty + extraCosts;

    return {
      isFullTerm,
      effective,
      principalPaid,
      interestPaid,
      remaining,
      penaltyRate,
      penalty,
      extraCosts,
      totalPayoffCash,
      totalActualCost,
      costExcludingPrincipal: interestPaid + penalty + extraCosts,
      year: Math.ceil(effective / 12),
    };
  }, [schedule, settleMonth, bank.prepaymentFees, additionalCosts, loanTermMonths]);

  if (!result) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-5">Mô phỏng tất toán sớm</h3>

      {/* Slider control */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Tất toán tại tháng thứ</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={loanTermMonths}
              value={settleMonth}
              onChange={(e) =>
                setSettleMonth(Math.max(1, Math.min(loanTermMonths, parseInt(e.target.value) || 1)))
              }
              className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-500">/ {loanTermMonths}</span>
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={loanTermMonths}
          value={settleMonth}
          onChange={(e) => setSettleMonth(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>Tháng 1</span>
          {loanTermMonths > 24 && <span>Tháng {Math.round(loanTermMonths / 2)}</span>}
          <span>Tháng {loanTermMonths}</span>
        </div>
        {result.isFullTerm && (
          <p className="mt-2 text-xs text-green-600 font-medium">
            Tất toán đúng hạn — không phát sinh phí phạt.
          </p>
        )}
      </div>

      {/* Result grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 mb-5">
        {[
          ["Tháng tất toán", `Tháng ${result.effective} (Năm ${result.year})`, ""],
          ["Gốc đã trả", formatVND(result.principalPaid), ""],
          ["Lãi đã trả", formatVND(result.interestPaid), "text-red-600"],
          ["Dư nợ còn lại", result.isFullTerm ? "0 đ" : formatVND(result.remaining), ""],
          [
            "Phí tất toán" + (result.penaltyRate > 0 ? ` (${result.penaltyRate}%)` : ""),
            result.penalty > 0 ? formatVND(result.penalty) : "Miễn phí",
            result.penalty > 0 ? "text-red-600" : "text-green-600",
          ],
          ["Chi phí phụ", result.extraCosts > 0 ? formatVND(result.extraCosts) : "—", ""],
        ].map(([label, val, color]) => (
          <div key={label} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`font-bold text-slate-900 ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs font-medium text-amber-700 mb-1">Tiền cần chuẩn bị để tất toán</p>
          <p className="text-xl font-bold text-amber-900">{formatVND(result.totalPayoffCash)}</p>
          <p className="text-xs text-amber-600 mt-1">
            = Dư nợ ({formatVND(result.remaining)}) + Phí phạt ({formatVND(result.penalty)})
          </p>
        </div>
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-xs font-medium text-blue-700 mb-1">
            Tổng chi phí thực nếu tất toán lúc này
          </p>
          <p className="text-xl font-bold text-blue-900">{formatVND(result.totalActualCost)}</p>
          <p className="text-xs text-blue-600 mt-1">
            Chi phí ngoài gốc: {formatVND(result.costExcludingPrincipal)}
          </p>
        </div>
      </div>

      {/* Fee table */}
      {bank.prepaymentFees.length > 0 && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-600 mb-2">
            Biểu phí tất toán của {bank.name}:
          </p>
          <div className="flex flex-wrap gap-2">
            {bank.prepaymentFees.map((f, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-full border ${
                  result.year <= f.upToYear &&
                  (i === 0 || result.year > bank.prepaymentFees[i - 1]?.upToYear)
                    ? "bg-orange-100 border-orange-300 text-orange-700 font-medium"
                    : "bg-white border-slate-200 text-slate-500"
                }`}
              >
                {f.upToYear >= 999
                  ? `Năm ${(bank.prepaymentFees[i - 1]?.upToYear ?? 0) + 1}+`
                  : `Đến năm ${f.upToYear}`}
                : {f.rate}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main BankDetailView ───────────────────────────────────────────────────────

export default function BankDetailView({ bank, loan, schedule, referenceIndexes, onBack }) {
  const additionalCosts = useMemo(
    () => resolveAdditionalCosts(bank, loan.carPrice, loan.loanAmount),
    [bank, loan]
  );

  const fullTermResult = useMemo(() => {
    if (!schedule?.length) return null;
    return calcScenario(schedule, schedule.length, bank.prepaymentFees, additionalCosts);
  }, [schedule, bank.prepaymentFees, additionalCosts]);

  if (!schedule?.length || !fullTermResult) return null;

  const firstPayment = schedule[0]?.totalPayment ?? 0;
  const lastPayment = schedule[schedule.length - 1]?.totalPayment ?? 0;
  const effectiveRate = calcEffectiveRate(
    bank.fixedRate,
    bank.fixedMonths,
    bank.floatingRate,
    loan.loanTermMonths
  );
  const milestones = [12, 24, 36, 48, 60, 72].filter((m) => m < loan.loanTermMonths);

  return (
    <div className="space-y-6">
      {/* Back / breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          onClick={onBack}
        >
          ← Quay lại
        </button>
        <div className="h-5 w-px bg-slate-300" />
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bank.color }} />
          <h2 className="text-lg font-bold" style={{ color: bank.color }}>
            {bank.name}
          </h2>
          <span className="text-slate-400 text-sm">— Kế hoạch vay chi tiết</span>
        </div>
      </div>

      {/* Floating rate info + loan overview side-by-side on large screens */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Floating rate formula panel */}
        <div className="lg:col-span-1">
          <FloatingRateInfoPanel bank={bank} referenceIndexes={referenceIndexes ?? []} />
        </div>

        {/* Loan overview */}
        <div
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-5"
          style={{ borderLeft: `4px solid ${bank.color}` }}
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Tổng quan khoản vay</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
            {[
              ["Giá xe lăn bánh", formatVND(loan.carPrice)],
              ["Tiền tự có", formatVND(loan.downPayment)],
              ["Số tiền vay", formatVND(loan.loanAmount)],
              ["Thời hạn vay", `${loan.loanTermMonths} tháng`],
              ["Phương pháp", "Dư nợ giảm dần"],
              ["Lãi ưu đãi", `${bank.fixedRate}%/năm (${bank.fixedMonths} tháng)`],
              ["Lãi thả nổi", `${bank.floatingRate.toFixed(2)}%/năm`],
              ["Tỷ lệ vay tối đa", `${bank.maxLtvPercent}%`],
              ["Lãi suất BQ (ước tính)", `${effectiveRate.toFixed(2)}%/năm`],
            ].map(([label, val]) => (
              <div key={label}>
                <span className="text-slate-400 text-xs">{label}</span>
                <div className="font-medium text-slate-800 mt-0.5 text-sm">{val}</div>
              </div>
            ))}
          </div>

          {milestones.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1.5">Dư nợ tại các mốc:</p>
              <div className="flex flex-wrap gap-2">
                {milestones.map((m) => {
                  const entry = schedule[m - 1];
                  if (!entry) return null;
                  return (
                    <div
                      key={m}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1"
                    >
                      <span className="text-slate-400">T{m}: </span>
                      <span className="font-medium text-slate-700">
                        {formatVND(entry.remainingAfter)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          label="Số tiền vay"
          value={formatVND(loan.loanAmount)}
          sub="Gốc cần hoàn trả"
        />
        <SummaryCard
          label="Tổng lãi (hết kỳ hạn)"
          value={formatVND(fullTermResult.totalInterestPaid)}
          accent
        />
        <SummaryCard
          label="Chi phí phụ"
          value={
            fullTermResult.totalAdditional > 0
              ? formatVND(fullTermResult.totalAdditional)
              : "Không có"
          }
        />
        <SummaryCard
          label="Chi phí ngoài gốc"
          value={formatVND(fullTermResult.costExcludingPrincipal)}
          accent
          sub="Lãi + phí + chi phí phụ"
        />
        <SummaryCard label="Tổng chi phí (gồm gốc)" value={formatVND(fullTermResult.totalCost)} />
        <SummaryCard
          label="Trả tháng đầu tiên"
          value={formatVND(firstPayment)}
          sub={`Lãi suất ${bank.fixedRate}%/năm`}
        />
        <SummaryCard
          label="Trả tháng cuối"
          value={formatVND(lastPayment)}
          sub={`Lãi suất ${bank.floatingRate.toFixed(2)}%/năm`}
        />
        <SummaryCard
          label="Lãi suất BQ ước tính"
          value={`${effectiveRate.toFixed(2)}%/năm`}
          sub="Trung bình có trọng số"
          warn={effectiveRate > 12}
        />
      </div>

      {/* Additional costs */}
      {additionalCosts.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2">Chi phí phụ / ràng buộc</h3>
          <div className="space-y-1.5">
            {additionalCosts.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-amber-700">{c.label || `Chi phí ${i + 1}`}</span>
                <span className="font-medium text-amber-900">
                  {formatVND(c.amount)}
                  {c.type !== "fixed" && (
                    <span className="text-xs text-amber-600 ml-1">({c.percent}%)</span>
                  )}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-semibold border-t border-amber-300 pt-1.5 mt-1.5">
              <span className="text-amber-800">Tổng chi phí phụ</span>
              <span className="text-amber-900">{formatVND(fullTermResult.totalAdditional)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stress test */}
      <StressTestSection
        bank={bank}
        loan={loan}
        additionalCosts={additionalCosts}
        referenceIndexes={referenceIndexes ?? []}
      />

      {/* Amortization table */}
      <AmortizationTable schedule={schedule} bank={bank} referenceIndexes={referenceIndexes} />

      {/* Prepayment simulator */}
      <PrepaymentSimulator schedule={schedule} bank={bank} additionalCosts={additionalCosts} />
    </div>
  );
}
