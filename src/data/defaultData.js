/**
 * Default sample data pre-filled in the app.
 */

export const DEFAULT_LOAN = {
  carPrice: 2038000000,
  downPayment: 1038000000,
  loanAmount: 1000000000,
  loanTermMonths: 96,
};

export const DEFAULT_BANKS = [
  {
    id: 'tpbank',
    name: 'TPBank',
    color: '#7c3aed',
    fixedRate: 8.7,
    fixedMonths: 12,
    floatingRate: 11.6,
    maxLtvPercent: 85,
    maxTermMonths: 96,
    // feeTable: sorted by upToYear asc; last entry covers remaining years
    prepaymentFees: [
      { upToYear: 2, rate: 4.5 },
      { upToYear: 3, rate: 3.5 },
      { upToYear: 4, rate: 2.5 },
      { upToYear: 999, rate: 0 },
    ],
    additionalCosts: [],
  },
  {
    id: 'shinhan',
    name: 'Shinhan Bank',
    color: '#0891b2',
    fixedRate: 9.7,
    fixedMonths: 12,
    floatingRate: 11.13,
    maxLtvPercent: 80,
    maxTermMonths: 96,
    prepaymentFees: [
      { upToYear: 1, rate: 3.5 },
      { upToYear: 2, rate: 2.5 },
      { upToYear: 3, rate: 1.5 },
      { upToYear: 4, rate: 0.5 },
      { upToYear: 999, rate: 0 },
    ],
    additionalCosts: [
      {
        id: 'insurance-diff',
        label: 'Chênh lệch bảo hiểm bắt buộc (năm đầu)',
        type: 'percent_car', // amount = percent * carPrice / 100
        percent: 0.2,
        amount: 0, // will be computed dynamically
      },
    ],
  },
];

export const DEFAULT_SCENARIOS = [
  { id: 's1', label: 'Giữ đến hết hạn (96 tháng)', settleMonth: 96 },
  { id: 's2', label: 'Tất toán sau 36 tháng', settleMonth: 36 },
  { id: 's3', label: 'Tất toán sau 60 tháng', settleMonth: 60 },
];
