import Decimal from "decimal.js";

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -18,
  toExpPos: 40,
});

export type RepaymentMethod =
  | "annuity"
  | "equal-principal"
  | "flat-interest"
  | "interest-only"
  | "bullet";

export type DayCountBasis = "act-365" | "act-360" | "30e-360";
export type AccrualMode = "monthly-fixed" | "actual-days";

export interface DayCountBasisMeta {
  key: DayCountBasis;
  label: string;
  description: string;
}

export interface AccrualModeMeta {
  key: AccrualMode;
  label: string;
  description: string;
}

export interface RepaymentMethodMeta {
  key: RepaymentMethod;
  label: string;
  description: string;
  badge: string;
  paymentPattern: string;
  suitableFor: string;
  caution: string;
}

export interface ScenarioInput {
  label: string;
  principal: string;
  monthlyRatePct: string;
  periods: number;
  upfrontFee: string;
  monthlyFee: string;
  method: RepaymentMethod;
  disbursementDate: string;
  firstRepaymentDate: string;
  dayCountBasis: DayCountBasis;
  accrualMode: AccrualMode;
  earlySettlementPeriod: number;
  earlySettlementFeePct: string;
  earlySettlementFeeFixed: string;
}

export interface ValidationIssue {
  field: keyof ScenarioInput | "general";
  message: string;
}

export interface QuickEstimateInput {
  netReceived: string;
  periods: number;
  regularPayment: string;
  finalExtraPayment: string;
}

export interface QuickValidationIssue {
  field: keyof QuickEstimateInput | "general";
  message: string;
}

export interface ScheduleRow {
  period: number;
  rowType: "regular" | "settlement";
  startDate: string;
  dueDate: string;
  accrualDays: number;
  periodRate: Decimal;
  payment: Decimal;
  principal: Decimal;
  interest: Decimal;
  fee: Decimal;
  settlementFee: Decimal;
  balance: Decimal;
  cumulativeOutflow: Decimal;
}

export interface EarlySettlementSummary {
  period: number;
  dueDate: string;
  payoffAmount: Decimal;
  settlementFee: Decimal;
  remainingPrincipal: Decimal;
  avoidedPeriods: number;
}

export interface ScenarioResult {
  input: NormalizedScenario;
  schedule: ScheduleRow[];
  netDisbursement: Decimal;
  totalRepayment: Decimal;
  totalInterest: Decimal;
  totalFees: Decimal;
  totalCost: Decimal;
  monthlyPaymentMin: Decimal;
  monthlyPaymentMax: Decimal;
  nominalAnnualRate: Decimal;
  monthlyIrr: Decimal | null;
  annualPercentageRate: Decimal | null;
  effectiveAnnualRate: Decimal | null;
  xirrAnnualRate: Decimal | null;
  earlySettlement: EarlySettlementSummary | null;
  warnings: string[];
}

export interface QuickEstimateResult {
  input: NormalizedQuickEstimate;
  finalPayment: Decimal;
  totalRepayment: Decimal;
  totalCost: Decimal;
  monthlyIrr: Decimal | null;
  annualPercentageRate: Decimal | null;
  effectiveAnnualRate: Decimal | null;
}

export interface ComparisonCard {
  method: RepaymentMethodMeta;
  totalCost: Decimal;
  annualPercentageRate: Decimal | null;
  effectiveAnnualRate: Decimal | null;
  xirrAnnualRate: Decimal | null;
  monthlyPaymentMin: Decimal;
  monthlyPaymentMax: Decimal;
}

interface NormalizedScenario {
  label: string;
  principal: Decimal;
  monthlyRate: Decimal;
  periods: number;
  upfrontFee: Decimal;
  monthlyFee: Decimal;
  earlySettlementFeePct: Decimal;
  earlySettlementFeeFixed: Decimal;
  earlySettlementPeriod: number;
  method: RepaymentMethod;
  disbursementDate: Date;
  firstRepaymentDate: Date;
  dayCountBasis: DayCountBasis;
  accrualMode: AccrualMode;
}

interface DatedCashFlow {
  date: Date;
  amount: Decimal;
}

interface NormalizedQuickEstimate {
  netReceived: Decimal;
  periods: number;
  regularPayment: Decimal;
  finalExtraPayment: Decimal;
}

const ZERO = new Decimal(0);
const ONE = new Decimal(1);
const DAY_MS = 24 * 60 * 60 * 1000;

