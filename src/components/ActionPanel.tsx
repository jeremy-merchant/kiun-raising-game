import { Activity } from "../types/game";

interface ActionPanelProps {
  activities: Activity[];
  onPerformActivity: (id: Activity["id"]) => void;
}

export function ActionPanel({ activities, onPerformActivity }: ActionPanelProps) {
  return (
    <section className="card section-card">
      <div className="section-title-row">
        <h2>행동 선택</h2>
        <span className="section-subtle">다양한 루틴으로 이기운을 성장시키자</span>
      </div>

      <div className="action-grid">
        {activities.map((activity) => (
          <button
            key={activity.id}
            className="action-card"
            onClick={() => onPerformActivity(activity.id)}
          >
            <div className="action-card-top">
              <span className="action-emoji">{activity.emoji}</span>
              <div className="action-title-wrap">
                <strong>{activity.label}</strong>
                <span>{activity.duration}분</span>
              </div>
            </div>
            <p>{activity.message}</p>
            <div className="action-meta">
              <span>EXP +{activity.expGain}</span>
              <span>에너지 {activity.energyDelta > 0 ? "+" : ""}{activity.energyDelta}</span>
              <span>코인 {activity.coinDelta > 0 ? "+" : ""}{activity.coinDelta}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
