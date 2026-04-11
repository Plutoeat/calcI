import type { ScenarioResult } from "../lib/loanEngine";
import { formatCurrency } from "../lib/format";

interface CostBreakdownProps {
  result: ScenarioResult;
}

export function CostBreakdown({ result }: CostBreakdownProps) {
  const principal = result.input.principal;
  const interest = result.totalInterest;
  const fees = result.totalFees;
  const total = principal.plus(interest).plus(fees);

  const principalShare = principal.div(total).times(100);
  const interestShare = interest.div(total).times(100);
  const feeShare = fees.div(total).times(100);

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="kicker">成本</p>
          <h3>构成拆分</h3>
        </div>
        <p className="panel__hint">本金、利息、费用分开看。</p>
      </div>

      <div className="stacked-bar" aria-label="总流出拆解">
        <span
          className="stacked-bar__slice stacked-bar__slice--principal"
          style={{ width: `${principalShare.toFixed(2)}%` }}
        />
        <span
          className="stacked-bar__slice stacked-bar__slice--interest"
          style={{ width: `${interestShare.toFixed(2)}%` }}
        />
        <span
          className="stacked-bar__slice stacked-bar__slice--fee"
          style={{ width: `${feeShare.toFixed(2)}%` }}
        />
      </div>

      <div className="legend-list">
        <div className="legend-item">
          <span className="legend-item__swatch legend-item__swatch--principal" />
          <div>
            <strong>归还本金</strong>
            <p>{formatCurrency(principal)}</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-item__swatch legend-item__swatch--interest" />
          <div>
            <strong>累计利息</strong>
            <p>{formatCurrency(interest)}</p>
          </div>
        </div>
        <div className="legend-item">
          <span className="legend-item__swatch legend-item__swatch--fee" />
          <div>
            <strong>累计费用</strong>
            <p>{formatCurrency(fees)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
