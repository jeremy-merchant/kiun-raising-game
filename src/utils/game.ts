import {
  Activity,
  EventOutcome,
  GameState,
  InventoryItem,
  LogEntry,
  StatKey,
  Stats,
} from "../types/game";
import {
  ACTIVITIES,
  DEFAULT_STATS,
  GALLERY_IMAGES,
  KIUN_PROFILE,
  STARTER_INVENTORY,
  WEEKDAYS,
} from "../data/kiun";

const MAX_METER = 100;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function calculateStatLevel(value: number) {
  return Math.max(1, Math.floor(value / 12) + 1);
}

export function getLevelFromExp(exp: number) {
  return Math.floor(exp / 100) + 1;
}

export function getExpToNext(exp: number) {
  const currentLevel = getLevelFromExp(exp);
  const nextLevelStart = currentLevel * 100;
  return nextLevelStart - exp;
}

export function formatTime(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function deepCloneStats(stats: Stats): Stats {
  return {
    focus: { ...stats.focus },
    stamina: { ...stats.stamina },
    mood: { ...stats.mood },
    social: { ...stats.social },
    coding: { ...stats.coding },
    bond: { ...stats.bond },
  };
}

function updateStats(stats: Stats, changes: Partial<Record<StatKey, number>>) {
  const next = deepCloneStats(stats);
  (Object.keys(changes) as StatKey[]).forEach((key) => {
    const diff = changes[key] ?? 0;
    next[key].value = clamp(next[key].value + diff, 0, MAX_METER);
    next[key].level = calculateStatLevel(next[key].value);
  });
  return next;
}

function updateInventory(
  inventory: InventoryItem[],
  changes: Record<string, number> = {}
) {
  const next = inventory.map((item) => ({ ...item }));
  Object.entries(changes).forEach(([id, delta]) => {
    const found = next.find((item) => item.id === id);
    if (found) {
      found.count = Math.max(0, found.count + delta);
      return;
    }
    if (delta > 0) {
      next.push({
        id,
        label: id,
        count: delta,
        icon: "✨",
        description: "이벤트로 획득한 아이템",
      });
    }
  });
  return next;
}

function makeLog(state: GameState, text: string, type: LogEntry["type"]): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    day: state.day,
    time: formatTime(state.minutes),
    text,
    type,
  };
}

function pickQuote(seed: number) {
  return KIUN_PROFILE.quotes[seed % KIUN_PROFILE.quotes.length];
}

function buildAchievements(state: GameState) {
  const achievements = new Set<string>();

  if (state.exp >= 100) achievements.add("꾸준한 시작");
  if (state.exp >= 250) achievements.add("성장 가속");
  if (state.stats.coding.value >= 90) achievements.add("몰입 개발자");
  if (state.stats.focus.value >= 85) achievements.add("집중의 달인");
  if (state.stats.mood.value >= 85) achievements.add("기분 좋은 하루");
  if (state.stats.social.value >= 70) achievements.add("부드러운 교류");
  if (state.day >= 3) achievements.add("루틴 정착");
  if (state.day >= 7) achievements.add("일주일의 리듬");
  if (state.inventory.find((item) => item.id === "coffee")?.count ?? 0 >= 5) {
    achievements.add("커피 수집가");
  }
  if (state.inventory.find((item) => item.id === "book")?.count ?? 0 >= 5) {
    achievements.add("책과 친한 사람");
  }

  return Array.from(achievements);
}

function rollEvent(state: GameState, activity: Activity): EventOutcome | null {
  const seed = (state.day * 131 + state.minutes + activity.duration + state.exp) % 100;

  if (activity.id === "coding" && seed < 35) {
    return {
      title: "집중 모드 발동",
      description: "손이 잘 풀린다. 생각보다 흐름이 끊기지 않는다.",
      statChanges: { focus: 4, coding: 5 },
      expGain: 8,
      coinDelta: 6,
    };
  }

  if (activity.id === "coffee" && seed < 45) {
    return {
      title: "카페인 버프",
      description: "커피가 유독 맛있다. 집중과 기분이 한 번 더 오른다.",
      statChanges: { focus: 2, mood: 4 },
      energyDelta: 4,
      expGain: 3,
    };
  }

  if (activity.id === "reading" && seed < 30) {
    return {
      title: "좋은 문장 발견",
      description: "마음에 남는 문장을 만났다. 생각이 조금 깊어진다.",
      statChanges: { mood: 3, bond: 2, focus: 2 },
      expGain: 4,
    };
  }

  if (activity.id === "goOut" && seed < 28) {
    return {
      title: "산책 중 좋은 공기",
      description: "바람이 좋다. 기분이 풀리고 표정도 한결 부드러워진다.",
      statChanges: { mood: 5, social: 3, bond: 2 },
      heartDelta: 2,
      expGain: 4,
    };
  }

  if (activity.id === "music" && seed < 40) {
    return {
      title: "플레이리스트 명중",
      description: "딱 지금 기분에 맞는 곡이 나왔다.",
      statChanges: { mood: 5, focus: 1 },
      heartDelta: 1,
      expGain: 2,
    };
  }

  if (state.energy < 20 && activity.id !== "sleep" && seed < 22) {
    return {
      title: "과로 경고",
      description: "너무 달리면 페이스가 깨진다. 잠깐 템포를 조절하자.",
      statChanges: { mood: -3, stamina: -2 },
      energyDelta: -4,
    };
  }

  return null;
}

