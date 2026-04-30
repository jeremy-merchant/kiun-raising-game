import { GameState } from "../types/game";
import { formatTime, getWeekdayLabel } from "../utils/game";

interface TopBarProps {
  state: GameState;
}

export function TopBar({ state }: TopBarProps) {
  const expInCurrentLevel = state.exp % 100;

  return (
    <header className="topbar card">
      <div className="topbar-profile">
        <div className="avatar">
          <img
            src="/assets/kiun/real-1.jpg"
            alt="이기운 프로필"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span>이</span>
        </div>
        <div className="topbar-profile-text">
          <div className="eyebrow">Lv. {state.level}</div>
          <h1>{state.profile.name} 키우기</h1>
          <div className="exp-row">
            <span>EXP {expInCurrentLevel} / 100</span>
            <div className="bar">
              <div className="bar-fill exp-fill" style={{ width: `${expInCurrentLevel}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="topbar-resources">
        <div className="resource-chip">
          <span>❤️ 하트</span>
          <strong>{state.hearts} / 100</strong>
        </div>
        <div className="resource-chip">
          <span>⚡ 에너지</span>
          <strong>{state.energy} / 100</strong>
        </div>
        <div className="resource-chip">
          <span>🪙 코인</span>
          <strong>{state.coins.toLocaleString()}</strong>
        </div>
        <div className="resource-chip">
          <span>🗓️ Day {state.day}</span>
          <strong>
            {getWeekdayLabel(state.weekdayIndex)} · {formatTime(state.minutes)}
          </strong>
        </div>
      </div>
    </header>
  );
}
