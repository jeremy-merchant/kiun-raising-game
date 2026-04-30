export type StatKey =
  | "focus"
  | "stamina"
  | "mood"
  | "social"
  | "coding"
  | "bond";

export type ActivityId =
  | "coding"
  | "reading"
  | "coffee"
  | "exercise"
  | "meal"
  | "rest"
  | "goOut"
  | "music"
  | "tidy"
  | "sleep";

export type LogType = "activity" | "event" | "system";

export interface Stat {
  key: StatKey;
  label: string;
  value: number;
  level: number;
  color: string;
  icon: string;
}

export type Stats = Record<StatKey, Stat>;

export interface CharacterProfile {
  name: string;
  title: string;
  ageText: string;
  description: string;
  styleKeywords: string[];
  traits: string[];
  favorites: string[];
  quotes: string[];
}

export interface GalleryImage {
  id: string;
  label: string;
  src: string;
  description: string;
  category: "photo" | "concept" | "ui" | "pixel";
}

export interface InventoryItem {
  id: string;
  label: string;
  count: number;
  icon: string;
  description: string;
}

export interface Activity {
  id: ActivityId;
  label: string;
  emoji: string;
  duration: number;
  energyDelta: number;
  heartDelta: number;
  coinDelta: number;
  expGain: number;
  unlockLevel: number;
  message: string;
  statChanges: Partial<Record<StatKey, number>>;
  inventoryChanges?: Record<string, number>;
}

export interface LogEntry {
  id: string;
  day: number;
  time: string;
  text: string;
  type: LogType;
}

export interface EventOutcome {
  title: string;
  description: string;
  statChanges?: Partial<Record<StatKey, number>>;
  energyDelta?: number;
  heartDelta?: number;
  coinDelta?: number;
  expGain?: number;
  inventoryChanges?: Record<string, number>;
}

export interface GameState {
  profile: CharacterProfile;
  level: number;
  exp: number;
  expToNext: number;
  hearts: number;
  energy: number;
  coins: number;
  day: number;
  minutes: number;
  weekdayIndex: number;
  currentQuote: string;
  currentStatus: string;
  selectedGalleryId: string;
  stats: Stats;
  inventory: InventoryItem[];
  gallery: GalleryImage[];
  achievements: string[];
  lastActivity?: ActivityId;
  logs: LogEntry[];
}
