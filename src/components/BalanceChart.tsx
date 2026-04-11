import type { ScenarioResult } from "../lib/loanEngine";
import { formatCurrency } from "../lib/format";

interface BalanceChartProps {
  result: ScenarioResult;
}

export function BalanceChart({ result }: BalanceChartProps) {
  const balances = [
    result.input.principal.toNumber(),
    ...result.schedule.map((row) => row.balance.toNumber()),
  ];
  const max = Math.max(...balances, 1);
  const width = 560;
  const height = 220;

  const points = balances
    .map((value, index) => {
      const x = (index / (balances.length - 1 || 1)) * width;
      const y = height - (value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="kicker">曲线</p>
          <h3>本金余额</h3>
        </div>
        <p className="panel__hint">看本金下降速度和尾部压力。</p>
      </div>

      <div className="chart-shell">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="balance-chart"
          role="img"
          aria-label="剩余本金曲线"
        >
          <defs>
            <linearGradient id="balance-fill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(12, 84, 96, 0.42)" />
              <stop offset="100%" stopColor="rgba(12, 84, 96, 0.04)" />
            </linearGradient>
          </defs>
          <polygon points={fillPoints} fill="url(#balance-fill)" />
          <polyline points={points} fill="none" stroke="#0c5460" strokeWidth="4" />
        </svg>
      </div>

      <div className="chart-stats">
        <div>
          <span>期初本金</span>
          <strong>{formatCurrency(result.input.principal)}</strong>
        </div>
        <div>
          <span>最后一期后余额</span>
          <strong>{formatCurrency(result.schedule[result.schedule.length - 1]?.balance ?? result.input.principal)}</strong>
        </div>
      </div>
    </section>
  );
}