export const repaymentMethods: RepaymentMethodMeta[] = [
  {
    key: "annuity",
    label: "等额本息",
    description: "每期还款额基本不变，前期还利息多，后期还本金多。",
    badge: "Standard",
    paymentPattern: "月供最平稳，便于按月做固定预算。",
    suitableFor: "适合收入稳定、希望每月压力可预测的人。",
    caution: "总利息通常高于等额本金，前期本金下降较慢。",
  },
  {
    key: "equal-principal",
    label: "等额本金",
    description: "每期归还相同本金，利息随剩余本金减少，月供逐月下降。",
    badge: "Declining",
    paymentPattern: "首期最高，之后每月递减，越往后越轻松。",
    suitableFor: "适合前期现金流充足、想少付总利息的人。",
    caution: "前几期压力明显更大，不适合预算很紧的借款人。",
  },
  {
    key: "flat-interest",
    label: "等本等息",
    description: "本金按期平分，但利息始终按初始本金计算，不随余额下降。",
    badge: "Add-on",
    paymentPattern: "每期金额通常固定，看起来简单。",
    suitableFor: "常见于消费分期、渠道分期等强调固定月供的场景。",
    caution: "名义利率看着不高，但真实年化通常明显偏高。",
  },
  {
    key: "interest-only",
    label: "先息后本",
    description: "前面各期只付利息，最后一期一次性归还全部本金。",
    badge: "Balloon",
    paymentPattern: "前期月供低，最后一期会突然变大。",
    suitableFor: "适合短期周转、预期未来有一笔回款的人。",
    caution: "尾期资金压力集中，如果回款不及预期会很被动。",
  },
  {
    key: "bullet",
    label: "一次性还本付息",
    description: "整个借款期内不分期偿还，到期一次性支付本金和全部利息。",
    badge: "Lump Sum",
    paymentPattern: "中间几乎没有还款，到期一次性结清。",
    suitableFor: "适合极短期借款，且到期回款时间非常明确的场景。",
    caution: "到期压力最大，对资金安排和期限判断要求最高。",
  },
];

export const dayCountBases: DayCountBasisMeta[] = [
  {
    key: "act-365",
    label: "ACT/365",
    description: "按实际天数 / 365 折算年化，适合常见信息披露口径。",
  },
  {
    key: "act-360",
    label: "ACT/360",
    description: "按实际天数 / 360 折算年化，常见于部分金融合同和机构口径。",
  },
  {
    key: "30e-360",
    label: "30E/360",
    description: "按 30 天月、360 天年折算，便于合同和估值口径保持一致。",
  },
];

export const accrualModes: AccrualModeMeta[] = [
  {
    key: "monthly-fixed",
    label: "合同月供口径",
    description: "按月利率直接生成分期金额，日期主要影响 XIRR 年化折算。",
  },
  {
    key: "actual-days",
    label: "按实际天数计息",
    description:
      "按实际天数/365 计息，日期会直接影响每期利息；XIRR 基准不改变分期金额。",
  },
];

const defaultDisbursementDate = currentLocalIsoDate();
const defaultFirstRepaymentDate = toIsoDate(
  addUtcMonths(parseIsoDate(defaultDisbursementDate)!, 1),
);

export const defaultScenario: ScenarioInput = {
  label: "标准消费贷",
  principal: "100000",
  monthlyRatePct: "1.00",
  periods: 12,
  upfrontFee: "0",
  monthlyFee: "0",
  method: "annuity",
  disbursementDate: defaultDisbursementDate,
  firstRepaymentDate: defaultFirstRepaymentDate,
  dayCountBasis: "act-365",
  accrualMode: "actual-days",
  earlySettlementPeriod: 0,
  earlySettlementFeePct: "0",
  earlySettlementFeeFixed: "0",
};

export const defaultQuickEstimate: QuickEstimateInput = {
  netReceived: "100000",
  periods: 12,
  regularPayment: "8884.88",
  finalExtraPayment: "0",
};

