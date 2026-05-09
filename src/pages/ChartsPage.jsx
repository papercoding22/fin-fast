import { CostComparisonChart, BalanceChart, MonthlyPaymentChart } from '../components/Charts';

export default function ChartsPage({ banks, schedules, scenarios, results }) {
  return (
    <>
      <CostComparisonChart banks={banks} scenarios={scenarios} results={results} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BalanceChart banks={banks} schedules={schedules} />
        <MonthlyPaymentChart banks={banks} schedules={schedules} />
      </div>
    </>
  );
}
