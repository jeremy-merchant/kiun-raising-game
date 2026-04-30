import "./index.css";
import { useEffect, useMemo, useState } from "react";

type StatKey = "focus" | "stamina" | "mood" | "social" | "coding";
type ActionId = "coding" | "exercise" | "meal" | "rest" | "goout" | "sleep";
type GoalId = "coding" | "exercise" | "meal" | "rest" | "goout" | "sleep" | "balance";

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
  shortageText: string;
  timeCost: number;
  minEnergy: number;
  minCoins: number;
  energyDelta: number;
  heartDelta: number;
  coinDelta: number;
  expGain: number;
  statChanges: Partial<Record<StatKey, number>>;
  resultPool: string[];
}

interface MiniScene {
  id: string;
  label: string;
  spriteClass: string;
  bubble: string;
  className: string;
}

interface DailyGoal {
  id: GoalId;
  label: string;
  done: boolean;
}

interface FloatingReward {
  id: number;
  text: string;
  kind: "good" | "warn" | "bonus";
}

interface GameState {
  level: number;
  exp: number;
  expToNext: number;
  hearts: number;
  energy: number;
  coins: number;
  day: number;
  minutes: number;
  totalActions: number;
  lastAction: ActionId | "idle";
  repeatCount: number;
  eventClaimedToday: boolean;
  timeText: string;
  weekday: string;
  todayMessage: string;
  currentBubble: string;
  currentAction: ActionId | "idle";
  stats: Stat[];
  inventory: InventoryItem[];
  achievements: string[];
  eventNotice: string;
  dailyGoals: DailyGoal[];
  completedGoalRewardIds: string[];
}

const STORAGE_KEY = "kiun-ui-life-sim-v2";

function asset(path: string) {
  return `${import.meta.env.BASE_URL}${path}`;
}

const ASSETS = {
  profile: asset("assets/kiun/profile-main.png"),
  cover: asset("assets/kiun/cover-art.png"),
  sprite: asset("assets/kiun/sprites/sprite-hero.png"),
  emotion: asset("assets/kiun/sprites/sprite-hero.png"),
};

const UI_ICON_MAP = {
  calendar: asset("assets/kiun/ui/ui-calendar.png"),
  gift: asset("assets/kiun/ui/ui-gift.png"),
};

const ACTION_ICON_MAP: Record<ActionId, string> = {
  coding: asset("assets/kiun/actions/action-work.png"),
  exercise: asset("assets/kiun/actions/action-exercise.png"),
  meal: asset("assets/kiun/actions/action-food.png"),
  rest: asset("assets/kiun/actions/action-play.png"),
  goout: asset("assets/kiun/actions/action-travel.png"),
  sleep: asset("assets/kiun/actions/action-sleep.png"),
};