export function validateScenario(input: ScenarioInput): ValidationIssue[] {
  const principal = safeDecimal(input.principal);
  const monthlyRatePct = safeDecimal(input.monthlyRatePct);
  const upfrontFee = safeDecimal(input.upfrontFee);
  const monthlyFee = safeDecimal(input.monthlyFee);
  const earlySettlementFeePct = safeDecimal(input.earlySettlementFeePct);
  const earlySettlementFeeFixed = safeDecimal(input.earlySettlementFeeFixed);
  const disbursementDate = parseIsoDate(input.disbursementDate);
  const firstRepaymentDate = parseIsoDate(input.firstRepaymentDate);
  const issues: ValidationIssue[] = [];

  if (!input.label.trim()) {
    issues.push({ field: "label", message: "方案名称不能为空。" });
  }
  if (!principal || principal.lte(0)) {
    issues.push({ field: "principal", message: "本金必须大于 0。" });
  }
  if (!Number.isInteger(input.periods) || input.periods <= 0) {
    issues.push({ field: "periods", message: "期数必须是正整数。" });
  }
  if (!monthlyRatePct || monthlyRatePct.lt(0)) {
    issues.push({
      field: "monthlyRatePct",
      message: "月利率必须大于或等于 0。",
    });
  }
  if (!upfrontFee || upfrontFee.lt(0)) {
    issues.push({ field: "upfrontFee", message: "前置费用不能为负数。" });
  }
  if (!monthlyFee || monthlyFee.lt(0)) {
    issues.push({ field: "monthlyFee", message: "月服务费不能为负数。" });
  }
  if (!earlySettlementFeePct || earlySettlementFeePct.lt(0)) {
    issues.push({
      field: "earlySettlementFeePct",
      message: "提前结清违约金费率不能为负数。",
    });
  }
  if (!earlySettlementFeeFixed || earlySettlementFeeFixed.lt(0)) {
    issues.push({
      field: "earlySettlementFeeFixed",
      message: "提前结清固定违约金不能为负数。",
    });
  }
  if (principal && upfrontFee && upfrontFee.gte(principal)) {
    issues.push({
      field: "upfrontFee",
      message: "前置费用必须小于借款本金，否则净到手金额为 0 或负数。",
    });
  }
  if (!disbursementDate) {
    issues.push({
      field: "disbursementDate",
      message: "放款日必须是有效日期。",
    });
  }
  if (!firstRepaymentDate) {
    issues.push({
      field: "firstRepaymentDate",
      message: "首期还款日必须是有效日期。",
    });
  }
  if (
    disbursementDate &&
    firstRepaymentDate &&
    firstRepaymentDate.getTime() <= disbursementDate.getTime()
  ) {
    issues.push({
      field: "firstRepaymentDate",
      message: "首期还款日必须晚于放款日。",
    });
  }
  if (!dayCountBases.some((item) => item.key === input.dayCountBasis)) {
    issues.push({
      field: "dayCountBasis",
      message: "日计数基准不受支持。",
    });
  }
  if (!accrualModes.some((item) => item.key === input.accrualMode)) {
    issues.push({
      field: "accrualMode",
      message: "计息口径不受支持。",
    });
  }
  if (
    !Number.isInteger(input.earlySettlementPeriod) ||
    input.earlySettlementPeriod < 0
  ) {
    issues.push({
      field: "earlySettlementPeriod",
      message: "提前结清期次必须是大于或等于 0 的整数。",
    });
  } else if (
    input.earlySettlementPeriod > 0 &&
    input.earlySettlementPeriod >= input.periods
  ) {
    issues.push({
      field: "earlySettlementPeriod",
      message: "提前结清期次必须早于最后一期；不提前结清请填 0。",
    });
  }

  return issues;
}

export function validateQuickEstimate(
  input: QuickEstimateInput,
): QuickValidationIssue[] {
  const netReceived = safeDecimal(input.netReceived);
  const regularPayment = safeDecimal(input.regularPayment);
  const finalExtraPayment = safeDecimal(input.finalExtraPayment);
  const issues: QuickValidationIssue[] = [];

  if (!netReceived || netReceived.lte(0)) {
    issues.push({ field: "netReceived", message: "实际到手金额必须大于 0。" });
  }
  if (!Number.isInteger(input.periods) || input.periods <= 0) {
    issues.push({ field: "periods", message: "总期数必须是正整数。" });
  }
  if (!regularPayment || regularPayment.lt(0)) {
    issues.push({
      field: "regularPayment",
      message: "每期固定还款不能为负数。",
    });
  }
  if (!finalExtraPayment || finalExtraPayment.lt(0)) {
    issues.push({
      field: "finalExtraPayment",
      message: "最后一期额外还款不能为负数。",
    });
  }
  if (
    netReceived &&
    regularPayment &&
    finalExtraPayment &&
    input.periods > 0 &&
    regularPayment.eq(0) &&
    finalExtraPayment.eq(0)
  ) {
    issues.push({
      field: "general",
      message: "至少要有一笔实际还款，否则无法估算年化。",
    });
  }

  return issues;
}

