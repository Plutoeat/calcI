import { useDeferredValue, useMemo, useState } from "react";
import { BalanceChart } from "./components/BalanceChart";
import { ComparisonTable } from "./components/ComparisonTable";
import { CostBreakdown } from "./components/CostBreakdown";
import { ScheduleTable } from "./components/ScheduleTable";
import { formatCurrency, formatRange, formatRate } from "./lib/format";
import {
  accrualModes,
  buildComparisonCards,
  calculateQuickEstimate,
  calculateScenario,
  dayCountBases,
  defaultQuickEstimate,
  defaultScenario,
  repaymentMethods,
  type QuickEstimateInput,
  type ScenarioInput,
  validateQuickEstimate,
  validateScenario,
} from "./lib/loanEngine";

type ProductMode = "quick" | "advanced";
type DetailTab = "method" | "compare" | "charts" | "schedule";

export default function App() {
  const [mode, setMode] = useState<ProductMode>("quick");
  const [quickInput, setQuickInput] =
    useState<QuickEstimateInput>(defaultQuickEstimate);
  const [scenario, setScenario] = useState<ScenarioInput>(defaultScenario);
  const [detailTab, setDetailTab] = useState<DetailTab>("method");

  const deferredQuickInput = useDeferredValue(quickInput);
  const quickIssues = useMemo(
    () => validateQuickEstimate(deferredQuickInput),
    [deferredQuickInput],
  );
  const quickResult = useMemo(
    () =>
      quickIssues.length === 0
        ? calculateQuickEstimate(deferredQuickInput)
        : null,
    [deferredQuickInput, quickIssues],
  );

  const deferredScenario = useDeferredValue(scenario);
  const deferredMode = useDeferredValue(mode);
  const scenarioIssues = useMemo(
    () =>
      deferredMode === "advanced" ? validateScenario(deferredScenario) : [],
    [deferredMode, deferredScenario],
  );
  const result = useMemo(
    () =>
      deferredMode === "advanced" && scenarioIssues.length === 0
        ? calculateScenario(deferredScenario)
        : null,
    [deferredMode, deferredScenario, scenarioIssues],
  );
  const comparisonCards = useMemo(
    () =>
      deferredMode === "advanced" &&
      detailTab === "compare" &&
      scenarioIssues.length === 0
        ? buildComparisonCards(deferredScenario)
        : [],
    [deferredMode, detailTab, deferredScenario, scenarioIssues],
  );
  const activeMethod = useMemo(
    () =>
      repaymentMethods.find((method) => method.key === deferredScenario.method) ??
      repaymentMethods[0],
    [deferredScenario.method],
  );
  const activeBasis = useMemo(
    () =>
      dayCountBases.find((basis) => basis.key === deferredScenario.dayCountBasis) ??
      dayCountBases[0],
    [deferredScenario.dayCountBasis],
  );
  const activeAccrualMode = useMemo(
    () =>
      accrualModes.find((item) => item.key === deferredScenario.accrualMode) ??
      accrualModes[0],
    [deferredScenario.accrualMode],
  );

  function updateQuickField<K extends keyof QuickEstimateInput>(
    key: K,
    value: QuickEstimateInput[K],
  ) {
    setQuickInput((current) => ({ ...current, [key]: value }));
  }

  function updateField<K extends keyof ScenarioInput>(
    key: K,
    value: ScenarioInput[K],
  ) {
    setScenario((current) => ({ ...current, [key]: value }));
  }

  function renderQuickMode() {
    return (
      <>
        <aside className="main-layout__side">
          <section className="panel panel--form panel--compact">
            <div className="panel__header panel__header--stacked">
              <div>
                <p className="kicker">快速估算</p>
                <h2>少量输入即可</h2>
              </div>
              <p className="panel__hint">按实际到手和实际还款估算，先把年化和总成本算出来。</p>
            </div>

            <div className="field-grid field-grid--primary">
              <label className="field">
                <span>实际到手金额</span>
                <input
                  inputMode="decimal"
                  placeholder="100000"
                  value={quickInput.netReceived}
                  onChange={(event) =>
                    updateQuickField("netReceived", event.target.value)
                  }
                />
              </label>

              <label className="field">
                <span>总期数</span>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={quickInput.periods}
                  onChange={(event) =>
                    updateQuickField("periods", Number(event.target.value) || 0)
                  }
                />
              </label>

              <label className="field field--full">
                <span>每期固定还款</span>
                <input
                  inputMode="decimal"
                  placeholder="8884.88"
                  value={quickInput.regularPayment}
                  onChange={(event) =>
                    updateQuickField("regularPayment", event.target.value)
                  }
                />
              </label>

              <label className="field field--full">
                <span>最后一期额外还款</span>
                <input
                  inputMode="decimal"
                  placeholder="没有就填 0"
                  value={quickInput.finalExtraPayment}
                  onChange={(event) =>
                    updateQuickField("finalExtraPayment", event.target.value)
                  }
                />
              </label>
            </div>

            <div className="notice">
              <p>如果前面每期都还一样，最后一期更大，只填“额外多出来”的部分。</p>
              <p>例如前 11 期每期还 3000，最后一期还 13000，这里填 `10000`。</p>
            </div>

            {quickIssues.length > 0 ? (
              <div className="notice notice--error">
                {quickIssues.map((issue) => (
                  <p key={`${issue.field}:${issue.message}`}>{issue.message}</p>
                ))}
              </div>
            ) : null}
          </section>
        </aside>

        <section className="main-layout__content">
          {quickResult ? (
            <>
              <section className="panel panel--result">
                <div className="result-topline">
                  <p className="kicker">估算结果</p>
                  <span className="result-method">快速模式</span>
                </div>

                <div className="result-hero">
                  <span>估算真实年化</span>
                  <strong>{formatRate(quickResult.effectiveAnnualRate)}</strong>
                  <p>基于实际到手金额和还款现金流估算，不依赖你先判断贷款方式。</p>
                </div>

                <div className="rate-rack rate-rack--quick">
                  <div>
                    <span>APR</span>
                    <strong>{formatRate(quickResult.annualPercentageRate)}</strong>
                  </div>
                  <div>
                    <span>月度 IRR</span>
                    <strong>{formatRate(quickResult.monthlyIrr, { digits: 4 })}</strong>
                  </div>
                  <div>
                    <span>最后一期实际还款</span>
                    <strong>{formatCurrency(quickResult.finalPayment)}</strong>
                  </div>
                </div>

                <div className="summary-grid">
                  <article className="summary-card">
                    <span>实际到手</span>
                    <strong>{formatCurrency(quickResult.input.netReceived)}</strong>
                    <p>以你真正拿到的钱为准</p>
                  </article>
                  <article className="summary-card">
                    <span>总共要还</span>
                    <strong>{formatCurrency(quickResult.totalRepayment)}</strong>
                    <p>{`${quickResult.input.periods} 期合计流出`}</p>
                  </article>
                  <article className="summary-card">
                    <span>总成本</span>
                    <strong>{formatCurrency(quickResult.totalCost)}</strong>
                    <p>总还款减去实际到手</p>
                  </article>
                  <article className="summary-card">
                    <span>每期还款</span>
                    <strong>{formatCurrency(quickResult.input.regularPayment)}</strong>
                    <p>
                      {quickResult.input.finalExtraPayment.gt(0)
                        ? "最后一期会更大"
                        : "默认每期一致"}
                    </p>
                  </article>
                </div>

              </section>

              <details className="panel mobile-collapse">
                <summary className="fold-panel__summary fold-panel__summary--compact">
                  <span>高级核验入口</span>
                  <span className="fold-panel__hint">展开</span>
                </summary>
                <div className="mobile-collapse__body">
                  <div className="panel__header">
                    <div>
                      <p className="kicker">下一步</p>
                      <h3>拿到合同后再做高级核验</h3>
                    </div>
                    <p className="panel__hint">如果你已经知道还款方式、日期、费用结构，再切到高级模式精算。</p>
                  </div>
                  <button
                    type="button"
                    className="cta-button"
                    onClick={() => setMode("advanced")}
                  >
                    切到高级核验
                  </button>
                </div>
              </details>
            </>
          ) : (
            <section className="panel empty-state">
              <p className="kicker">无法估算</p>
              <h2>先修正输入</h2>
              <p>只要实际到手和还款金额有效，这里就会直接给出年化和总成本。</p>
            </section>
          )}
        </section>
      </>
    );
  }

  function renderAdvancedDetail() {
    if (!result) {
      return null;
    }

    const paymentText = formatRange(
      result.monthlyPaymentMin,
      result.monthlyPaymentMax,
    );

    if (detailTab === "method") {
      return (
        <section className="panel">
          <div className="panel__header">
            <div>
              <p className="kicker">方式说明</p>
              <h3>{activeMethod.label}</h3>
            </div>
            <p className="panel__hint">XIRR 按实际日期折算，APR = 月IRR × 12。</p>
          </div>

          <div className="method-detail">
            <article className="method-detail__lead">
              <span>核心规则</span>
              <strong>{activeMethod.description}</strong>
            </article>

            <dl className="feature-list">
              <div>
                <dt>还款节奏</dt>
                <dd>{activeMethod.paymentPattern}</dd>
              </div>
              <div>
                <dt>适合场景</dt>
                <dd>{activeMethod.suitableFor}</dd>
              </div>
              <div>
                <dt>主要提醒</dt>
                <dd>{activeMethod.caution}</dd>
              </div>
            </dl>

            <div className="mini-stats">
              <div>
                <span>名义年利率</span>
                <strong>{formatRate(result.nominalAnnualRate)}</strong>
              </div>
              <div>
                <span>月度 IRR</span>
                <strong>{formatRate(result.monthlyIrr, { digits: 4 })}</strong>
              </div>
              <div>
                <span>APR</span>
                <strong>{formatRate(result.annualPercentageRate)}</strong>
              </div>
              <div>
                <span>EAR</span>
                <strong>{formatRate(result.effectiveAnnualRate)}</strong>
              </div>
              <div>
                <span>XIRR 年化</span>
                <strong>{formatRate(result.xirrAnnualRate)}</strong>
              </div>
              <div>
                <span>XIRR 年化基准</span>
                <strong>{activeBasis.label}</strong>
              </div>
              <div>
                <span>计息口径</span>
                <strong>{activeAccrualMode.label}</strong>
              </div>
            </div>

            <div className="notice">
              {result.warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (detailTab === "compare") {
      return (
        <ComparisonTable cards={comparisonCards} activeMethod={scenario.method} />
      );
    }

    if (detailTab === "charts") {
      return (
        <section className="analysis-grid">
          <BalanceChart result={result} />
          <CostBreakdown result={result} />
        </section>
      );
    }

    return <ScheduleTable result={result} />;
  }

  function renderAdvancedMode() {
    const paymentText = result
      ? formatRange(result.monthlyPaymentMin, result.monthlyPaymentMax)
      : "-";
    const paymentHint =
      result && result.monthlyPaymentMin.eq(result.monthlyPaymentMax)
        ? "每期固定"
        : result
          ? `首期 ${formatCurrency(result.schedule[0]?.payment ?? result.monthlyPaymentMin)}，末期 ${formatCurrency(result.schedule[result.schedule.length - 1]?.payment ?? result.monthlyPaymentMax)}`
          : "";
    const feeText =
      result &&
        (result.input.upfrontFee.gt(0) ||
          result.input.monthlyFee.gt(0) ||
          (result.earlySettlement &&
            (result.input.earlySettlementFeePct.gt(0) ||
              result.input.earlySettlementFeeFixed.gt(0))))
        ? `费用已计入真实年化。前置费用 ${formatCurrency(result.input.upfrontFee)}，月服务费 ${formatCurrency(result.input.monthlyFee)}${result.earlySettlement ? `，提前结清违约金 ${formatRate(result.input.earlySettlementFeePct)} + ${formatCurrency(result.input.earlySettlementFeeFixed)}` : ""}。`
        : "当前未计附加费用。";
    const summaryText = result
      ? `净到手 ${formatCurrency(result.netDisbursement)}，${result.monthlyPaymentMin.eq(result.monthlyPaymentMax) ? `每期还款 ${formatCurrency(result.monthlyPaymentMin)}` : `月供区间 ${paymentText}`}${result.earlySettlement ? `，第 ${result.earlySettlement.period} 期结清。` : "。"}`
      : "";
    const contractSummary = result
      ? `${activeAccrualMode.label}，按 ${activeBasis.label} 做 XIRR 年化折算；${scenario.disbursementDate} 放款，${result.schedule[0]?.dueDate ?? scenario.firstRepaymentDate} 起还，${result.schedule.at(-1)?.dueDate ?? scenario.firstRepaymentDate} 到期。XIRR 基准只影响年化披露，不改变分期金额。`
      : "";
    const settlementSummary = result?.earlySettlement
      ? `第 ${result.earlySettlement.period} 期应还日结清，结清支付 ${formatCurrency(result.earlySettlement.payoffAmount)}，其中违约金 ${formatCurrency(result.earlySettlement.settlementFee)}。`
      : "";

    return (
      <>
        <aside className="main-layout__side">
          <section className="panel panel--form panel--compact">
            <div className="panel__header">
              <div>
                <p className="kicker">高级核验</p>
                <h2>合同级参数</h2>
              </div>
              <p className="panel__hint">适合已经拿到合同、想进一步核对条款的人。</p>
            </div>

            <div className="method-switch">
              {repaymentMethods.map((method) => (
                <button
                  key={method.key}
                  type="button"
                  className={`method-switch__item ${
                    scenario.method === method.key
                      ? "method-switch__item--active"
                      : ""
                  }`}
                  onClick={() => updateField("method", method.key)}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <div className="field-grid field-grid--primary">
              <label className="field">
                <span>本金</span>
                <input
                  inputMode="decimal"
                  value={scenario.principal}
                  onChange={(event) =>
                    updateField("principal", event.target.value)
                  }
                />
              </label>

              <label className="field">
                <span>月利率 (%)</span>
                <input
                  inputMode="decimal"
                  value={scenario.monthlyRatePct}
                  onChange={(event) =>
                    updateField("monthlyRatePct", event.target.value)
                  }
                />
              </label>

              <label className="field field--full">
                <span>期数</span>
                <input
                  type="number"
                  min={1}
                  max={360}
                  value={scenario.periods}
                  onChange={(event) =>
                    updateField("periods", Number(event.target.value) || 0)
                  }
                />
              </label>
            </div>

            <details className="fold-panel">
              <summary className="fold-panel__summary fold-panel__summary--compact">
                <span>合同日期、费用与结清</span>
                <span className="fold-panel__hint">高级</span>
              </summary>
              <div className="field-grid field-grid--advanced">
                <label className="field">
                  <span>放款日</span>
                  <input
                    type="date"
                    value={scenario.disbursementDate}
                    onChange={(event) =>
                      updateField("disbursementDate", event.target.value)
                    }
                  />
                </label>

                <label className="field">
                  <span>首期还款日</span>
                  <input
                    type="date"
                    value={scenario.firstRepaymentDate}
                    onChange={(event) =>
                      updateField("firstRepaymentDate", event.target.value)
                    }
                  />
                </label>

                <label className="field field--full">
                  <span>分期计息口径</span>
                  <select
                    value={scenario.accrualMode}
                    onChange={(event) =>
                      updateField(
                        "accrualMode",
                        event.target.value as ScenarioInput["accrualMode"],
                      )
                    }
                  >
                    {accrualModes.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field field--full">
                  <span>XIRR 年化基准</span>
                  <select
                    value={scenario.dayCountBasis}
                    onChange={(event) =>
                      updateField(
                        "dayCountBasis",
                        event.target.value as ScenarioInput["dayCountBasis"],
                      )
                    }
                  >
                    {dayCountBases.map((basis) => (
                      <option key={basis.key} value={basis.key}>
                        {basis.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>前置费用</span>
                  <input
                    inputMode="decimal"
                    value={scenario.upfrontFee}
                    onChange={(event) =>
                      updateField("upfrontFee", event.target.value)
                    }
                  />
                </label>

                <label className="field">
                  <span>月服务费</span>
                  <input
                    inputMode="decimal"
                    value={scenario.monthlyFee}
                    onChange={(event) =>
                      updateField("monthlyFee", event.target.value)
                    }
                  />
                </label>

                <label className="field">
                  <span>提前结清期次 (0=不结清)</span>
                  <input
                    type="number"
                    min={0}
                    max={Math.max(scenario.periods - 1, 0)}
                    value={scenario.earlySettlementPeriod}
                    onChange={(event) =>
                      updateField(
                        "earlySettlementPeriod",
                        Number(event.target.value) || 0,
                      )
                    }
                  />
                </label>

                <label className="field">
                  <span>结清违约金费率 (%)</span>
                  <input
                    inputMode="decimal"
                    value={scenario.earlySettlementFeePct}
                    onChange={(event) =>
                      updateField("earlySettlementFeePct", event.target.value)
                    }
                  />
                </label>

                <label className="field field--full">
                  <span>结清固定违约金</span>
                  <input
                    inputMode="decimal"
                    value={scenario.earlySettlementFeeFixed}
                    onChange={(event) =>
                      updateField("earlySettlementFeeFixed", event.target.value)
                    }
                  />
                </label>
              </div>
            </details>

            {scenarioIssues.length > 0 ? (
              <div className="notice notice--error">
                {scenarioIssues.map((issue) => (
                  <p key={`${issue.field}:${issue.message}`}>{issue.message}</p>
                ))}
              </div>
            ) : null}
          </section>
        </aside>

        <section className="main-layout__content">
          {result ? (
            <>
              <section className="panel panel--result">
                <div className="result-topline">
                  <p className="kicker">高级结果</p>
                  <span className="result-method">{activeMethod.label}</span>
                </div>

                <div className="result-hero">
                  <span>XIRR 年化</span>
                  <strong>{formatRate(result.xirrAnnualRate)}</strong>
                  <p>{summaryText}</p>
                </div>

                <div className="rate-rack">
                  <div>
                    <span>APR</span>
                    <strong>{formatRate(result.annualPercentageRate)}</strong>
                  </div>
                  <div>
                    <span>月度 IRR</span>
                    <strong>{formatRate(result.monthlyIrr, { digits: 4 })}</strong>
                  </div>
                  <div>
                    <span>EAR</span>
                    <strong>{formatRate(result.effectiveAnnualRate)}</strong>
                  </div>
                  <div>
                    <span>名义年利率</span>
                    <strong>{formatRate(result.nominalAnnualRate)}</strong>
                  </div>
                </div>

                <div className="summary-grid">
                  <article className="summary-card">
                    <span>净到手</span>
                    <strong>{formatCurrency(result.netDisbursement)}</strong>
                    <p>实际收到的金额</p>
                  </article>
                  <article className="summary-card">
                    <span>
                      {result.monthlyPaymentMin.eq(result.monthlyPaymentMax)
                        ? "每期还款"
                        : "月供区间"}
                    </span>
                    <strong>{paymentText}</strong>
                    <p>{paymentHint}</p>
                  </article>
                  <article className="summary-card">
                    <span>总成本</span>
                    <strong>{formatCurrency(result.totalCost)}</strong>
                    <p>利息加全部费用</p>
                  </article>
                  <article className="summary-card">
                    <span>总利息</span>
                    <strong>{formatCurrency(result.totalInterest)}</strong>
                    <p>不含附加费用</p>
                  </article>
                  {result.earlySettlement ? (
                    <article className="summary-card">
                      <span>结清支付</span>
                      <strong>{formatCurrency(result.earlySettlement.payoffAmount)}</strong>
                      <p>{`第 ${result.earlySettlement.period} 期应还日，违约金 ${formatCurrency(result.earlySettlement.settlementFee)}`}</p>
                    </article>
                  ) : null}
                </div>

                <p className="result-note">{contractSummary}</p>
                {settlementSummary ? (
                  <p className="result-note">{settlementSummary}</p>
                ) : null}
                <p className="result-note">{feeText}</p>
              </section>

              <details className="detail-shell mobile-collapse">
                <summary className="fold-panel__summary fold-panel__summary--compact">
                  <span>详细分析</span>
                  <span className="fold-panel__hint">展开</span>
                </summary>
                <div className="mobile-collapse__body">
                  <div className="tab-switch" role="tablist" aria-label="高级信息">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "method"}
                      className={`tab-switch__item ${
                        detailTab === "method" ? "tab-switch__item--active" : ""
                      }`}
                      onClick={() => setDetailTab("method")}
                    >
                      方式说明
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "compare"}
                      className={`tab-switch__item ${
                        detailTab === "compare" ? "tab-switch__item--active" : ""
                      }`}
                      onClick={() => setDetailTab("compare")}
                    >
                      对比
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "charts"}
                      className={`tab-switch__item ${
                        detailTab === "charts" ? "tab-switch__item--active" : ""
                      }`}
                      onClick={() => setDetailTab("charts")}
                    >
                      图表
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={detailTab === "schedule"}
                      className={`tab-switch__item ${
                        detailTab === "schedule" ? "tab-switch__item--active" : ""
                      }`}
                      onClick={() => setDetailTab("schedule")}
                    >
                      明细
                    </button>
                  </div>

                  <section className="detail-content">{renderAdvancedDetail()}</section>
                </div>
              </details>
            </>
          ) : (
            <section className="panel empty-state">
              <p className="kicker">无法计算</p>
              <h2>先修正输入参数</h2>
              <p>如果你只想先估算年化和总成本，建议切回快速估算模式。</p>
            </section>
          )}
        </section>
      </>
    );
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <p className="kicker">CalcI</p>
          <h1>贷款年化计算器</h1>
        </div>
        <p className="page-header__meta">少量输入先估算，细节合同再核验</p>
      </header>

      <div className="mode-switch" role="tablist" aria-label="产品模式">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "quick"}
          className={`mode-switch__item ${
            mode === "quick" ? "mode-switch__item--active" : ""
          }`}
          onClick={() => setMode("quick")}
        >
          快速估算
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "advanced"}
          className={`mode-switch__item ${
            mode === "advanced" ? "mode-switch__item--active" : ""
          }`}
          onClick={() => setMode("advanced")}
        >
          高级核验
        </button>
      </div>

      <section className="main-layout">
        {mode === "quick" ? renderQuickMode() : renderAdvancedMode()}
      </section>
    </main>
  );
}
