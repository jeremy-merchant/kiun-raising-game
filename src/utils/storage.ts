import { GameState } from "../types/game";

const STORAGE_KEY = "kiun-raising-game-state";

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function saveGameState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패 시 조용히 무시
  }
}