export function calculateScenario(input: ScenarioInput): ScenarioResult {
  const issues = validateScenario(input);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join(" "));
  }

  const normalized = normalizeScenario(input);
  const schedule = buildSchedule(normalized);
  const warnings = buildWarnings(normalized, schedule);
  const netDisbursement = money(normalized.principal.minus(normalized.upfrontFee));
  const totalRepayment = schedule.reduce(
    (sum, row) => sum.plus(row.payment),
    ZERO,
  );
  const totalInterest = schedule.reduce(
    (sum, row) => sum.plus(row.interest),
    ZERO,
  );
  const totalPeriodicFees = schedule.reduce(
    (sum, row) => sum.plus(row.fee).plus(row.settlementFee),
    ZERO,
  );
  const totalFees = money(totalPeriodicFees.plus(normalized.upfrontFee));
  const totalCost = money(totalInterest.plus(totalFees));
  const payments = schedule.map((row) => row.payment);
  const monthlyPaymentMin = payments.reduce(
    (min, value) => Decimal.min(min, value),
    payments[0] ?? ZERO,
  );
  const monthlyPaymentMax = payments.reduce(
    (max, value) => Decimal.max(max, value),
    payments[0] ?? ZERO,
  );
  const periodicCashFlows = [
    netDisbursement,
    ...schedule.map((row) => row.payment.negated()),
  ];
  const datedCashFlows: DatedCashFlow[] = [
    { date: normalized.disbursementDate, amount: netDisbursement },
    ...schedule.map((row) => ({
      date: parseIsoDate(row.dueDate)!,
      amount: row.payment.negated(),
    })),
  ];
  const monthlyIrr = solveMonthlyIrr(periodicCashFlows);
  const annualPercentageRate = monthlyIrr ? monthlyIrr.times(12) : null;
  const effectiveAnnualRate = monthlyIrr
    ? ONE.plus(monthlyIrr).pow(12).minus(ONE)
    : null;
  const xirrAnnualRate = solveXirr(datedCashFlows, normalized.dayCountBasis);
  const settlementRow = schedule.find((row) => row.rowType === "settlement");
  const earlySettlement = settlementRow
    ? {
        period: settlementRow.period,
        dueDate: settlementRow.dueDate,
        payoffAmount: settlementRow.payment,
        settlementFee: settlementRow.settlementFee,
        remainingPrincipal: settlementRow.principal,
        avoidedPeriods: normalized.periods - settlementRow.period,
      }
    : null;

  return {
    input: normalized,
    schedule,
    netDisbursement,
    totalRepayment: money(totalRepayment),
    totalInterest: money(totalInterest),
    totalFees,
    totalCost,
    monthlyPaymentMin: money(monthlyPaymentMin),
    monthlyPaymentMax: money(monthlyPaymentMax),
    nominalAnnualRate: annualNominalRate(normalized.monthlyRate),
    monthlyIrr,
    annualPercentageRate,
    effectiveAnnualRate,
    xirrAnnualRate,
    earlySettlement,
    warnings,
  };
}

export function calculateQuickEstimate(
  input: QuickEstimateInput,
): QuickEstimateResult {
  const issues = validateQuickEstimate(input);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => issue.message).join(" "));
  }

  const normalized = normalizeQuickEstimate(input);
  const finalPayment = money(
    normalized.regularPayment.plus(normalized.finalExtraPayment),
  );
  const cashFlows = [
    normalized.netReceived,
    ...Array.from({ length: Math.max(normalized.periods - 1, 0) }, () =>
      normalized.regularPayment.negated(),
    ),
    finalPayment.negated(),
  ];
  const totalRepayment = money(
    normalized.regularPayment.times(Math.max(normalized.periods - 1, 0)).plus(
      finalPayment,
    ),
  );
  const totalCost = money(totalRepayment.minus(normalized.netReceived));
  const monthlyIrr = solveMonthlyIrr(cashFlows);
  const annualPercentageRate = monthlyIrr ? monthlyIrr.times(12) : null;
  const effectiveAnnualRate = monthlyIrr
    ? ONE.plus(monthlyIrr).pow(12).minus(ONE)
    : null;

  return {
    input: normalized,
    finalPayment,
    totalRepayment,
    totalCost,
    monthlyIrr,
    annualPercentageRate,
    effectiveAnnualRate,
  };
}

export function buildComparisonCards(input: ScenarioInput): ComparisonCard[] {
  return repaymentMethods.map((method) => {
    const result = calculateScenario({
      ...input,
      method: method.key,
      label: method.label,
    });

    return {
      method,
      totalCost: result.totalCost,
      annualPercentageRate: result.annualPercentageRate,
      effectiveAnnualRate: result.effectiveAnnualRate,
      xirrAnnualRate: result.xirrAnnualRate,
      monthlyPaymentMin: result.monthlyPaymentMin,
      monthlyPaymentMax: result.monthlyPaymentMax,
    };
  });
}

