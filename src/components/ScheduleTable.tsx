import type { ScenarioResult } from "../lib/loanEngine";
import { formatCurrency } from "../lib/format";

interface ScheduleTableProps {
  result: ScenarioResult;
}

export function ScheduleTable({ result }: ScheduleTableProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="kicker">明细</p>
          <h3>逐期还款表</h3>
        </div>
        <p className="panel__hint">按合同日期查看每一笔本金、利息、费用和剩余本金。</p>
      </div>

      <div className="schedule-cards">
        {result.schedule.map((row) => (
          <article key={row.period} className="data-card">
            <div className="data-card__header">
              <strong>
                {row.rowType === "settlement" ? `第 ${row.period} 期结清` : `第 ${row.period} 期`}
              </strong>
              <span>{row.dueDate}</span>
            </div>
            <dl className="data-card__list">
              <div>
                <dt>起息日</dt>
                <dd>{row.startDate}</dd>
              </div>
              <div>
                <dt>区间天数</dt>
                <dd>{row.accrualDays} 天</dd>
              </div>
              <div>
                <dt>当期还款</dt>
                <dd>{formatCurrency(row.payment)}</dd>
              </div>
              <div>
                <dt>本金</dt>
                <dd>{formatCurrency(row.principal)}</dd>
              </div>
              <div>
                <dt>利息</dt>
                <dd>{formatCurrency(row.interest)}</dd>
              </div>
              <div>
                <dt>费用</dt>
                <dd>{formatCurrency(row.fee)}</dd>
              </div>
              {row.settlementFee.gt(0) ? (
                <div>
                  <dt>结清违约金</dt>
                  <dd>{formatCurrency(row.settlementFee)}</dd>
                </div>
              ) : null}
              <div>
                <dt>剩余本金</dt>
                <dd>{formatCurrency(row.balance)}</dd>
              </div>
              <div>
                <dt>累计流出</dt>
                <dd>{formatCurrency(row.cumulativeOutflow)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="table-shell">
        <table className="schedule-table">
          <thead>
            <tr>
              <th>期次</th>
              <th>类型</th>
              <th>起息日</th>
              <th>还款日</th>
              <th>区间天数</th>
              <th>当期还款</th>
              <th>本金</th>
              <th>利息</th>
              <th>费用</th>
              <th>结清违约金</th>
              <th>剩余本金</th>
              <th>累计流出</th>
            </tr>
          </thead>
          <tbody>
            {result.schedule.map((row) => (
              <tr key={row.period}>
                <td>{row.period}</td>
                <td>{row.rowType === "settlement" ? "结清" : "常规"}</td>
                <td>{row.startDate}</td>
                <td>{row.dueDate}</td>
                <td>{row.accrualDays}</td>
                <td>{formatCurrency(row.payment)}</td>
                <td>{formatCurrency(row.principal)}</td>
                <td>{formatCurrency(row.interest)}</td>
                <td>{formatCurrency(row.fee)}</td>
                <td>{formatCurrency(row.settlementFee)}</td>
                <td>{formatCurrency(row.balance)}</td>
                <td>{formatCurrency(row.cumulativeOutflow)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
