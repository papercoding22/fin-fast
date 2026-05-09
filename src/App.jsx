import { useState, useMemo } from 'react';
import LoanInputSection from './components/LoanInputSection';
import BankInputSection from './components/BankInputSection';
import ReferenceIndexSection from './components/ReferenceIndexSection';
import ScenarioSection from './components/ScenarioSection';
import MonthlyPaymentTable from './components/MonthlyPaymentTable';
import ComparisonTable from './components/ComparisonTable';
import ConclusionSection from './components/ConclusionSection';
import BankDetailView from './components/BankDetailView';
import { CostComparisonChart, BalanceChart, MonthlyPaymentChart } from './components/Charts';
import { buildSchedule, calcScenario, resolveAdditionalCosts, computeFloatingRate } from './utils/loanCalculations';
import { DEFAULT_LOAN, DEFAULT_BANKS, DEFAULT_SCENARIOS, DEFAULT_REFERENCE_INDEXES } from './data/defaultData';

const BANK_COLORS = ['#7c3aed', '#0891b2', '#059669', '#dc2626', '#d97706', '#db2777', '#0f766e'];

let bankIdCounter = 100;
let scenarioIdCounter = 100;

export default function App() {
  const [loan, setLoan] = useState(DEFAULT_LOAN);
  const [banks, setBanks] = useState(DEFAULT_BANKS);
  const [referenceIndexes, setReferenceIndexes] = useState(DEFAULT_REFERENCE_INDEXES);
  const [scenarios, setScenarios] = useState(DEFAULT_SCENARIOS);
  const [activeTab, setActiveTab] = useState('input');
  const [detailBankId, setDetailBankId] = useState(null);

  // Keep each bank's floatingRate in sync whenever a reference index value changes
  const banksWithComputedRates = useMemo(() => {
    return banks.map(bank => {
      if (bank.floatingRateMode !== 'formula') return bank;
      const computed = computeFloatingRate(bank, referenceIndexes);
      return computed !== bank.floatingRate ? { ...bank, floatingRate: computed } : bank;
    });
  }, [banks, referenceIndexes]);

  // Build amortization schedules for all banks
  const schedules = useMemo(() => {
    const term = parseInt(loan.loanTermMonths);
    if (!term || term <= 0) return {};
    const result = {};
    banksWithComputedRates.forEach(bank => {
      result[bank.id] = buildSchedule(
        loan.loanAmount,
        term,
        bank.fixedRate,
        bank.fixedMonths,
        bank.floatingRate
      );
    });
    return result;
  }, [banksWithComputedRates, loan]);

  // Calculate scenario results for all banks and scenarios
  const results = useMemo(() => {
    const output = {};
    scenarios.forEach(scenario => {
      output[scenario.id] = {};
      banksWithComputedRates.forEach(bank => {
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
  }, [banksWithComputedRates, schedules, scenarios, loan.carPrice, loan.loanAmount]);

  function addBank() {
    const id = `bank_${++bankIdCounter}`;
    const colorIdx = banks.length % BANK_COLORS.length;
    setBanks(prev => [...prev, {
      id,
      name: 'Ngân hàng mới',
      color: BANK_COLORS[colorIdx],
      fixedRate: 9.0,
      fixedMonths: 12,
      floatingRateMode: 'direct',
      refIndexId: null,
      spread: 0,
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

  // When BankInputSection changes banks, also recompute formula-based rates
  function handleBanksChange(newBanks) {
    setBanks(newBanks.map(bank => {
      if (bank.floatingRateMode !== 'formula') return bank;
      return { ...bank, floatingRate: computeFloatingRate(bank, referenceIndexes) };
    }));
  }

  // When a reference index value changes, persist it — banksWithComputedRates reacts automatically
  function handleReferenceIndexesChange(newIndexes) {
    setReferenceIndexes(newIndexes);
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

  const detailBank = detailBankId ? banksWithComputedRates.find(b => b.id === detailBankId) : null;

  function handleViewDetail(bankId) {
    setDetailBankId(bankId);
    setActiveTab('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleTabClick(key) {
    setActiveTab(key);
    setDetailBankId(null);
  }

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
                  activeTab === tab.key && !detailBank
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.label}
              </button>
            ))}
            {detailBank && (
              <>
                <div className="w-px bg-slate-300 mx-1 self-stretch" />
                <div
                  className="px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm flex items-center gap-1.5"
                  style={{ color: detailBank.color }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: detailBank.color }} />
                  {detailBank.name}
                </div>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === 'input' && (
          <>
            <LoanInputSection loan={loan} onChange={setLoan} />

            {/* Reference indexes must come before banks so users set up indexes first */}
            <ReferenceIndexSection
              indexes={referenceIndexes}
              onChange={handleReferenceIndexesChange}
            />

            <div>
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Thông tin ngân hàng</h2>
              <BankInputSection
                banks={banksWithComputedRates}
                loan={loan}
                referenceIndexes={referenceIndexes}
                onChange={handleBanksChange}
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
                onClick={() => handleTabClick('results')}
              >
                Xem kết quả →
              </button>
            </div>
          </>
        )}

        {activeTab === 'results' && detailBank && (
          <BankDetailView
            bank={detailBank}
            loan={loan}
            schedule={schedules[detailBank.id] || []}
            referenceIndexes={referenceIndexes}
            onBack={() => setDetailBankId(null)}
          />
        )}

        {activeTab === 'results' && !detailBank && (
          <>
            <MonthlyPaymentTable
              banks={banksWithComputedRates}
              schedules={schedules}
              loanTermMonths={loan.loanTermMonths}
              onViewDetail={handleViewDetail}
            />
            <ComparisonTable
              banks={banksWithComputedRates}
              scenarios={scenarios}
              results={results}
              schedules={schedules}
              onViewDetail={handleViewDetail}
            />
            <ConclusionSection
              banks={banksWithComputedRates}
              scenarios={scenarios}
              results={results}
            />
          </>
        )}

        {activeTab === 'charts' && (
          <>
            <CostComparisonChart banks={banksWithComputedRates} scenarios={scenarios} results={results} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <BalanceChart banks={banksWithComputedRates} schedules={schedules} />
              <MonthlyPaymentChart banks={banksWithComputedRates} schedules={schedules} />
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
