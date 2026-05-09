export default function ScenarioSection({ scenarios, loanTermMonths, onChange, onAdd, onRemove }) {
  function updateScenario(id, field, value) {
    onChange(scenarios.map(s => s.id === id ? { ...s, [field]: value } : s));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Kịch bản tất toán</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map(s => (
          <div key={s.id} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex-1">
              <input
                type="text"
                className="w-full text-sm font-medium text-slate-700 bg-transparent border-0 focus:outline-none mb-1"
                value={s.label}
                onChange={e => updateScenario(s.id, 'label', e.target.value)}
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">Tất toán tháng thứ</span>
                <input
                  type="number"
                  min="1"
                  max={loanTermMonths}
                  className="w-16 border border-slate-300 rounded px-2 py-0.5 text-xs text-center"
                  value={s.settleMonth}
                  onChange={e => updateScenario(s.id, 'settleMonth', parseInt(e.target.value) || 1)}
                />
                <span className="text-xs text-slate-400">/{loanTermMonths}</span>
              </div>
            </div>
            {scenarios.length > 1 && (
              <button
                className="text-red-400 hover:text-red-600 text-xs px-1"
                onClick={() => onRemove(s.id)}
              >✕</button>
            )}
          </div>
        ))}
        <button
          className="p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-600 text-sm font-medium transition-colors"
          onClick={onAdd}
        >+ Thêm kịch bản</button>
      </div>
    </div>
  );
}