function normalizeScenario(input: ScenarioInput): NormalizedScenario {
  return {
    label: input.label.trim(),
    principal: money(new Decimal(input.principal || "0")),
    monthlyRate: new Decimal(input.monthlyRatePct || "0").div(100),
    periods: input.periods,
    upfrontFee: money(new Decimal(input.upfrontFee || "0")),
    monthlyFee: money(new Decimal(input.monthlyFee || "0")),
    earlySettlementFeePct: new Decimal(input.earlySettlementFeePct || "0").div(100),
    earlySettlementFeeFixed: money(
      new Decimal(input.earlySettlementFeeFixed || "0"),
    ),
    earlySettlementPeriod: input.earlySettlementPeriod,
    method: input.method,
    disbursementDate:
      parseIsoDate(input.disbursementDate) ??
      parseIsoDate(defaultDisbursementDate)!,
    firstRepaymentDate:
      parseIsoDate(input.firstRepaymentDate) ??
      parseIsoDate(defaultFirstRepaymentDate)!,
    dayCountBasis: input.dayCountBasis,
    accrualMode: input.accrualMode,
  };
}

function normalizeQuickEstimate(
  input: QuickEstimateInput,
): NormalizedQuickEstimate {
  return {
    netReceived: money(new Decimal(input.netReceived || "0")),
    periods: input.periods,
    regularPayment: money(new Decimal(input.regularPayment || "0")),
    finalExtraPayment: money(new Decimal(input.finalExtraPayment || "0")),
  };
}

