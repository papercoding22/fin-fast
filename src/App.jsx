import { useState, useMemo } from "react";
import { Routes, Route, Navigate, NavLink, useMatch } from "react-router-dom";
import InputPage from "./pages/InputPage";
import ResultsPage from "./pages/ResultsPage";
import BankDetailPage from "./pages/BankDetailPage";
import ChartsPage from "./pages/ChartsPage";
import {
  buildSchedule,
  calcScenario,
  resolveAdditionalCosts,
  computeFloatingRate,
} from "./utils/loanCalculations";
import {
  DEFAULT_LOAN,
  DEFAULT_BANKS,
  DEFAULT_SCENARIOS,
  DEFAULT_REFERENCE_INDEXES,
} from "./data/defaultData";
import { useLocalStorage, clearAppStorage } from "./hooks/useLocalStorage";

const BANK_COLORS = ["#7c3aed", "#0891b2", "#059669", "#dc2626", "#d97706", "#db2777", "#0f766e"];

let bankIdCounter = 100;
let scenarioIdCounter = 100;

const NAV_TABS = [
  { to: "/input", label: "Nhập liệu" },
  { to: "/results", label: "Kết quả" },
  { to: "/charts", label: "Biểu đồ" },
];

export default function App() {
  const [loan, setLoan] = useLocalStorage("loan", DEFAULT_LOAN);
  const [banks, setBanks] = useLocalStorage("banks", DEFAULT_BANKS);
  const [referenceIndexes, setReferenceIndexes] = useLocalStorage(
    "referenceIndexes",
    DEFAULT_REFERENCE_INDEXES
  );
  const [scenarios, setScenarios] = useLocalStorage("scenarios", DEFAULT_SCENARIOS);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const detailMatch = useMatch("/results/:bankId");

  function handleReset() {
    clearAppStorage();
    setLoan(DEFAULT_LOAN);
    setBanks(DEFAULT_BANKS);
    setReferenceIndexes(DEFAULT_REFERENCE_INDEXES);
    setScenarios(DEFAULT_SCENARIOS);
    setShowResetConfirm(false);
  }

  const banksWithComputedRates = useMemo(() => {
    return banks.map((bank) => {
      if (bank.floatingRateMode !== "formula") return bank;
      const computed = computeFloatingRate(bank, referenceIndexes);
      return computed !== bank.floatingRate ? { ...bank, floatingRate: computed } : bank;
    });
  }, [banks, referenceIndexes]);

  const schedules = useMemo(() => {
    const term = parseInt(loan.loanTermMonths);
    if (!term || term <= 0) return {};
    const result = {};
    banksWithComputedRates.forEach((bank) => {
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

  const results = useMemo(() => {
    const output = {};
    scenarios.forEach((scenario) => {
      output[scenario.id] = {};
      banksWithComputedRates.forEach((bank) => {
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
    setBanks((prev) => [
      ...prev,
      {
        id,
        name: "Ngân hàng mới",
        color: BANK_COLORS[colorIdx],
        fixedRate: 9.0,
        fixedMonths: 12,
        floatingRateMode: "direct",
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
      },
    ]);
  }

  function removeBank(id) {
    setBanks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleBanksChange(newBanks) {
    setBanks(
      newBanks.map((bank) => {
        if (bank.floatingRateMode !== "formula") return bank;
        return { ...bank, floatingRate: computeFloatingRate(bank, referenceIndexes) };
      })
    );
  }

  function addScenario() {
    const id = `s_${++scenarioIdCounter}`;
    setScenarios((prev) => [...prev, { id, label: "Kịch bản mới", settleMonth: 48 }]);
  }

  function removeScenario(id) {
    setScenarios((prev) => prev.filter((s) => s.id !== id));
  }

  const detailBank = detailMatch
    ? banksWithComputedRates.find((b) => b.id === detailMatch.params.bankId)
    : null;

  const tabClass = ({ isActive }) =>
    `px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
      isActive ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">So sánh vay mua ô tô</h1>
            <p className="text-xs text-slate-500">
              Tính toán và so sánh chi phí vay giữa các ngân hàng
              <span className="ml-2 text-green-500 font-medium">● Tự động lưu</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {showResetConfirm ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-xs text-red-700 font-medium">Xóa toàn bộ dữ liệu?</span>
                <button
                  className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                  onClick={handleReset}
                >
                  Xác nhận
                </button>
                <button
                  className="text-xs px-2 py-0.5 text-slate-600 hover:text-slate-900"
                  onClick={() => setShowResetConfirm(false)}
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                className="text-xs text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-colors"
                onClick={() => setShowResetConfirm(true)}
              >
                Đặt lại mặc định
              </button>
            )}
            <nav className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              {NAV_TABS.map((tab) => (
                <NavLink key={tab.to} to={tab.to} end={tab.to !== "/results"} className={tabClass}>
                  {tab.label}
                </NavLink>
              ))}
              {detailBank && (
                <>
                  <div className="w-px bg-slate-300 mx-1 self-stretch" />
                  <div
                    className="px-3 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm flex items-center gap-1.5"
                    style={{ color: detailBank.color }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: detailBank.color }}
                    />
                    {detailBank.name}
                  </div>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Routes>
          <Route index element={<Navigate to="/input" replace />} />
          <Route path="*" element={<Navigate to="/input" replace />} />
          <Route
            path="/input"
            element={
              <InputPage
                loan={loan}
                onLoanChange={setLoan}
                banks={banksWithComputedRates}
                onBanksChange={handleBanksChange}
                onAddBank={addBank}
                onRemoveBank={removeBank}
                referenceIndexes={referenceIndexes}
                onReferenceIndexesChange={setReferenceIndexes}
                scenarios={scenarios}
                onScenariosChange={setScenarios}
                onAddScenario={addScenario}
                onRemoveScenario={removeScenario}
              />
            }
          />
          <Route
            path="/results"
            element={
              <ResultsPage
                banks={banksWithComputedRates}
                schedules={schedules}
                scenarios={scenarios}
                results={results}
                loanTermMonths={loan.loanTermMonths}
              />
            }
          />
          <Route
            path="/results/:bankId"
            element={
              <BankDetailPage
                banks={banksWithComputedRates}
                loan={loan}
                schedules={schedules}
                referenceIndexes={referenceIndexes}
              />
            }
          />
          <Route
            path="/charts"
            element={
              <ChartsPage
                banks={banksWithComputedRates}
                schedules={schedules}
                scenarios={scenarios}
                results={results}
              />
            }
          />
        </Routes>
      </main>

      <footer className="text-center text-xs text-slate-400 py-8 mt-4">
        Công cụ tính toán tham khảo — không phải tư vấn tài chính chính thức
      </footer>
    </div>
  );
}
