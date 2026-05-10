import { useNavigate } from "react-router-dom";
import LoanInputSection from "../components/LoanInputSection";
import BankInputSection from "../components/BankInputSection";
import ReferenceIndexSection from "../components/ReferenceIndexSection";
import ScenarioSection from "../components/ScenarioSection";

export default function InputPage({
  loan,
  onLoanChange,
  banks,
  onBanksChange,
  onAddBank,
  onRemoveBank,
  referenceIndexes,
  onReferenceIndexesChange,
  scenarios,
  onScenariosChange,
  onAddScenario,
  onRemoveScenario,
}) {
  const navigate = useNavigate();

  return (
    <>
      <LoanInputSection loan={loan} onChange={onLoanChange} />

      <ReferenceIndexSection indexes={referenceIndexes} onChange={onReferenceIndexesChange} />

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Thông tin ngân hàng</h2>
        <BankInputSection
          banks={banks}
          loan={loan}
          referenceIndexes={referenceIndexes}
          onChange={onBanksChange}
          onAdd={onAddBank}
          onRemove={onRemoveBank}
        />
      </div>

      <ScenarioSection
        scenarios={scenarios}
        loanTermMonths={loan.loanTermMonths}
        onChange={onScenariosChange}
        onAdd={onAddScenario}
        onRemove={onRemoveScenario}
      />

      <div className="flex justify-end">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors shadow"
          onClick={() => navigate("/results")}
        >
          Xem kết quả →
        </button>
      </div>
    </>
  );
}
