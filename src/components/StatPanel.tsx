import { GameState } from "../types/game";

interface StatPanelProps {
  state: GameState;
}

export function StatPanel({ state }: StatPanelProps) {
  const stats = Object.values(state.stats);

  return (
    <section className="card section-card">
      <div className="section-title-row">
        <h2>능력치</h2>
        <span className="section-subtle">이기운의 현재 성장 상태</span>
      </div>

      <div className="stat-list">
        {stats.map((stat) => (
          <div key={stat.key} className="stat-item">
            <div className="stat-item-head">
              <div className="stat-item-label">
                <span className="stat-icon">{stat.icon}</span>
                <span>{stat.label}</span>
              </div>
              <div className="stat-meta">
                <span>Lv. {stat.level}</span>
                <strong>{stat.value} / 100</strong>
              </div>
            </div>
            <div className="bar">
              <div
                className="bar-fill"
                style={{ width: `${stat.value}%`, background: stat.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
