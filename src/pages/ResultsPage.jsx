import { useNavigate } from "react-router-dom";
import MonthlyPaymentTable from "../components/MonthlyPaymentTable";
import ComparisonTable from "../components/ComparisonTable";
import ConclusionSection from "../components/ConclusionSection";

export default function ResultsPage({ banks, schedules, scenarios, results, loanTermMonths }) {
  const navigate = useNavigate();

  return (
    <>
      <MonthlyPaymentTable
        banks={banks}
        schedules={schedules}
        loanTermMonths={loanTermMonths}
        onViewDetail={(bankId) => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigate(`/results/${bankId}`);
        }}
      />
      <ComparisonTable
        banks={banks}
        scenarios={scenarios}
        results={results}
        schedules={schedules}
        onViewDetail={(bankId) => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          navigate(`/results/${bankId}`);
        }}
      />
      <ConclusionSection banks={banks} scenarios={scenarios} results={results} />
    </>
  );
}
