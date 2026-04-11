import { describe, expect, it } from "vitest";
import {
  buildComparisonCards,
  calculateQuickEstimate,
  calculateScenario,
  defaultQuickEstimate,
  defaultScenario,
  validateQuickEstimate,
  validateScenario,
} from "./loanEngine";

describe("loanEngine", () => {
  it("calculates flat-interest total interest by periods instead of hard-coded values", () => {
    const result = calculateScenario({
      ...defaultScenario,
      principal: "12000",
      monthlyRatePct: "1",
      periods: 12,
      method: "flat-interest",
      accrualMode: "monthly-fixed",
    });

    expect(result.totalInterest.toFixed(2)).toBe("1440.00");
    expect(result.schedule).toHaveLength(12);
    expect(result.schedule.at(-1)?.balance.toFixed(2)).toBe("0.00");
  });

  it("calculates bullet-loan interest using monthly accrual across the exact term", () => {
    const result = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 6,
      method: "bullet",
      accrualMode: "monthly-fixed",
    });

    expect(result.totalInterest.toFixed(2)).toBe("6000.00");
    expect(result.schedule[0].payment.toFixed(2)).toBe("0.00");
    expect(result.schedule.at(-1)?.payment.toFixed(2)).toBe("106000.00");
  });

  it("supports zero-rate annuity schedules without dividing by zero", () => {
    const result = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "0",
      periods: 3,
      method: "annuity",
      accrualMode: "monthly-fixed",
    });

    expect(result.totalInterest.toFixed(2)).toBe("0.00");
    expect(result.schedule.map((row) => row.payment.toFixed(2))).toEqual([
      "33333.33",
      "33333.33",
      "33333.34",
    ]);
    expect(result.schedule.at(-1)?.balance.toFixed(2)).toBe("0.00");
  });

  it("raises effective annual cost when upfront fees reduce net disbursement", () => {
    const base = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 12,
      method: "annuity",
      disbursementDate: "2026-01-10",
      firstRepaymentDate: "2026-02-10",
      accrualMode: "monthly-fixed",
    });
    const result = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 12,
      upfrontFee: "5000",
      method: "annuity",
      disbursementDate: "2026-01-10",
      firstRepaymentDate: "2026-02-10",
      accrualMode: "monthly-fixed",
    });

    expect(result.effectiveAnnualRate?.greaterThan(result.nominalAnnualRate)).toBe(
      true,
    );
    expect(result.xirrAnnualRate?.greaterThan(base.xirrAnnualRate!)).toBe(true);
  });

  it("distinguishes monthly IRR, APR, and EAR", () => {
    const result = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 12,
      method: "annuity",
      disbursementDate: "2026-01-10",
      firstRepaymentDate: "2026-02-10",
      accrualMode: "monthly-fixed",
    });

    expect(result.annualPercentageRate).not.toBeNull();
    expect(result.effectiveAnnualRate).not.toBeNull();
    expect(
      result.annualPercentageRate
        ?.minus(result.monthlyIrr!.times(12))
        .abs()
        .lessThan(1e-12),
    ).toBe(true);
    expect(
      result.effectiveAnnualRate
        ?.minus(result.monthlyIrr!.plus(1).pow(12).minus(1))
        .abs()
        .lessThan(1e-12),
    ).toBe(true);
    expect(
      result.annualPercentageRate
        ?.minus(result.nominalAnnualRate)
        .abs()
        .lessThan(1e-3),
    ).toBe(true);
    expect(result.effectiveAnnualRate?.greaterThan(result.annualPercentageRate!)).toBe(
      true,
    );
    expect(result.xirrAnnualRate?.greaterThan(result.annualPercentageRate!)).toBe(
      true,
    );
    expect(
      result.xirrAnnualRate
        ?.minus(result.effectiveAnnualRate!)
        .abs()
        .greaterThan(1e-6),
    ).toBe(true);
  });

  it("validates net disbursement cannot become zero or negative", () => {
    const issues = validateScenario({
      ...defaultScenario,
      principal: "10000",
      upfrontFee: "10000",
    });

    expect(issues.some((issue) => issue.field === "upfrontFee")).toBe(true);
  });

  it("builds comparison cards for all supported repayment methods", () => {
    const cards = buildComparisonCards(defaultScenario);

    expect(cards).toHaveLength(5);
    expect(cards.map((card) => card.method.key)).toEqual([
      "annuity",
      "equal-principal",
      "flat-interest",
      "interest-only",
      "bullet",
    ]);
  });

  it("builds schedule due dates and xirr from actual calendar dates", () => {
    const result = calculateScenario({
      ...defaultScenario,
      principal: "50000",
      monthlyRatePct: "0.8",
      periods: 6,
      method: "annuity",
      disbursementDate: "2026-01-31",
      firstRepaymentDate: "2026-02-28",
      dayCountBasis: "act-365",
      accrualMode: "actual-days",
    });

    expect(result.schedule[0]?.dueDate).toBe("2026-02-28");
    expect(result.schedule[1]?.dueDate).toBe("2026-03-28");
    expect(result.schedule.at(-1)?.dueDate).toBe("2026-07-28");
    expect(result.xirrAnnualRate).not.toBeNull();
  });

  it("validates repayment dates for contract-grade calculations", () => {
    const issues = validateScenario({
      ...defaultScenario,
      disbursementDate: "2026-04-11",
      firstRepaymentDate: "2026-04-11",
    });

    expect(
      issues.some((issue) => issue.field === "firstRepaymentDate"),
    ).toBe(true);
  });

  it("changes xirr when using different day-count bases", () => {
    const act365 = calculateScenario({
      ...defaultScenario,
      principal: "80000",
      monthlyRatePct: "1",
      periods: 12,
      method: "annuity",
      disbursementDate: "2026-01-15",
      firstRepaymentDate: "2026-02-20",
      dayCountBasis: "act-365",
      accrualMode: "actual-days",
    });
    const act360 = calculateScenario({
      ...defaultScenario,
      principal: "80000",
      monthlyRatePct: "1",
      periods: 12,
      method: "annuity",
      disbursementDate: "2026-01-15",
      firstRepaymentDate: "2026-02-20",
      dayCountBasis: "act-360",
      accrualMode: "actual-days",
    });

    expect(act365.xirrAnnualRate).not.toBeNull();
    expect(act360.xirrAnnualRate).not.toBeNull();
    expect(act365.xirrAnnualRate?.greaterThan(act360.xirrAnnualRate!)).toBe(true);
  });

  it("does not mutate the repayment schedule when only xirr basis changes", () => {
    const act365 = calculateScenario({
      ...defaultScenario,
      principal: "80000",
      monthlyRatePct: "1",
      periods: 12,
      method: "annuity",
      disbursementDate: "2026-01-15",
      firstRepaymentDate: "2026-02-20",
      dayCountBasis: "act-365",
      accrualMode: "actual-days",
    });
    const thirty360 = calculateScenario({
      ...defaultScenario,
      principal: "80000",
      monthlyRatePct: "1",
      periods: 12,
      method: "annuity",
      disbursementDate: "2026-01-15",
      firstRepaymentDate: "2026-02-20",
      dayCountBasis: "30e-360",
      accrualMode: "actual-days",
    });

    expect(act365.totalInterest.eq(thirty360.totalInterest)).toBe(true);
    expect(act365.schedule.map((row) => row.payment.toFixed(2))).toEqual(
      thirty360.schedule.map((row) => row.payment.toFixed(2)),
    );
    expect(act365.schedule.map((row) => row.accrualDays)).toEqual(
      thirty360.schedule.map((row) => row.accrualDays),
    );
    expect(act365.xirrAnnualRate?.eq(thirty360.xirrAnnualRate!)).toBe(false);
  });

  it("truncates the schedule and records a settlement row when early payoff is enabled", () => {
    const base = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 12,
      method: "annuity",
      disbursementDate: "2026-01-10",
      firstRepaymentDate: "2026-02-10",
      accrualMode: "monthly-fixed",
    });
    const settled = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 12,
      method: "annuity",
      disbursementDate: "2026-01-10",
      firstRepaymentDate: "2026-02-10",
      accrualMode: "monthly-fixed",
      earlySettlementPeriod: 4,
      earlySettlementFeePct: "2",
      earlySettlementFeeFixed: "300",
    });

    expect(settled.schedule).toHaveLength(4);
    expect(settled.schedule.at(-1)?.rowType).toBe("settlement");
    expect(
      settled.schedule.at(-1)?.settlementFee.eq(
        settled.schedule
          .at(-1)!
          .principal.times(0.02)
          .plus(300)
          .toDecimalPlaces(2),
      ),
    ).toBe(true);
    expect(settled.schedule.at(-1)?.balance.toFixed(2)).toBe("0.00");
    expect(settled.earlySettlement?.period).toBe(4);
    expect(settled.totalInterest.lessThan(base.totalInterest)).toBe(true);
  });

  it("validates early settlement period must be before maturity", () => {
    const issues = validateScenario({
      ...defaultScenario,
      periods: 12,
      earlySettlementPeriod: 12,
    });

    expect(
      issues.some((issue) => issue.field === "earlySettlementPeriod"),
    ).toBe(true);
  });

  it("uses actual days to change accrued interest for bullet loans", () => {
    const monthlyFixed = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 1,
      method: "bullet",
      disbursementDate: "2026-01-01",
      firstRepaymentDate: "2026-02-15",
      accrualMode: "monthly-fixed",
    });
    const actualDays = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 1,
      method: "bullet",
      disbursementDate: "2026-01-01",
      firstRepaymentDate: "2026-02-15",
      dayCountBasis: "act-365",
      accrualMode: "actual-days",
    });

    expect(monthlyFixed.totalInterest.toFixed(2)).toBe("1000.00");
    expect(actualDays.totalInterest.toFixed(2)).toBe("1479.45");
    expect(actualDays.totalInterest.greaterThan(monthlyFixed.totalInterest)).toBe(
      true,
    );
  });

  it("changes annuity payment when accrual uses actual days", () => {
    const monthlyFixed = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 3,
      method: "annuity",
      disbursementDate: "2026-01-01",
      firstRepaymentDate: "2026-02-15",
      accrualMode: "monthly-fixed",
    });
    const actualDays = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 3,
      method: "annuity",
      disbursementDate: "2026-01-01",
      firstRepaymentDate: "2026-02-15",
      dayCountBasis: "act-365",
      accrualMode: "actual-days",
    });

    expect(actualDays.schedule[0]?.payment.eq(monthlyFixed.schedule[0]?.payment!)).toBe(
      false,
    );
    expect(actualDays.schedule[0]?.accrualDays).toBe(45);
  });

  it("describes bullet actual-days accrual consistently in warnings", () => {
    const result = calculateScenario({
      ...defaultScenario,
      principal: "100000",
      monthlyRatePct: "1",
      periods: 1,
      method: "bullet",
      disbursementDate: "2026-01-01",
      firstRepaymentDate: "2026-02-15",
      accrualMode: "actual-days",
    });

    expect(
      result.warnings.some((warning) => warning.includes("实际天数计息")),
    ).toBe(true);
    expect(
      result.warnings.some((warning) => warning.includes("整段月份单利累计")),
    ).toBe(false);
  });

  it("estimates annualized cost from minimal quick-input cash flows", () => {
    const result = calculateQuickEstimate({
      ...defaultQuickEstimate,
      netReceived: "100000",
      periods: 12,
      regularPayment: "8884.88",
      finalExtraPayment: "0",
    });

    expect(result.totalRepayment.toFixed(2)).toBe("106618.56");
    expect(result.totalCost.toFixed(2)).toBe("6618.56");
    expect(result.annualPercentageRate?.greaterThan(0.1)).toBe(true);
    expect(result.effectiveAnnualRate?.greaterThan(result.annualPercentageRate!)).toBe(
      true,
    );
  });

  it("captures larger last payments in quick estimates", () => {
    const result = calculateQuickEstimate({
      ...defaultQuickEstimate,
      netReceived: "100000",
      periods: 12,
      regularPayment: "3000",
      finalExtraPayment: "50000",
    });

    expect(result.finalPayment.toFixed(2)).toBe("53000.00");
    expect(result.totalRepayment.toFixed(2)).toBe("86000.00");
    expect(result.annualPercentageRate).not.toBeNull();
  });

  it("validates quick estimate inputs", () => {
    const issues = validateQuickEstimate({
      ...defaultQuickEstimate,
      netReceived: "0",
      periods: 0,
      regularPayment: "-1",
      finalExtraPayment: "-1",
    });

    expect(issues).toHaveLength(4);
  });
});
