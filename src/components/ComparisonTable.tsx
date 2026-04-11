import type { ComparisonCard, RepaymentMethod } from "../lib/loanEngine";
import { formatCurrency, formatRange, formatRate } from "../lib/format";

interface ComparisonTableProps {
  cards: ComparisonCard[];
  activeMethod: RepaymentMethod;
}

export function ComparisonTable({
  cards,
  activeMethod,
}: ComparisonTableProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="kicker">对比</p>
          <h3>不同还款方式</h3>
        </div>
        <p className="panel__hint">相同参数下，直接比较 XIRR 年化、APR 和总成本。</p>
      </div>

      <div className="comparison-mobile">
        {cards.map((card) => (
          <article
            key={card.method.key}
            className={`data-card ${
              card.method.key === activeMethod ? "data-card--active" : ""
            }`}
          >
            <div className="data-card__header">
              <strong>{card.method.label}</strong>
              <span>{card.method.key === activeMethod ? "当前" : "候选"}</span>
            </div>
            <dl className="data-card__list">
              <div>
                <dt>XIRR 年化</dt>
                <dd>{formatRate(card.xirrAnnualRate)}</dd>
              </div>
              <div>
                <dt>APR</dt>
                <dd>{formatRate(card.annualPercentageRate)}</dd>
              </div>
              <div>
                <dt>月供</dt>
                <dd>{formatRange(card.monthlyPaymentMin, card.monthlyPaymentMax)}</dd>
              </div>
              <div>
                <dt>总成本</dt>
                <dd>{formatCurrency(card.totalCost)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="table-shell">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>方式</th>
              <th>XIRR 年化</th>
              <th>APR</th>
              <th>月供</th>
              <th>总成本</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr
                key={card.method.key}
                className={
                  card.method.key === activeMethod
                    ? "comparison-table__row comparison-table__row--active"
                    : "comparison-table__row"
                }
              >
                <td>{card.method.label}</td>
                <td>{formatRate(card.xirrAnnualRate)}</td>
                <td>{formatRate(card.annualPercentageRate)}</td>
                <td>{formatRange(card.monthlyPaymentMin, card.monthlyPaymentMax)}</td>
                <td>{formatCurrency(card.totalCost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
