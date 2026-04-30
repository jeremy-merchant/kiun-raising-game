import { GameState } from "../types/game";

interface InventoryPanelProps {
  state: GameState;
}

export function InventoryPanel({ state }: InventoryPanelProps) {
  return (
    <section className="card section-card">
      <div className="section-title-row">
        <h2>소지품 & 업적</h2>
        <span className="section-subtle">취향과 성장 흐름을 함께 보여주는 영역</span>
      </div>

      <div className="inventory-grid">
        {state.inventory.map((item) => (
          <div key={item.id} className="inventory-card">
            <div className="inventory-head">
              <span className="inventory-icon">{item.icon}</span>
              <strong>{item.label}</strong>
            </div>
            <span className="inventory-count">x{item.count}</span>
            <p>{item.description}</p>
          </div>
        ))}
      </div>

      <div className="achievement-box">
        <h3>업적</h3>
        {state.achievements.length === 0 ? (
          <p className="muted">아직 업적이 없습니다. 행동을 반복하며 성장시켜보세요.</p>
        ) : (
          <div className="tag-group">
            {state.achievements.map((achievement) => (
              <span key={achievement} className="tag achievement-tag">
                🏆 {achievement}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
