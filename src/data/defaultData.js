/**
 * Default sample data pre-filled in the app.
 */

export const DEFAULT_LOAN = {
  carPrice: 2038000000,
  downPayment: 1038000000,
  loanAmount: 1000000000,
  loanTermMonths: 96,
};

/**
 * Reference index pool (LSCS / SPR).
 */
export const DEFAULT_REFERENCE_INDEXES = [
  {
    id: 'tpbank_lscs_3m',
    name: 'LSCS 3M',
    provider: 'TPBank',
    currentValue: 8.9,
    effectiveDate: '2025-01-01',
    adjustmentFrequency: '3 tháng',
    notes: 'Lãi suất cơ sở kỳ hạn 3 tháng của TPBank',
  },
  {
    id: 'shinhan_spr_6m',
    name: 'SPR 6M',
    provider: 'Shinhan Bank',
    currentValue: 8.92,
    effectiveDate: '2025-01-01',
    adjustmentFrequency: '6 tháng',
    notes: 'Standard Prime Rate kỳ hạn 6 tháng của Shinhan',
  },
];

export const DEFAULT_BANKS = [
  {
    id: 'tpbank',
    name: 'TPBank',
    color: '#7c3aed',
    fixedRate: 10.7,
    fixedMonths: 24,
    floatingRateMode: 'formula',
    refIndexId: 'tpbank_lscs_3m',
    spread: 3.6,
    floatingRate: 12.5,   // = 8.9 + 3.6
    maxLtvPercent: 85,
    maxTermMonths: 96,
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
    fixedRate: 9.6,
    fixedMonths: 24,
    floatingRateMode: 'formula',
    refIndexId: 'shinhan_spr_6m',
    spread: 2.5,
    floatingRate: 11.42,  // = 8.92 + 2.5
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
        type: 'percent_car',
        percent: 0.2,
        amount: 0,
      },
    ],
  },
];

export const DEFAULT_SCENARIOS = [
  { id: 's1', label: 'Giữ đến hết hạn (96 tháng)', settleMonth: 96 },
  { id: 's2', label: 'Tất toán sau 36 tháng', settleMonth: 36 },
  { id: 's3', label: 'Tất toán sau 60 tháng', settleMonth: 60 },
];

/** Stress test offsets applied to the reference index value */
export const STRESS_OFFSETS = [-1, 0, 1, 2, 3];
