import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatVND } from "../utils/loanCalculations";

function formatMillions(val) {
  if (val >= 1e9) return `${(val / 1e9).toFixed(1)} tỷ`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(0)} tr`;
  return val.toLocaleString("vi-VN");
}

const CustomTooltipVND = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-xs">
      <p className="font-medium text-slate-700 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {formatVND(entry.value)}
        </p>
      ))}
    </div>
  );
};

// Chart 1: Total extra cost per scenario per bank (bar chart)
export function CostComparisonChart({ banks, scenarios, results }) {
  const data = scenarios.map((s) => {
    const row = {
      name: s.label.replace("Tất toán sau ", "TT ").replace("Giữ đến hết hạn", "Hết hạn"),
    };
    banks.forEach((b) => {
      row[b.name] = results[s.id]?.[b.id]?.costExcludingPrincipal ?? 0;
    });
    return row;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">
        Chi phí thực (ngoài gốc) theo kịch bản
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={formatMillions} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltipVND />} />
          <Legend />
          {banks.map((bank) => (
            <Bar key={bank.id} dataKey={bank.name} fill={bank.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Chart 2: Remaining balance over time per bank (line chart)
export function BalanceChart({ banks, schedules }) {
  // Sample every 6 months for readability
  const maxMonths = Math.max(...banks.map((b) => schedules[b.id]?.length ?? 0));
  const samplePoints = [];
  for (let m = 0; m <= maxMonths; m += 6) {
    samplePoints.push(m === 0 ? 1 : m);
  }
  if (samplePoints[samplePoints.length - 1] !== maxMonths) samplePoints.push(maxMonths);

  const data = samplePoints.map((month) => {
    const row = { month: `T${month}` };
    banks.forEach((b) => {
      const schedule = schedules[b.id];
      if (!schedule) {
        row[b.name] = 0;
        return;
      }
      const entry = schedule[month - 1];
      row[b.name] = entry ? entry.remainingAfter : 0;
    });
    return row;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Dư nợ giảm dần theo thời gian</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={3} />
          <YAxis tickFormatter={formatMillions} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltipVND />} />
          <Legend />
          {banks.map((bank) => (
            <Line
              key={bank.id}
              type="monotone"
              dataKey={bank.name}
              stroke={bank.color}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Chart 3: Monthly payment over time
export function MonthlyPaymentChart({ banks, schedules }) {
  const maxMonths = Math.max(...banks.map((b) => schedules[b.id]?.length ?? 0));
  const samplePoints = [];
  for (let m = 1; m <= maxMonths; m += 3) samplePoints.push(m);
  if (samplePoints[samplePoints.length - 1] !== maxMonths) samplePoints.push(maxMonths);

  const data = samplePoints.map((month) => {
    const row = { month: `T${month}` };
    banks.forEach((b) => {
      const schedule = schedules[b.id];
      if (!schedule) {
        row[b.name] = 0;
        return;
      }
      const entry = schedule[month - 1];
      row[b.name] = entry ? entry.totalPayment : 0;
    });
    return row;
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">
        Dòng tiền thanh toán hàng tháng
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={5} />
          <YAxis tickFormatter={formatMillions} tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltipVND />} />
          <Legend />
          {banks.map((bank) => (
            <Line
              key={bank.id}
              type="monotone"
              dataKey={bank.name}
              stroke={bank.color}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
