import "./index.css";
import { useEffect, useMemo, useState } from "react";

type StatKey = "focus" | "stamina" | "mood" | "social" | "coding";
type ActionId = "coding" | "exercise" | "meal" | "rest" | "goout" | "sleep";

interface Stat {
  key: StatKey;
  label: string;
  icon: string;
  level: number;
  value: number;
  colorClass: string;
}

interface InventoryItem {
  id: string;
  label: string;
  icon: string;
  count: number;
  locked?: boolean;
}

interface Action {
  id: ActionId;
  label: string;
  icon: string;
  spriteClass: string;
  bubble: string;
  result: string;
  energyDelta: number;
  heartDelta: number;
  coinDelta: number;
  expGain: number;
  statChanges: Partial<Record<StatKey, number>>;
}

interface MiniScene {
  id: string;
  label: string;
  spriteClass: string;
  bubble: string;
  className: string;
}

interface GameState {
  level: number;
  exp: number;
  expToNext: number;
  hearts: number;
  energy: number;
  coins: number;
  timeText: string;
  weekday: string;
  todayMessage: string;
  currentBubble: string;
  currentAction: ActionId | "idle";
  stats: Stat[];
  inventory: InventoryItem[];
  achievements: string[];
  eventNotice: string;
}

const STORAGE_KEY = "kiun-ui-life-sim-v1";

function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}

const ASSETS = {
  profile: asset("assets/kiun/real-1.jpg"),
  cover: asset("assets/kiun/cover-art.png"),
  sprite: asset("assets/kiun/pixel-sprite.png"),
  emotion: asset("assets/kiun/emotion-sheet.png"),
};

const INITIAL_STATS: Stat[] = [
  {
    key: "focus",
    label: "집중력",
    icon: "🧠",
    level: 7,
    value: 78,
    colorClass: "blue",
  },
  {
    key: "stamina",
    label: "체력",
    icon: "💪",
    level: 6,
    value: 64,
    colorClass: "green",
  },
  {
    key: "mood",
    label: "기분",
    icon: "🙂",
    level: 6,
    value: 72,
    colorClass: "pink",
  },
  {
    key: "social",
    label: "사회성",
    icon: "👥",
    level: 5,
    value: 48,
    colorClass: "purple",
  },
  {
    key: "coding",
    label: "코딩력",
    icon: "⌨️",
    level: 8,
    value: 86,
    colorClass: "orange",
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: "laptop", label: "노트북", icon: "💻", count: 1 },
  { id: "coffee", label: "아메리카노", icon: "☕", count: 7 },
  { id: "book", label: "책", icon: "📘", count: 4 },
  { id: "earphone", label: "이어폰", icon: "🎧", count: 1 },
  { id: "plant", label: "식물", icon: "🪴", count: 2 },
  { id: "locked", label: "Lv.10", icon: "🔒", count: 0, locked: true },
];

