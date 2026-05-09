import { useState, useMemo } from 'react';
import LoanInputSection from './components/LoanInputSection';
import BankInputSection from './components/BankInputSection';
import ScenarioSection from './components/ScenarioSection';
import MonthlyPaymentTable from './components/MonthlyPaymentTable';
import ComparisonTable from './components/ComparisonTable';
import ConclusionSection from './components/ConclusionSection';
import { CostComparisonChart, BalanceChart, MonthlyPaymentChart } from './components/Charts';
import { buildSchedule, calcScenario } from './utils/loanCalculations';
import { DEFAULT_LOAN, DEFAULT_BANKS, DEFAULT_SCENARIOS } from './data/defaultData';

const BANK_COLORS = ['#7c3aed', '#0891b2', '#059669', '#dc2626', '#d97706', '#db2777', '#0f766e'];

let bankIdCounter = 100;
let scenarioIdCounter = 100;

function resolveAdditionalCosts(bank, carPrice, loanAmount) {
  return bank.additionalCosts.map(cost => {
    let amount = cost.amount;
    if (cost.type === 'percent_car') amount = carPrice * cost.percent / 100;
    if (cost.type === 'percent_loan') amount = loanAmount * cost.percent / 100;
    return { ...cost, amount };
  });
}

export default function App() {
  const [loan, setLoan] = useState(DEFAULT_LOAN);
  const [banks, setBanks] = useState(DEFAULT_BANKS);
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [activeTab, setActiveTab] = useState('input');

  // Build amortization schedules for all banks
  const schedules = useMemo(() => {
    const result = {};
    banks.forEach(bank => {
      result[bank.id] = buildSchedule(
        loan.loanAmount,
        loan.loanTermMonths,
        bank.fixedRate,
        bank.fixedMonths,
        bank.floatingRate
      );
    });
    return result;
  }, [banks, loan]);

  // Calculate scenario results for all banks and scenarios
  const results = useMemo(() => {
    const output = {};
    scenarios.forEach(scenario => {
      output[scenario.id] = {};
      banks.forEach(bank => {
        const schedule = schedules[bank.id];
        if (!schedule) return;
        const additionalCosts = resolveAdditionalCosts(bank, loan.carPrice, loan.loanAmount);
        output[scenario.id][bank.id] = calcScenario(
          schedule,
          scenario.settleMonth,
          bank.prepaymentFees,
          additionalCosts
        );
      });
    });
    return output;
  }, [banks, schedules, scenarios, loan.carPrice, loan.loanAmount]);

  function addBank() {
    const id = `bank_${++bankIdCounter}`;
    const colorIdx = banks.length % BANK_COLORS.length;
    setBanks(prev => [...prev, {
      id,
      name: 'Ngân hàng mới',
      color: BANK_COLORS[colorIdx],
      fixedRate: 9.0,
      fixedMonths: 12,
      floatingRate: 11.5,
      maxLtvPercent: 80,
      maxTermMonths: 96,
      prepaymentFees: [
        { upToYear: 2, rate: 3 },
        { upToYear: 4, rate: 1.5 },
        { upToYear: 999, rate: 0 },
      ],
      additionalCosts: [],
    }]);
  }

  function removeBank(id) {
    setBanks(prev => prev.filter(b => b.id !== id));
  }

  function addScenario() {
    const id = `s_${++scenarioIdCounter}`;
    setScenarios(prev => [...prev, { id, label: 'Kịch bản mới', settleMonth: 48 }]);
  }

  function removeScenario(id) {
    setScenarios(prev => prev.filter(s => s.id !== id));
  }

  const TABS = [
    { key: 'input', label: 'Nhập liệu' },
    { key: 'results', label: 'Kết quả' },
    { key: 'charts', label: 'Biểu đồ' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">So sánh vay mua ô tô</h1>
            <p className="text-xs text-slate-500">Tính toán và so sánh chi phí vay giữa các ngân hàng</p>
          </div>
          <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {TABS.map(tab => (
              <button
                key={tab.key}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === 'input' && (
          <>
            <LoanInputSection loan={loan} onChange={setLoan} />

            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Thông tin ngân hàng</h2>
              <BankInputSection
                banks={banks}
                loan={loan}
                onChange={setBanks}
                onAdd={addBank}
                onRemove={removeBank}
              />
            </div>

            <ScenarioSection
              scenarios={scenarios}
              loanTermMonths={loan.loanTermMonths}
              onChange={setScenarios}
              onAdd={addScenario}
              onRemove={removeScenario}
            />

            <div className="flex justify-end">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors shadow"
                onClick={() => setActiveTab('results')}
              >
                Xem kết quả →
              </button>
            </div>
          </>
        )}

        {activeTab === 'results' && (
          <>
            <MonthlyPaymentTable
              banks={banks}
              schedules={schedules}
              loanTermMonths={loan.loanTermMonths}
            />
            <ComparisonTable banks={banks} scenarios={scenarios} results={results} />
            <ConclusionSection banks={banks} scenarios={scenarios} results={results} />
          </>
        )}

        {activeTab === 'charts' && (
          <>
            <CostComparisonChart banks={banks} scenarios={scenarios} results={results} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <BalanceChart banks={banks} schedules={schedules} />
              <MonthlyPaymentChart banks={banks} schedules={schedules} />
            </div>
          </>
        )}
      </main>

      <footer className="text-center text-xs text-slate-400 py-8 mt-4">
        Công cụ tính toán tham khảo — không phải tư vấn tài chính chính thức
      </footer>
    </div>
  );
}
