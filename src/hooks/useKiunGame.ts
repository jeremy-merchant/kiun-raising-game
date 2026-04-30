import { useEffect, useMemo, useState } from "react";
import { ACTIVITIES } from "../data/kiun";
import { ActivityId } from "../types/game";
import { runActivity, createInitialGameState } from "../utils/game";
import { loadGameState, saveGameState } from "../utils/storage";

export function useKiunGame() {
  const [state, setState] = useState(() => loadGameState() ?? createInitialGameState());

  useEffect(() => {
    saveGameState(state);
  }, [state]);

  const availableActivities = useMemo(
    () => ACTIVITIES.filter((activity) => state.level >= activity.unlockLevel),
    [state.level]
  );

  const performActivity = (activityId: ActivityId) => {
    const activity = ACTIVITIES.find((item) => item.id === activityId);
    if (!activity) return;
    setState((prev) => runActivity(prev, activity));
  };

  const selectGallery = (galleryId: string) => {
    setState((prev) => ({
      ...prev,
      selectedGalleryId: galleryId,
    }));
  };

  const rotateQuote = () => {
    setState((prev) => {
      const index =
        (prev.profile.quotes.findIndex((quote) => quote === prev.currentQuote) + 1) %
        prev.profile.quotes.length;

      return {
        ...prev,
        currentQuote: prev.profile.quotes[index],
      };
    });
  };

  const resetGame = () => {
    setState(createInitialGameState());
  };

  return {
    state,
    availableActivities,
    performActivity,
    selectGallery,
    rotateQuote,
    resetGame,
  };
}