const ACTIONS: Action[] = [
  {
    id: "coding",
    label: "코딩하기",
    icon: "💻",
    spriteClass: "sprite-coding",
    bubble: "집중중...",
    result: "코딩 2시간 완료. 오늘도 한 뼘 성장 중!",
    energyDelta: -12,
    heartDelta: 1,
    coinDelta: 20,
    expGain: 28,
    statChanges: { focus: 6, coding: 8, mood: 1 },
  },
  {
    id: "exercise",
    label: "운동하기",
    icon: "🏃",
    spriteClass: "sprite-run",
    bubble: "운동 완료!",
    result: "몸을 움직였더니 머리도 맑아졌다.",
    energyDelta: -10,
    heartDelta: 2,
    coinDelta: 0,
    expGain: 18,
    statChanges: { stamina: 8, mood: 5, social: 1 },
  },
  {
    id: "meal",
    label: "밥먹기",
    icon: "🍚",
    spriteClass: "sprite-meal",
    bubble: "냠냠~",
    result: "든든하게 먹었다. 에너지가 회복됐다.",
    energyDelta: 18,
    heartDelta: 2,
    coinDelta: -8,
    expGain: 8,
    statChanges: { stamina: 4, mood: 4 },
  },
  {
    id: "rest",
    label: "쉬기",
    icon: "🛋️",
    spriteClass: "sprite-rest",
    bubble: "쉬는 중",
    result: "쉬는 것도 전략이다. 기분이 부드러워졌다.",
    energyDelta: 14,
    heartDelta: 3,
    coinDelta: 0,
    expGain: 7,
    statChanges: { mood: 7, focus: -1 },
  },
  {
    id: "goout",
    label: "외출하기",
    icon: "🚶",
    spriteClass: "sprite-goout",
    bubble: "다녀올게!",
    result: "바깥 공기를 쐬고 왔다. 사회성이 올랐다.",
    energyDelta: -8,
    heartDelta: 2,
    coinDelta: -10,
    expGain: 16,
    statChanges: { social: 8, mood: 4, focus: -1 },
  },
  {
    id: "sleep",
    label: "잠자기",
    icon: "🌙",
    spriteClass: "sprite-sleep",
    bubble: "쿨쿨...",
    result: "푹 잤다. 내일도 다시 성장할 수 있다.",
    energyDelta: 28,
    heartDelta: 4,
    coinDelta: 0,
    expGain: 10,
    statChanges: { stamina: 6, mood: 6, focus: 2 },
  },
];

const MINI_SCENES: MiniScene[] = [
  {
    id: "coding",
    label: "코딩",
    spriteClass: "sprite-coding",
    bubble: "집중중...",
    className: "mini-coding",
  },
  {
    id: "meal",
    label: "밥",
    spriteClass: "sprite-meal",
    bubble: "냠냠~",
    className: "mini-meal",
  },
  {
    id: "exercise",
    label: "운동",
    spriteClass: "sprite-happy",
    bubble: "운동 완료!",
    className: "mini-exercise",
  },
  {
    id: "reading",
    label: "독서",
    spriteClass: "sprite-reading",
    bubble: "독서 중",
    className: "mini-reading",
  },
];

function createInitialState(): GameState {
  return {
    level: 7,
    exp: 235,
    expToNext: 420,
    hearts: 92,
    energy: 68,
    coins: 12450,
    timeText: "PM 08:45",
    weekday: "목요일",
    todayMessage: "천천히 해도 괜찮아,\n꾸준히 가는 게 중요해.",
    currentBubble: "오늘도 한 뼘 성장 중!",
    currentAction: "idle",
    stats: INITIAL_STATS.map((stat) => ({ ...stat })),
    inventory: INITIAL_INVENTORY.map((item) => ({ ...item })),
    achievements: ["다음 레벨 보상"],
    eventNotice: "",
  };
}