export function getActivityMap() {
  return Object.fromEntries(ACTIVITIES.map((item) => [item.id, item])) as Record<
    Activity["id"],
    Activity
  >;
}

export function createInitialGameState(): GameState {
  const exp = 42;
  return {
    profile: KIUN_PROFILE,
    level: getLevelFromExp(exp),
    exp,
    expToNext: getExpToNext(exp),
    hearts: 92,
    energy: 68,
    coins: 12450,
    day: 1,
    minutes: 8 * 60 + 45,
    weekdayIndex: 3,
    currentQuote: KIUN_PROFILE.quotes[0],
    currentStatus: "오늘도 차분하게 시작할 준비 완료.",
    selectedGalleryId: "room-ui",
    stats: deepCloneStats(DEFAULT_STATS),
    inventory: STARTER_INVENTORY.map((item) => ({ ...item })),
    gallery: GALLERY_IMAGES.map((item) => ({ ...item })),
    achievements: [],
    lastActivity: undefined,
    logs: [
      {
        id: "init-log",
        day: 1,
        time: "08:45",
        text: "이기운 키우기를 시작했다.",
        type: "system",
      },
    ],
  };
}

export function runActivity(state: GameState, activity: Activity): GameState {
  let next: GameState = {
    ...state,
    stats: deepCloneStats(state.stats),
    inventory: state.inventory.map((item) => ({ ...item })),
    gallery: state.gallery.map((item) => ({ ...item })),
    logs: [...state.logs],
    achievements: [...state.achievements],
  };

  next.minutes += activity.duration;
  while (next.minutes >= 24 * 60) {
    next.minutes -= 24 * 60;
    next.day += 1;
    next.weekdayIndex = (next.weekdayIndex + 1) % WEEKDAYS.length;
  }

  next.energy = clamp(next.energy + activity.energyDelta, 0, MAX_METER);
  next.hearts = clamp(next.hearts + activity.heartDelta, 0, MAX_METER);
  next.coins = Math.max(0, next.coins + activity.coinDelta);
  next.exp += activity.expGain;
  next.level = getLevelFromExp(next.exp);
  next.expToNext = getExpToNext(next.exp);
  next.currentStatus = activity.message;
  next.currentQuote = pickQuote(next.day + next.minutes + next.exp);
  next.lastActivity = activity.id;
  next.stats = updateStats(next.stats, activity.statChanges);
  next.inventory = updateInventory(next.inventory, activity.inventoryChanges);

  next.logs.unshift(
    makeLog(next, `${activity.emoji} ${activity.label}: ${activity.message}`, "activity")
  );

  const event = rollEvent(next, activity);
  if (event) {
    next.stats = updateStats(next.stats, event.statChanges ?? {});
    next.energy = clamp(next.energy + (event.energyDelta ?? 0), 0, MAX_METER);
    next.hearts = clamp(next.hearts + (event.heartDelta ?? 0), 0, MAX_METER);
    next.coins = Math.max(0, next.coins + (event.coinDelta ?? 0));
    next.exp += event.expGain ?? 0;
    next.level = getLevelFromExp(next.exp);
    next.expToNext = getExpToNext(next.exp);
    next.inventory = updateInventory(next.inventory, event.inventoryChanges);
    next.logs.unshift(makeLog(next, `✨ ${event.title}: ${event.description}`, "event"));
  }

  next.achievements = buildAchievements(next);
  next.logs = next.logs.slice(0, 16);

  return next;
}

export function getWeekdayLabel(index: number) {
  return WEEKDAYS[index] ?? WEEKDAYS[0];
}
