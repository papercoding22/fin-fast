/**
 * Manages the pool of market reference rates (LSCS, SPR, etc.)
 * that floating-rate formulas can reference.
 */

import DatePicker from "./DatePicker";

let refIdCounter = 200;

export default function ReferenceIndexSection({ indexes, onChange }) {
  function update(id, field, value) {
    console.log("TCL: update -> id, field, value", id, field, value);
    onChange(indexes.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function add() {
    const id = `ref_${++refIdCounter}`;
    onChange([
      ...indexes,
      {
        id,
        name: "Chỉ số mới",
        provider: "",
        currentValue: 0,
        effectiveDate: new Date().toISOString().slice(0, 10),
        adjustmentFrequency: "3 tháng",
        notes: "",
      },
    ]);
  }

  function remove(id) {
    onChange(indexes.filter((r) => r.id !== id));
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Chỉ số tham chiếu lãi suất (LSCS / SPR)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Định nghĩa các chỉ số dùng trong công thức lãi suất thả nổi của từng ngân hàng
          </p>
        </div>
        <button
          className="text-sm px-4 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
          onClick={add}
        >
          + Thêm chỉ số
        </button>
      </div>

      {indexes.length === 0 && (
        <p className="text-sm text-slate-400 py-4 text-center">
          Chưa có chỉ số nào. Nhấn "+ Thêm chỉ số" để bắt đầu.
        </p>
      )}

      <div className="space-y-3">
        {indexes.map((ref) => (
          <div
            key={ref.id}
            className="rounded-xl border border-slate-200 p-4 bg-slate-50 hover:bg-white transition-colors"
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 items-end">
              {/* Tên chỉ số */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tên chỉ số</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={ref.name}
                  onChange={(e) => update(ref.id, "name", e.target.value)}
                  placeholder="LSCS 3M"
                />
              </div>

              {/* Ngân hàng phát hành */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ngân hàng</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={ref.provider}
                  onChange={(e) => update(ref.id, "provider", e.target.value)}
                  placeholder="TPBank"
                />
              </div>

              {/* Giá trị hiện tại */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Giá trị hiện tại (%/năm)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                  value={ref.currentValue}
                  onChange={(e) => update(ref.id, "currentValue", parseFloat(e.target.value) || 0)}
                />
              </div>

              {/* Ngày hiệu lực */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Ngày hiệu lực
                </label>
                <DatePicker
                  value={ref.effectiveDate}
                  onChange={(v) => update(ref.id, "effectiveDate", v)}
                />
              </div>

              {/* Tần suất điều chỉnh */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Tần suất điều chỉnh
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={ref.adjustmentFrequency}
                  onChange={(e) => update(ref.id, "adjustmentFrequency", e.target.value)}
                >
                  <option value="1 tháng">Hàng tháng</option>
                  <option value="3 tháng">3 tháng / lần</option>
                  <option value="6 tháng">6 tháng / lần</option>
                  <option value="12 tháng">12 tháng / lần</option>
                  <option value="Theo thông báo">Theo thông báo</option>
                </select>
              </div>

              {/* Remove button */}
              <div className="flex items-end">
                <button
                  className="w-full text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg py-1.5 transition-colors"
                  onClick={() => remove(ref.id)}
                >
                  Xóa
                </button>
              </div>
            </div>

            {/* Ghi chú */}
            <div className="mt-2">
              <input
                type="text"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                value={ref.notes}
                onChange={(e) => update(ref.id, "notes", e.target.value)}
                placeholder="Ghi chú / nguồn dữ liệu (tuỳ chọn)"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