function loadState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();

    const parsed = JSON.parse(saved) as GameState;

    return {
      ...createInitialState(),
      ...parsed,
      stats: parsed.stats?.length ? parsed.stats : INITIAL_STATS.map((stat) => ({ ...stat })),
      inventory: parsed.inventory?.length
        ? parsed.inventory
        : INITIAL_INVENTORY.map((item) => ({ ...item })),
    };
  } catch {
    return createInitialState();
  }
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function signed(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function updateStatLevels(stats: Stat[]) {
  return stats.map((stat) => ({
    ...stat,
    level: Math.max(1, Math.floor(stat.value / 12) + 1),
  }));
}

function addAchievement(state: GameState, achievement: string) {
  if (state.achievements.includes(achievement)) return state.achievements;
  return [...state.achievements, achievement];
}

function App() {
  const [game, setGame] = useState<GameState>(() => loadState());
  const [toast, setToast] = useState("");
  const [isEventOpen, setIsEventOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast("");
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedAction = useMemo(() => {
    return ACTIONS.find((action) => action.id === game.currentAction);
  }, [game.currentAction]);

  const expPercent = clamp((game.exp / game.expToNext) * 100);

  function performAction(action: Action) {
    setGame((prev) => {
      let nextExp = prev.exp + action.expGain;
      let nextLevel = prev.level;
      let nextExpToNext = prev.expToNext;
      let nextCoins = Math.max(0, prev.coins + action.coinDelta);
      let nextAchievements = [...prev.achievements];
      let levelUp = false;

      while (nextExp >= nextExpToNext) {
        nextExp -= nextExpToNext;
        nextLevel += 1;
        nextExpToNext = Math.floor(nextExpToNext * 1.18);
        nextCoins += 300;
        levelUp = true;
      }

      const nextStats = updateStatLevels(
        prev.stats.map((stat) => {
          const change = action.statChanges[stat.key] ?? 0;
          return {
            ...stat,
            value: clamp(stat.value + change),
          };
        })
      );

      if (nextLevel >= 8) nextAchievements = addAchievement({ ...prev, achievements: nextAchievements }, "성장 가속");
      if ((nextStats.find((stat) => stat.key === "coding")?.value ?? 0) >= 95) {
        nextAchievements = addAchievement({ ...prev, achievements: nextAchievements }, "몰입 개발자");
      }
      if ((nextStats.find((stat) => stat.key === "focus")?.value ?? 0) >= 90) {
        nextAchievements = addAchievement({ ...prev, achievements: nextAchievements }, "집중의 달인");
      }
      if (action.id === "sleep") {
        nextAchievements = addAchievement({ ...prev, achievements: nextAchievements }, "회복도 실력");
      }

      const specialNotice = levelUp
        ? `Lv.${nextLevel} 달성! 새로운 이벤트가 해금됩니다.` 
        : action.result;

      setToast(levelUp ? `레벨업! Lv.${nextLevel}` : action.result);

      return {
        ...prev,
        level: nextLevel,
        exp: nextExp,
        expToNext: nextExpToNext,
        hearts: clamp(prev.hearts + action.heartDelta),
        energy: clamp(prev.energy + action.energyDelta),
        coins: nextCoins,
        currentAction: action.id,
        currentBubble: action.bubble,
        todayMessage: action.result,
        stats: nextStats,
        achievements: nextAchievements,
        eventNotice: specialNotice,
      };
    });
  }

  function openEvent() {
    setIsEventOpen(true);
    setGame((prev) => {
      const bonusCoins = 150 + prev.level * 20;
      setToast(`이벤트 보상: 코인 +${bonusCoins}`);

      return {
        ...prev,
        coins: prev.coins + bonusCoins,
        hearts: clamp(prev.hearts + 3),
        todayMessage: "작은 루틴이 위대한 성장으로 이어진다.",
        currentBubble: "이벤트 보상 획득!",
        achievements: addAchievement(prev, "이벤트 참여"),
      };
    });
  }

  function resetGame() {
    const next = createInitialState();
    setGame(next);
    setToast("저장 데이터를 초기화했습니다.");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <div
      className="game-root"
      style={
        { "--sprite-image": `url(${ASSETS.sprite})` } as React.CSSProperties
      }
    >
      <div
        className="game-background"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(29, 22, 17, 0.22), rgba(29, 22, 17, 0.02)), url(${ASSETS.cover})`,
        }}
      />
      <div className="game-vignette" />

      <header className="top-hud">
        <section className="profile-card hud-card">
          <div className="profile-avatar">
            <img
              src={ASSETS.profile}
              alt="이기운 프로필"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <span>이</span>
          </div>
          <div className="profile-main">
            <div className="profile-title">
              <span>Lv. {game.level}</span>
              <strong>이기운</strong>
            </div>
            <div className="exp-line">
              <small>
                EXP {game.exp} / {game.expToNext}
              </small>
              <div className="mini-meter">
                <div className="mini-meter-fill exp-fill" style={{ width: `${expPercent}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="resource-row">
          <div className="resource-chip hud-card">
            <span className="resource-icon">❤️</span>
            <strong>{game.hearts} / 100</strong>
            <button type="button">+</button>
          </div>
          <div className="resource-chip hud-card">
            <span className="resource-icon">⚡</span>
            <strong>{game.energy} / 100</strong>
            <button type="button">+</button>
          </div>
          <div className="resource-chip hud-card">
            <span className="resource-icon">🪙</span>
            <strong>{game.coins.toLocaleString()}</strong>
            <button type="button">+</button>
          </div>
          <div className="time-chip hud-card">
            <span>🌙</span>
            <div>
              <strong>{game.timeText}</strong>
              <small>{game.weekday}</small>
            </div>
          </div>
          <button className="setting-button hud-card" type="button" onClick={resetGame}>
            ⚙️
          </button>
        </section>
      </header>

      <main className="game-screen">
        <aside className="stat-panel panel-card">
          <div className="panel-title">
            <span>💗</span>
            <h2>능력치</h2>
          </div>

          <div className="stat-list">
            {game.stats.map((stat) => (
              <div className="stat-item" key={stat.key}>
                <div className="stat-head">
                  <span className="stat-icon">{stat.icon}</span>
                  <strong>{stat.label}</strong>
                  <em>Lv. {stat.level}</em>
                </div>
                <div className="stat-body">
                  <div className="stat-meter">
                    <div
                      className={`stat-meter-fill ${stat.colorClass}`}
                      style={{ width: `${stat.value}%` }}
                    />
                  </div>
                  <small>{stat.value} / 100</small>
                </div>
              </div>
            ))}
          </div>

          <div className="reward-box">
            <div>
              <strong>⭐ 다음 레벨 보상</strong>
              <p>새로운 이벤트가 해금됩니다!</p>
            </div>
            <span>🎁</span>
          </div>
        </aside>

        <section className="center-stage">
          <div className="floating-status status-focus">
            <span className="mini-sprite sprite-coding" />
            <p>집중중...</p>
          </div>

          <div className="main-bubble">
            {selectedAction ? selectedAction.bubble : game.currentBubble}
          </div>

          {MINI_SCENES.map((scene) => (
            <div className={`mini-character ${scene.className}`} key={scene.id}>
              <div className="mini-bubble">{scene.bubble}</div>
              <span className={`mini-sprite ${scene.spriteClass}`} />
            </div>
          ))}
        </section>

        <aside className="inventory-area">
          <section className="inventory-panel panel-card">
            <div className="panel-title">
              <span>💼</span>
              <h2>소지품</h2>
            </div>

            <div className="inventory-grid">
              {game.inventory.map((item) => (
                <div className={`inventory-item ${item.locked ? "locked" : ""}`} key={item.id}>
                  <div className="inventory-icon">{item.icon}</div>
                  <strong>{item.label}</strong>
                  {!item.locked && <small>x {item.count}</small>}
                </div>
              ))}
            </div>

            <button className="more-button" type="button">
              더 보기 ›
            </button>
          </section>

          <section className="message-panel panel-card">
            <h3>💞 오늘의 한마디</h3>
            <p>{game.todayMessage}</p>
          </section>
        </aside>
      </main>

      <nav className="bottom-actions">
        <button className="side-button" type="button">
          <span>📅</span>
          <small>일정 보기</small>
        </button>

        <div className="action-row">
          {ACTIONS.map((action) => (
            <button
              className={`action-button ${game.currentAction === action.id ? "active" : ""}`}
              key={action.id}
              type="button"
              onClick={() => performAction(action)}
            >
              <span className={`action-sprite ${action.spriteClass}`} />
              <strong>{action.label}</strong>
              <small>
                EXP +{action.expGain} · 에너지 {signed(action.energyDelta)}
              </small>
            </button>
          ))}
        </div>

        <button className="side-button event-button" type="button" onClick={openEvent}>
          <span>🎁</span>
          <small>이벤트</small>
          <i />
        </button>
      </nav>

      {toast && <div className="toast">{toast}</div>}

      {isEventOpen && (
        <div className="modal-backdrop" onClick={() => setIsEventOpen(false)}>
          <div className="event-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" type="button" onClick={() => setIsEventOpen(false)}>
              ×
            </button>
            <div className="event-modal-icon">🌱</div>
            <h2>작은 루틴 이벤트</h2>
            <p>{game.eventNotice || "오늘도 한 뼘 성장했습니다."}</p>
            <div className="event-modal-reward">
              <span>보상</span>
              <strong>코인 + 보너스 / 하트 +3</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
