import { formatVND } from '../utils/loanCalculations';

export default function ConclusionSection({ banks, scenarios, results }) {
  // For each scenario, find the best bank (lowest costExcludingPrincipal)
  const conclusions = scenarios.map(scenario => {
    const scenarioResults = results[scenario.id] || {};
    const bankResults = banks.map(b => ({
      bank: b,
      result: scenarioResults[b.id],
    })).filter(x => x.result);

    if (bankResults.length === 0) return null;

    bankResults.sort((a, b) => a.result.costExcludingPrincipal - b.result.costExcludingPrincipal);
    const best = bankResults[0];
    const others = bankResults.slice(1);

    return { scenario, best, others };
  }).filter(Boolean);

  // Find which bank wins most often
  const winCount = {};
  banks.forEach(b => { winCount[b.id] = 0; });
  conclusions.forEach(c => { if (c.best) winCount[c.best.bank.id] = (winCount[c.best.bank.id] || 0) + 1; });

  const overallBestId = Object.entries(winCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const overallBest = banks.find(b => b.id === overallBestId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Kết luận tự động</h2>

      {/* Overall winner */}
      {overallBest && (
        <div className="mb-5 p-4 rounded-xl border-2" style={{ borderColor: overallBest.color, backgroundColor: overallBest.color + '10' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: overallBest.color }} />
            <span className="font-semibold text-slate-800">
              {overallBest.name} chiến thắng trong {winCount[overallBest.id]}/{scenarios.length} kịch bản
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Đây là ngân hàng tốt nhất tổng thể theo các kịch bản bạn đã nhập.
          </p>
        </div>
      )}

      {/* Per-scenario conclusions */}
      <div className="space-y-3">
        {conclusions.map(({ scenario, best, others }) => (
          <div key={scenario.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-medium text-slate-700 mb-2">{scenario.label}</div>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">
                    {best.bank.name}: {formatVND(best.result.costExcludingPrincipal)} chi phí thực
                  </span>
                </div>
                {!best.result.isFullTerm && best.result.prepaymentFee > 0 && (
                  <p className="text-xs text-slate-500 ml-4 mt-0.5">
                    Gồm phí tất toán {formatVND(best.result.prepaymentFee)} ({best.result.prepaymentFeeRate}% dư nợ)
                  </p>
                )}
              </div>
              {others.map(({ bank, result }) => (
                <div key={bank.id} className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: bank.color }} />
                    <span className="text-sm font-medium" style={{ color: bank.color }}>
                      {bank.name}: {formatVND(result.costExcludingPrincipal)}
                    </span>
                  </div>
                  <p className="text-xs text-red-500 ml-4 mt-0.5">
                    Đắt hơn +{formatVND(result.costExcludingPrincipal - best.result.costExcludingPrincipal)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bank-specific scenario wins */}
      {banks.length > 1 && (
        <div className="mt-5 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Ngân hàng nào phù hợp với kịch bản nào?</h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {banks.map(bank => {
              const winScenarios = conclusions.filter(c => c.best.bank.id === bank.id).map(c => c.scenario.label);
              const loseScenarios = conclusions.filter(c => c.best.bank.id !== bank.id).map(c => c.scenario.label);
              return (
                <div key={bank.id} className="p-3 rounded-lg border" style={{ borderColor: bank.color + '40', backgroundColor: bank.color + '08' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bank.color }} />
                    <span className="font-medium text-slate-700" style={{ color: bank.color }}>{bank.name}</span>
                  </div>
                  {winScenarios.length > 0 && (
                    <div className="mb-1">
                      <span className="text-xs font-medium text-green-600">✓ Có lợi hơn khi: </span>
                      <span className="text-xs text-slate-600">{winScenarios.join(', ')}</span>
                    </div>
                  )}
                  {loseScenarios.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-red-500">✗ Kém hơn khi: </span>
                      <span className="text-xs text-slate-500">{loseScenarios.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