function buildSchedule(input: NormalizedScenario): ScheduleRow[] {
  const schedule: ScheduleRow[] = [];
  let balance = input.principal;
  let cumulativeOutflow = ZERO;
  const fixedFee = input.monthlyFee;
  const settlementPeriod =
    input.earlySettlementPeriod > 0 ? input.earlySettlementPeriod : null;

  const pushRow = (
    period: number,
    rowType: "regular" | "settlement",
    startDate: Date,
    dueDate: Date,
    periodRate: Decimal,
    principal: Decimal,
    interest: Decimal,
    fee: Decimal,
    settlementFee: Decimal = ZERO,
  ) => {
    const payment = money(principal.plus(interest).plus(fee).plus(settlementFee));
    balance = money(balance.minus(principal));
    if (balance.abs().lt(new Decimal("0.005"))) {
      balance = ZERO;
    }
    cumulativeOutflow = money(cumulativeOutflow.plus(payment));
    schedule.push({
      period,
      rowType,
      startDate: toIsoDate(startDate),
      dueDate: toIsoDate(dueDate),
      accrualDays: resolveScheduleDayCount(input, startDate, dueDate),
      periodRate,
      payment,
      principal: money(principal),
      interest: money(interest),
      fee: money(fee),
      settlementFee: money(settlementFee),
      balance,
      cumulativeOutflow,
    });
  };

  const periodDates = buildPeriodDates(input);
  const periodRates = periodDates.map(({ startDate, dueDate }) =>
    resolvePeriodRate(input, startDate, dueDate),
  );

  switch (input.method) {
    case "annuity": {
      const exactPayment = annuityPayment(
        input.principal,
        input.monthlyRate,
        input.periods,
        periodRates,
        input.accrualMode,
      );
      for (let period = 1; period <= input.periods; period += 1) {
        const { startDate, dueDate } = periodDates[period - 1];
        const periodRate = periodRates[period - 1] ?? input.monthlyRate;
        const interest = money(balance.times(periodRate));
        const isSettlement = settlementPeriod === period;
        let principal = isSettlement
          ? balance
          : period === input.periods
            ? balance
            : money(money(exactPayment).minus(interest));
        if (principal.gt(balance)) {
          principal = balance;
        }
        const settlementFee = isSettlement
          ? resolveSettlementFee(balance, input)
          : ZERO;
        pushRow(
          period,
          isSettlement ? "settlement" : "regular",
          startDate,
          dueDate,
          periodRate,
          principal,
          interest,
          fixedFee,
          settlementFee,
        );
        if (isSettlement) {
          break;
        }
      }
      break;
    }
    case "equal-principal": {
      const exactPrincipal = input.principal.div(input.periods);
      for (let period = 1; period <= input.periods; period += 1) {
        const { startDate, dueDate } = periodDates[period - 1];
        const periodRate = periodRates[period - 1] ?? input.monthlyRate;
        const interest = money(balance.times(periodRate));
        const isSettlement = settlementPeriod === period;
        const principal = isSettlement
          ? balance
          : period === input.periods
            ? balance
            : money(exactPrincipal);
        const settlementFee = isSettlement
          ? resolveSettlementFee(balance, input)
          : ZERO;
        pushRow(
          period,
          isSettlement ? "settlement" : "regular",
          startDate,
          dueDate,
          periodRate,
          principal,
          interest,
          fixedFee,
          settlementFee,
        );
        if (isSettlement) {
          break;
        }
      }
      break;
    }
    case "flat-interest": {
      const exactPrincipal = input.principal.div(input.periods);
      for (let period = 1; period <= input.periods; period += 1) {
        const { startDate, dueDate } = periodDates[period - 1];
        const periodRate = periodRates[period - 1] ?? input.monthlyRate;
        const fixedInterest = money(input.principal.times(periodRate));
        const isSettlement = settlementPeriod === period;
        const principal = isSettlement
          ? balance
          : period === input.periods
            ? balance
            : money(exactPrincipal);
        const settlementFee = isSettlement
          ? resolveSettlementFee(balance, input)
          : ZERO;
        pushRow(
          period,
          isSettlement ? "settlement" : "regular",
          startDate,
          dueDate,
          periodRate,
          principal,
          fixedInterest,
          fixedFee,
          settlementFee,
        );
        if (isSettlement) {
          break;
        }
      }
      break;
    }
    case "interest-only": {
      for (let period = 1; period <= input.periods; period += 1) {
        const { startDate, dueDate } = periodDates[period - 1];
        const periodRate = periodRates[period - 1] ?? input.monthlyRate;
        const fixedInterest = money(input.principal.times(periodRate));
        const isSettlement = settlementPeriod === period;
        const principal = isSettlement
          ? balance
          : period === input.periods
            ? balance
            : ZERO;
        const settlementFee = isSettlement
          ? resolveSettlementFee(balance, input)
          : ZERO;
        pushRow(
          period,
          isSettlement ? "settlement" : "regular",
          startDate,
          dueDate,
          periodRate,
          principal,
          fixedInterest,
          fixedFee,
          settlementFee,
        );
        if (isSettlement) {
          break;
        }
      }
      break;
    }
    case "bullet": {
      for (let period = 1; period <= input.periods; period += 1) {
        const { startDate, dueDate } = periodDates[period - 1];
        const periodRate = periodRates[period - 1] ?? input.monthlyRate;
        const isSettlement = settlementPeriod === period;
        const principal = isSettlement || period === input.periods ? balance : ZERO;
        const interest =
          isSettlement || period === input.periods
            ? input.accrualMode === "actual-days"
              ? money(
                  input.principal.times(
                    annualNominalRate(input.monthlyRate).times(
                      actualDayYearFraction(input.disbursementDate, dueDate),
                    ),
                  ),
                )
              : money(input.principal.times(input.monthlyRate).times(period))
            : ZERO;
        const settlementFee = isSettlement
          ? resolveSettlementFee(balance, input)
          : ZERO;
        pushRow(
          period,
          isSettlement ? "settlement" : "regular",
          startDate,
          dueDate,
          periodRate,
          principal,
          interest,
          fixedFee,
          settlementFee,
        );
        if (isSettlement) {
          break;
        }
      }
      break;
    }
  }

  return schedule;
}

function annuityPayment(
  principal: Decimal,
  monthlyRate: Decimal,
  periods: number,
  periodRates: Decimal[],
  accrualMode: AccrualMode,
): Decimal {
  if (accrualMode === "monthly-fixed") {
    if (monthlyRate.eq(0)) {
      return principal.div(periods);
    }
    const factor = ONE.plus(monthlyRate).pow(periods);
    return principal.times(monthlyRate).times(factor).div(factor.minus(ONE));
  }

  if (periodRates.every((rate) => rate.eq(0))) {
    return principal.div(periods);
  }

  let discountFactor = ONE;
  let denominator = ZERO;

  for (const periodRate of periodRates) {
    discountFactor = discountFactor.div(ONE.plus(periodRate));
    denominator = denominator.plus(discountFactor);
  }

  return principal.div(denominator);
}

function buildPeriodDates(input: NormalizedScenario): Array<{
  startDate: Date;
  dueDate: Date;
}> {
  return Array.from({ length: input.periods }, (_, index) => {
    const dueDate = addUtcMonths(input.firstRepaymentDate, index);
    const startDate =
      index === 0
        ? input.disbursementDate
        : addUtcMonths(input.firstRepaymentDate, index - 1);

    return { startDate, dueDate };
  });
}

