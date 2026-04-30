import { GameState } from "../types/game";

interface LogPanelProps {
  state: GameState;
}

export function LogPanel({ state }: LogPanelProps) {
  return (
    <section className="card section-card">
      <div className="section-title-row">
        <h2>최근 기록</h2>
        <span className="section-subtle">행동과 이벤트 로그</span>
      </div>

      <div className="log-list">
        {state.logs.map((log) => (
          <div key={log.id} className={`log-item log-${log.type}`}>
            <div className="log-meta">
              <span>Day {log.day}</span>
              <span>{log.time}</span>
            </div>
            <p>{log.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