const INVENTORY_ICON_MAP: Record<string, string> = {
  laptop: asset("assets/kiun/items/item-book.png"),
  coffee: asset("assets/kiun/items/item-drink.png"),
  book: asset("assets/kiun/items/item-book.png"),
  earphone: asset("assets/kiun/items/item-accessory.png"),
  plant: asset("assets/kiun/items/item-toy.png"),
  locked: asset("assets/kiun/items/item-locked.png"),
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

const DAILY_GOAL_POOL: DailyGoal[] = [
  { id: "coding", label: "코딩 한 번 하기", done: false },
  { id: "exercise", label: "몸 한 번 움직이기", done: false },
  { id: "meal", label: "밥 챙겨 먹기", done: false },
  { id: "rest", label: "무리하지 않고 쉬기", done: false },
  { id: "goout", label: "바깥 공기 쐬기", done: false },
  { id: "sleep", label: "제때 잠들기", done: false },
  { id: "balance", label: "서로 다른 행동 3번 하기", done: false },
];

const ACTIONS: Action[] = [
  {
    id: "coding",
    label: "코딩하기",
    icon: "💻",
    spriteClass: "sprite-coding",
    bubble: "집중중...",
    result: "코딩 2시간 완료. 오늘도 한 뼘 성장 중!",
    shortageText: "지금은 집중할 에너지가 부족해. 밥먹기나 쉬기를 먼저 하자.",
    timeCost: 120,
    minEnergy: 18,
    minCoins: 0,
    energyDelta: -12,
    heartDelta: 1,
    coinDelta: 20,
    expGain: 28,
    statChanges: { focus: 6, coding: 8, mood: 1 },
    resultPool: [
      "코드가 한 덩어리 정리됐다. 뿌듯함이 살짝 올라왔다.",
      "막히던 부분을 해결했다. 오늘의 집중력이 꽤 좋다.",
      "커밋 하나를 남겼다. 작지만 확실한 성장이다.",
    ],
  },
  {
    id: "exercise",
    label: "운동하기",
    icon: "🏃",
    spriteClass: "sprite-run",
    bubble: "운동 완료!",
    result: "몸을 움직였더니 머리도 맑아졌다.",
    shortageText: "지금 체력이 너무 낮아. 먼저 밥먹기나 쉬기를 하자.",
    timeCost: 70,
    minEnergy: 14,
    minCoins: 0,
    energyDelta: -10,
    heartDelta: 2,
    coinDelta: 0,
    expGain: 18,
    statChanges: { stamina: 8, mood: 5, social: 1 },
    resultPool: [
      "짧게 움직였는데도 몸이 풀렸다.",
      "운동 완료. 머리가 조금 맑아졌다.",
      "체력이 미래의 집중력으로 바뀌는 중이다.",
    ],
  },
  {
    id: "meal",
    label: "밥먹기",
    icon: "🍚",
    spriteClass: "sprite-meal",
    bubble: "냠냠~",
    result: "든든하게 먹었다. 에너지가 회복됐다.",
    shortageText: "코인이 부족해서 밥을 먹기 어렵다. 코딩으로 조금 벌자.",
    timeCost: 45,
    minEnergy: 0,
    minCoins: 8,
    energyDelta: 18,
    heartDelta: 2,
    coinDelta: -8,
    expGain: 8,
    statChanges: { stamina: 4, mood: 4 },
    resultPool: [
      "밥을 먹으니 세상이 조금 덜 날카로워졌다.",
      "든든하게 먹었다. 다시 움직일 힘이 생겼다.",
      "에너지가 회복됐다. 역시 밥은 기본 버프다.",
    ],
  },
  {
    id: "rest",
    label: "쉬기",
    icon: "🛋️",
    spriteClass: "sprite-rest",
    bubble: "쉬는 중",
    result: "쉬는 것도 전략이다. 기분이 부드러워졌다.",
    shortageText: "쉴 수 없는 상태는 없어. 지금 바로 쉬어도 된다.",
    timeCost: 50,
    minEnergy: 0,
    minCoins: 0,
    energyDelta: 14,
    heartDelta: 3,
    coinDelta: 0,
    expGain: 7,
    statChanges: { mood: 7, focus: -1 },
    resultPool: [
      "잠깐 멈췄다. 다시 시작할 수 있는 여백이 생겼다.",
      "쉬는 것도 루틴이다. 기분이 조금 회복됐다.",
      "아무것도 안 한 게 아니라 회복을 했다.",
    ],
  },
  {
    id: "goout",
    label: "외출하기",
    icon: "🚶",
    spriteClass: "sprite-goout",
    bubble: "다녀올게!",
    result: "바깥 공기를 쐬고 왔다. 사회성이 올랐다.",
    shortageText: "지금은 나갈 힘이나 코인이 부족하다. 회복을 먼저 하자.",
    timeCost: 90,
    minEnergy: 12,
    minCoins: 10,
    energyDelta: -8,
    heartDelta: 2,
    coinDelta: -10,
    expGain: 16,
    statChanges: { social: 8, mood: 4, focus: -1 },
    resultPool: [
      "밖에 나갔다 왔다. 생각보다 괜찮은 하루가 됐다.",
      "짧은 외출이었지만 기분 전환은 확실했다.",
      "사람 냄새를 조금 맡고 왔다. 사회성이 올랐다.",
    ],
  },
  {
    id: "sleep",
    label: "잠자기",
    icon: "🌙",
    spriteClass: "sprite-sleep",
    bubble: "쿨쿨...",
    result: "푹 잤다. 내일도 다시 성장할 수 있다.",
    shortageText: "잠은 언제든 잘 수 있다.",
    timeCost: 480,
    minEnergy: 0,
    minCoins: 0,
    energyDelta: 28,
    heartDelta: 4,
    coinDelta: 0,
    expGain: 10,
    statChanges: { stamina: 6, mood: 6, focus: 2 },
    resultPool: [
      "푹 잤다. 내일의 이기운이 조금 더 좋아졌다.",
      "수면으로 하루를 정리했다. 회복도 실력이다.",
      "잠을 자니 다시 시작할 힘이 돌아왔다.",
    ],
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

function createDailyGoals(day: number): DailyGoal[] {
  const first = DAILY_GOAL_POOL[day % 5];
  const second = DAILY_GOAL_POOL[(day + 2) % 6];
  const third = DAILY_GOAL_POOL[6];
  return [first, second, third].map((goal) => ({ ...goal, done: false }));
}

function createInitialState(): GameState {
  return {
    level: 7,
    exp: 235,
    expToNext: 420,
    hearts: 92,
    energy: 68,
    coins: 12450,
    day: 1,
    minutes: 20 * 60 + 45,
    totalActions: 0,
    lastAction: "idle",
    repeatCount: 0,
    eventClaimedToday: false,
    timeText: "PM 08:45",
    weekday: "목요일",
    todayMessage: "천천히 해도 괜찮아,\n꾸준히 가는 게 중요해.",
    currentBubble: "오늘도 한 뼘 성장 중!",
    currentAction: "idle",
    stats: INITIAL_STATS.map((stat) => ({ ...stat })),
    inventory: INITIAL_INVENTORY.map((item) => ({ ...item })),
    achievements: ["다음 레벨 보상"],
    eventNotice: "",
    dailyGoals: createDailyGoals(1),
    completedGoalRewardIds: [],
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
      day: parsed.day ?? 1,
      minutes: parsed.minutes ?? 20 * 60 + 45,
      totalActions: parsed.totalActions ?? 0,
      lastAction: parsed.lastAction ?? "idle",
      repeatCount: parsed.repeatCount ?? 0,
      eventClaimedToday: parsed.eventClaimedToday ?? false,
      dailyGoals: parsed.dailyGoals?.length ? parsed.dailyGoals : createDailyGoals(parsed.day ?? 1),
      completedGoalRewardIds: parsed.completedGoalRewardIds ?? [],
      timeText: formatTime(parsed.minutes ?? 20 * 60 + 45),
      weekday: formatWeekday(parsed.day ?? 1),
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

function formatTime(minutes: number) {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${period} ${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatWeekday(day: number) {
  const weekdays = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];
  return weekdays[(day + 2) % weekdays.length];
}

function pickResult(action: Action, seed: number) {
  return action.resultPool[seed % action.resultPool.length] ?? action.result;
}

function getStatValue(stats: Stat[], key: StatKey) {
  return stats.find((stat) => stat.key === key)?.value ?? 0;
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

function isNight(minutes: number) {
  const normalized = minutes % 1440;
  return normalized >= 23 * 60 || normalized < 5 * 60;
}

function getActionAvailability(game: GameState, action: Action) {
  if (action.id !== "sleep" && isNight(game.minutes)) {
    return {
      available: false,
      reason: "밤이 너무 깊었어. 잠자기로 다음 날을 시작하자.",
    };
  }

  if (game.energy < action.minEnergy) {
    return {
      available: false,
      reason: action.shortageText,
    };
  }

  if (game.coins < action.minCoins) {
    return {
      available: false,
      reason: action.shortageText,
    };
  }

  return { available: true, reason: "" };
}

function applyDailyGoals(prev: GameState, actionId: ActionId, nextStats: Stat[]) {
  const distinctActionCount = new Set(
    [prev.lastAction, prev.currentAction, actionId].filter((id) => id !== "idle")
  ).size;

  return prev.dailyGoals.map((goal) => {
    if (goal.done) return goal;
    if (goal.id === actionId) return { ...goal, done: true };
    if (goal.id === "balance" && distinctActionCount >= 3) return { ...goal, done: true };
    if (goal.id === "coding" && getStatValue(nextStats, "coding") >= 95) return { ...goal, done: true };
    return goal;
  });
}

function countNewlyCompletedGoals(before: DailyGoal[], after: DailyGoal[]) {
  return after.filter((goal, index) => goal.done && !before[index]?.done).length;
}

function App() {
  const [game, setGame] = useState<GameState>(() => loadState());
  const [toast, setToast] = useState("");
  const [isEventOpen, setIsEventOpen] = useState(false);
  const [floatingRewards, setFloatingRewards] = useState<FloatingReward[]>([]);

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

  useEffect(() => {
    if (floatingRewards.length === 0) return;
    const timer = window.setTimeout(() => {
      setFloatingRewards((prev) => prev.slice(1));
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [floatingRewards]);

  const selectedAction = useMemo(() => {
    return ACTIONS.find((action) => action.id === game.currentAction);
  }, [game.currentAction]);

  const expPercent = clamp((game.exp / game.expToNext) * 100);
  const heroSpriteClass = selectedAction?.spriteClass ?? "sprite-idle";
  const heroAchievements = game.achievements.slice(-3);
  const heroCondition =
    game.energy >= 75 ? "컨디션 좋음" : game.energy >= 40 ? "무난함" : "충전 필요";
  const completedGoalCount = game.dailyGoals.filter((goal) => goal.done).length;
  const allGoalsDone = completedGoalCount === game.dailyGoals.length;

  function pushFloatingReward(text: string, kind: FloatingReward["kind"] = "good") {
    setFloatingRewards((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        text,
        kind,
      },
    ]);
  }

  function performAction(action: Action) {
    setGame((prev) => {
      const availability = getActionAvailability(prev, action);
      if (!availability.available) {
        setToast(availability.reason);
        pushFloatingReward("지금은 어려워", "warn");
        return {
          ...prev,
          currentBubble: "조금 조절이 필요해.",
          todayMessage: availability.reason,
        };
      }

      let nextExp = prev.exp + action.expGain;
      let nextLevel = prev.level;
      let nextExpToNext = prev.expToNext;
      let nextCoins = Math.max(0, prev.coins + action.coinDelta);
      let nextAchievements = [...prev.achievements];
      let levelUp = false;
      const nextRepeatCount = prev.lastAction === action.id ? prev.repeatCount + 1 : 1;
      const repeatPenalty = nextRepeatCount >= 3 && action.id !== "sleep";
      const comboBonus =
        (prev.lastAction === "exercise" && action.id === "meal") ||
        (prev.lastAction === "coding" && action.id === "rest") ||
        (prev.lastAction === "goout" && action.id === "sleep") ||
        (prev.lastAction === "rest" && action.id === "coding");

      if (repeatPenalty) {
        nextExp = Math.max(prev.exp, nextExp - 10);
      }

      if (comboBonus) {
        nextExp += 14;
        nextCoins += 12;
      }

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
          const adjustedChange = repeatPenalty && change > 0 ? Math.max(1, Math.floor(change * 0.45)) : change;
          return {
            ...stat,
            value: clamp(stat.value + adjustedChange),
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

      const nextMinutes = action.id === "sleep" ? 8 * 60 : prev.minutes + action.timeCost;
      const nextDay = action.id === "sleep" ? prev.day + 1 : prev.day + Math.floor(nextMinutes / 1440);
      const normalizedMinutes = nextMinutes % 1440;
      const nextDailyGoals =
        action.id === "sleep"
          ? createDailyGoals(nextDay)
          : applyDailyGoals(prev, action.id, nextStats);
      const newlyCompletedGoalCount =
        action.id === "sleep" ? 0 : countNewlyCompletedGoals(prev.dailyGoals, nextDailyGoals);

      if (newlyCompletedGoalCount > 0) {
        const goalBonus = newlyCompletedGoalCount * 35;
        nextCoins += goalBonus;
        nextExp += newlyCompletedGoalCount * 12;
        pushFloatingReward(`목표 완료 +${goalBonus}C`, "bonus");
      }

      const nextEnergy =
        action.id === "sleep"
          ? clamp(Math.max(72, prev.energy + action.energyDelta + 22))
          : clamp(prev.energy + action.energyDelta);
      const nextHearts =
        action.id === "sleep"
          ? clamp(Math.max(82, prev.hearts + action.heartDelta + 6))
          : clamp(prev.hearts + action.heartDelta);

      const specialNotice = levelUp
        ? `Lv.${nextLevel} 달성! 새로운 이벤트가 해금됩니다.`
        : comboBonus
          ? "좋은 루틴 연결! 콤보 보너스를 받았다."
          : repeatPenalty
            ? "같은 행동을 너무 반복해서 효율이 줄었다."
            : pickResult(action, prev.totalActions + prev.day);

      setToast(
        levelUp
          ? `레벨업! Lv.${nextLevel}`
          : comboBonus
            ? "루틴 콤보! EXP +14 / 코인 +12"
            : repeatPenalty
              ? "반복 피로: 보상이 줄었어"
              : specialNotice
      );

      if (levelUp) pushFloatingReward(`Lv.${nextLevel}!`, "bonus");
      if (comboBonus) pushFloatingReward("COMBO", "bonus");

      return {
        ...prev,
        level: nextLevel,
        exp: nextExp,
        expToNext: nextExpToNext,
        hearts: nextHearts,
        energy: nextEnergy,
        coins: nextCoins,
        day: nextDay,
        minutes: normalizedMinutes,
        totalActions: prev.totalActions + 1,
        lastAction: action.id,
        repeatCount: nextRepeatCount,
        eventClaimedToday: action.id === "sleep" ? false : prev.eventClaimedToday,
        timeText: formatTime(normalizedMinutes),
        weekday: formatWeekday(nextDay),
        currentAction: action.id,
        currentBubble: action.bubble,
        todayMessage: specialNotice,
        stats: nextStats,
        achievements: nextAchievements,
        eventNotice: specialNotice,
        dailyGoals: nextDailyGoals,
        completedGoalRewardIds: prev.completedGoalRewardIds,
      };
    });
  }

  function openEvent() {
    setGame((prev) => {
      if (prev.eventClaimedToday) {
        setToast("오늘 이벤트 보상은 이미 받았어.");
        setIsEventOpen(true);
        return {
          ...prev,
          currentBubble: "이벤트는 하루 한 번만!",
          eventNotice: "오늘 이벤트 보상은 이미 받았습니다. 잠자기로 다음 날을 시작해보세요.",
        };
      }

      const bonusCoins = 150 + prev.level * 20;
      const goalBonus = prev.dailyGoals.filter((goal) => goal.done).length * 40;
      const finalBonus = bonusCoins + goalBonus;
      setToast(`이벤트 보상: 코인 +${bonusCoins}`);
      pushFloatingReward(`EVENT +${finalBonus}C`, "bonus");
      setIsEventOpen(true);

      return {
        ...prev,
        coins: prev.coins + finalBonus,
        hearts: clamp(prev.hearts + 3 + (allGoalsDone ? 4 : 0)),
        eventClaimedToday: true,
        todayMessage: allGoalsDone
          ? "오늘 목표를 모두 끝냈다. 작은 루틴이 꽤 큰 하루가 됐다."
          : "작은 루틴이 위대한 성장으로 이어진다.",
        currentBubble: "이벤트 보상 획득!",
        eventNotice: allGoalsDone
          ? "오늘 목표 전체 완료 보너스까지 받았습니다."
          : "오늘의 이벤트 보상을 받았습니다.",
        achievements: addAchievement(prev, "이벤트 참여"),
      };
    });
  }

  function resetGame() {
    const ok = window.confirm("저장된 이기운 키우기 데이터를 초기화할까요?");
    if (!ok) return;
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
            <span className="resource-plus" aria-hidden="true">
              +
            </span>
          </div>
          <div className="resource-chip hud-card">
            <span className="resource-icon">⚡</span>
            <strong>{game.energy} / 100</strong>
            <span className="resource-plus" aria-hidden="true">
              +
            </span>
          </div>
          <div className="resource-chip hud-card">
            <span className="resource-icon">🪙</span>
            <strong>{game.coins.toLocaleString()}</strong>
            <span className="resource-plus" aria-hidden="true">
              +
            </span>
          </div>
          <div className="time-chip hud-card">
            <span>🌙</span>
            <div>
              <strong>{game.timeText}</strong>
              <small>Day {game.day} · {game.weekday}</small>
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
          <div className="stage-floor" />

          <div className="main-bubble">
            {selectedAction ? selectedAction.bubble : game.currentBubble}
          </div>

          <div className="hero-card panel-card">
            <div className="hero-topline">
              <span className="hero-pill">오늘의 상태 · {heroCondition}</span>
              <span className="hero-pill subtle">
                목표 {completedGoalCount}/{game.dailyGoals.length}
              </span>
            </div>

            <div className="hero-avatar-shell">
              <div className="hero-aura" />
              <span className={`hero-sprite ${heroSpriteClass}`} />
            </div>

            <div className="hero-caption">
              <strong>{selectedAction ? selectedAction.label : "오늘도 천천히 성장 중"}</strong>
              <p>{game.eventNotice || game.todayMessage}</p>
            </div>

            <div className="daily-goals">
              {game.dailyGoals.map((goal) => (
                <span className={`daily-goal ${goal.done ? "done" : ""}`} key={goal.id}>
                  {goal.done ? "✓" : "○"} {goal.label}
                </span>
              ))}
            </div>

            <div className="hero-chip-row">
              {heroAchievements.map((achievement) => (
                <span className="hero-chip" key={achievement}>
                  {achievement}
                </span>
              ))}
            </div>
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
                  <div className="inventory-icon">
                    <img
                      src={INVENTORY_ICON_MAP[item.id] ?? INVENTORY_ICON_MAP.locked}
                      alt=""
                    />
                  </div>
                  <strong>{item.label}</strong>
                  {!item.locked && <small>x {item.count}</small>}
                </div>
              ))}
            </div>

            <button className="more-button more-button-muted" type="button" disabled>
              보관함 정리됨
            </button>
          </section>

          <section className="message-panel panel-card">
            <h3>💞 오늘의 한마디</h3>
            <p>{game.todayMessage}</p>
          </section>
        </aside>
      </main>

      <nav className="bottom-actions">
        <button className="side-button is-muted" type="button" disabled>
          <span className="side-button-art">
            <img src={UI_ICON_MAP.calendar} alt="" />
          </span>
          <small>일정</small>
        </button>

        <div className="action-row">
          {ACTIONS.map((action) => (
            <button
              className={`action-button ${game.currentAction === action.id ? "active" : ""}`}
              key={action.id}
              type="button"
              disabled={!getActionAvailability(game, action).available}
              title={getActionAvailability(game, action).reason || action.result}
              onClick={() => performAction(action)}
            >
              <span className="action-icon-frame">
                <img className="action-icon-image" src={ACTION_ICON_MAP[action.id]} alt="" />
              </span>
              <strong>{action.label}</strong>
              <small>
                EXP +{action.expGain} · EN {signed(action.energyDelta)}
              </small>
            </button>
          ))}
        </div>

        <button className="side-button event-button" type="button" onClick={openEvent}>
          <span className="side-button-art">
            <img src={UI_ICON_MAP.gift} alt="" />
          </span>
          <small>이벤트</small>
          {!game.eventClaimedToday && <i />}
        </button>
      </nav>

      {toast && <div className="toast">{toast}</div>}

      <div className="floating-reward-stack">
        {floatingRewards.map((reward) => (
          <div className={`floating-reward ${reward.kind}`} key={reward.id}>
            {reward.text}
          </div>
        ))}
      </div>

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
              <strong>코인 보너스 / 하트 회복 / 목표 보상</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