function resolvePeriodRate(
  input: NormalizedScenario,
  startDate: Date,
  dueDate: Date,
): Decimal {
  if (input.accrualMode === "monthly-fixed") {
    return input.monthlyRate;
  }

  return annualNominalRate(input.monthlyRate).times(
    actualDayYearFraction(startDate, dueDate),
  );
}

function resolveSettlementFee(
  remainingPrincipal: Decimal,
  input: NormalizedScenario,
): Decimal {
  return money(
    remainingPrincipal.times(input.earlySettlementFeePct).plus(
      input.earlySettlementFeeFixed,
    ),
  );
}

function annualNominalRate(monthlyRate: Decimal): Decimal {
  return monthlyRate.times(12);
}

function resolveScheduleDayCount(
  input: NormalizedScenario,
  startDate: Date,
  dueDate: Date,
): number {
  if (input.accrualMode === "actual-days") {
    return actualDayCount(startDate, dueDate);
  }

  return diffUtcDays(startDate, dueDate);
}

function solveMonthlyIrr(cashFlows: Decimal[]): Decimal | null {
  if (cashFlows.length < 2) {
    return null;
  }

  const hasPositive = cashFlows.some((item) => item.gt(0));
  const hasNegative = cashFlows.some((item) => item.lt(0));
  if (!hasPositive || !hasNegative) {
    return null;
  }

  let low = new Decimal("-0.9999");
  let high = new Decimal("1");
  let lowValue = npv(cashFlows, low);
  let highValue = npv(cashFlows, high);

  while (highValue.lte(0) && high.lt(200)) {
    high = high.times(2).plus(ONE);
    highValue = npv(cashFlows, high);
  }

  if (lowValue.eq(0)) {
    return low;
  }
  if (highValue.eq(0)) {
    return high;
  }
  if (lowValue.times(highValue).gt(0)) {
    return null;
  }

  for (let i = 0; i < 160; i += 1) {
    const mid = low.plus(high).div(2);
    const midValue = npv(cashFlows, mid);

    if (midValue.abs().lt(new Decimal("1e-16"))) {
      return mid;
    }

    if (lowValue.times(midValue).lte(0)) {
      high = mid;
      highValue = midValue;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }

  return low.plus(high).div(2);
}

function npv(cashFlows: Decimal[], rate: Decimal): Decimal {
  return cashFlows.reduce((sum, cashFlow, index) => {
    const discount = ONE.plus(rate).pow(index);
    return sum.plus(cashFlow.div(discount));
  }, ZERO);
}

function solveXirr(
  cashFlows: DatedCashFlow[],
  basis: DayCountBasis,
): Decimal | null {
  if (cashFlows.length < 2) {
    return null;
  }

  const hasPositive = cashFlows.some((item) => item.amount.gt(0));
  const hasNegative = cashFlows.some((item) => item.amount.lt(0));
  if (!hasPositive || !hasNegative) {
    return null;
  }

  let low = new Decimal("-0.9999");
  let high = new Decimal("1");
  let lowValue = xnpv(cashFlows, low, basis);
  let highValue = xnpv(cashFlows, high, basis);

  while (highValue.lte(0) && high.lt(200)) {
    high = high.times(2).plus(ONE);
    highValue = xnpv(cashFlows, high, basis);
  }

  if (lowValue.eq(0)) {
    return low;
  }
  if (highValue.eq(0)) {
    return high;
  }
  if (lowValue.times(highValue).gt(0)) {
    return null;
  }

  for (let i = 0; i < 180; i += 1) {
    const mid = low.plus(high).div(2);
    const midValue = xnpv(cashFlows, mid, basis);

    if (midValue.abs().lt(new Decimal("1e-16"))) {
      return mid;
    }

    if (lowValue.times(midValue).lte(0)) {
      high = mid;
    } else {
      low = mid;
      lowValue = midValue;
    }
  }

  return low.plus(high).div(2);
}

function xnpv(
  cashFlows: DatedCashFlow[],
  annualRate: Decimal,
  basis: DayCountBasis,
): Decimal {
  const origin = cashFlows[0]?.date;
  if (!origin) {
    return ZERO;
  }

  return cashFlows.reduce((sum, cashFlow) => {
    const fraction = yearFraction(origin, cashFlow.date, basis);
    const discount = ONE.plus(annualRate).pow(fraction);
    return sum.plus(cashFlow.amount.div(discount));
  }, ZERO);
}

function actualDayYearFraction(startDate: Date, endDate: Date): Decimal {
  return new Decimal(actualDayCount(startDate, endDate)).div(365);
}

function yearFraction(
  startDate: Date,
  endDate: Date,
  basis: DayCountBasis,
): Decimal {
  if (endDate.getTime() <= startDate.getTime()) {
    return ZERO;
  }

  if (basis === "act-360") {
    return new Decimal(diffUtcDays(startDate, endDate)).div(360);
  }
  if (basis === "30e-360") {
    return new Decimal(thirty360Days(startDate, endDate)).div(360);
  }
  return new Decimal(diffUtcDays(startDate, endDate)).div(365);
}

function buildWarnings(
  input: NormalizedScenario,
  schedule: ScheduleRow[],
): string[] {
  const warnings: string[] = [];
  const finalDueDate = schedule.at(-1)?.dueDate ?? toIsoDate(input.firstRepaymentDate);
  const firstGapDays = diffUtcDays(
    input.disbursementDate,
    input.firstRepaymentDate,
  );

  warnings.push(
    `XIRR 年化按 ${basisLabel(input.dayCountBasis)} 基准，使用 ${toIsoDate(input.disbursementDate)} 至 ${finalDueDate} 的实际日期现金流折算。`,
  );
  warnings.push(
    `${accrualLabel(input.accrualMode)}；各期金额按分四舍五入，尾差归集到最后一期。首期跨度 ${firstGapDays} 天。`,
  );
  if (input.accrualMode === "actual-days") {
    warnings.push("切换 XIRR 年化基准只会改变年化披露口径，不会改变分期金额和总利息。");
  }

  if (input.upfrontFee.gt(0)) {
    warnings.push("已按净到手金额计算 IRR/XIRR；前置费用会显著抬升真实年化。");
  }
  if (input.monthlyFee.gt(0)) {
    warnings.push("月服务费按每期现金流计入真实成本，而不是并入名义利率。");
  }
  if (input.earlySettlementPeriod > 0) {
    warnings.push(
      `已按第 ${input.earlySettlementPeriod} 期应还日整笔结清测算；提前结清仅收截至结清日的应计利息，并计入违约金。`,
    );
  }
  if (input.method === "flat-interest") {
    warnings.push("等本等息按初始本金固定收息，真实年化通常明显高于名义年利率。");
  }
  if (input.method === "bullet") {
    warnings.push(
      input.accrualMode === "actual-days"
        ? "一次性还本付息按放款日至到期日的实际天数计息，XIRR 再按披露基准折算成年化。"
        : "一次性还本付息按整段月份单利累计，年化再按实际到期日期折算。",
    );
  }
  if (input.method === "interest-only") {
    warnings.push("先息后本的尾部本金集中偿付，会放大最后一期流动性压力。");
  }

  return warnings;
}

function basisLabel(basis: DayCountBasis): string {
  return dayCountBases.find((item) => item.key === basis)?.label ?? basis;
}

function accrualLabel(mode: AccrualMode): string {
  return (
    accrualModes.find((item) => item.key === mode)?.description ??
    "按当前计息口径生成分期金额"
  );
}

function currentLocalIsoDate(): string {
  const now = new Date();
  return [
    now.getFullYear(),
    pad2(now.getMonth() + 1),
    pad2(now.getDate()),
  ].join("-");
}

function safeDecimal(value: string): Decimal | null {
  try {
    return new Decimal(value || "0");
  } catch {
    return null;
  }
}

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function toIsoDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
  ].join("-");
}

function addUtcMonths(date: Date, months: number): Date {
  const targetMonthDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      targetMonthDate.getUTCFullYear(),
      targetMonthDate.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  return new Date(
    Date.UTC(
      targetMonthDate.getUTCFullYear(),
      targetMonthDate.getUTCMonth(),
      Math.min(date.getUTCDate(), lastDayOfTargetMonth),
    ),
  );
}

function diffUtcDays(startDate: Date, endDate: Date): number {
  return Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS);
}

function actualDayCount(startDate: Date, endDate: Date): number {
  return diffUtcDays(startDate, endDate);
}

function thirty360Days(startDate: Date, endDate: Date): number {
  const startDay = Math.min(startDate.getUTCDate(), 30);
  const endDay = Math.min(endDate.getUTCDate(), 30);

  return (
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 360 +
    (endDate.getUTCMonth() - startDate.getUTCMonth()) * 30 +
    (endDay - startDay)
  );
}

function money(value: Decimal): Decimal {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
