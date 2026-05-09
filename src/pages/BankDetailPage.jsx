import { useParams, useNavigate } from 'react-router-dom';
import BankDetailView from '../components/BankDetailView';

export default function BankDetailPage({ banks, loan, schedules, referenceIndexes }) {
  const { bankId } = useParams();
  const navigate = useNavigate();
  const bank = banks.find(b => b.id === bankId);

  if (!bank) {
    return (
      <div className="text-center py-20 text-slate-500">
        Không tìm thấy ngân hàng.{' '}
        <button className="text-blue-600 underline" onClick={() => navigate('/results')}>
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <BankDetailView
      bank={bank}
      loan={loan}
      schedule={schedules[bank.id] || []}
      referenceIndexes={referenceIndexes}
      onBack={() => navigate('/results')}
    />
  );
}
