import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  BADGES,
  DailyAction,
  getLevelFromXP,
  MODULES,
  getTodayActions,
  POWER_UP_MILESTONES,
} from "@/data/content";

const STORAGE_KEY = "@career_garden_state_v1";

export interface GameState {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  completedLessons: string[];
  earnedBadges: string[];
  dailyActionsCompleted: string[];
  dailyActionsDate: string | null;
  streakFreezes: number;
  xpBoosts: number;
  xpBoostExpiresAt: number | null;
}

const DEFAULT_STATE: GameState = {
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: null,
  completedLessons: [],
  earnedBadges: [],
  dailyActionsCompleted: [],
  dailyActionsDate: null,
  streakFreezes: 0,
  xpBoosts: 0,
  xpBoostExpiresAt: null,
};

interface GameContextType {
  state: GameState;
  isLoaded: boolean;
  levelUpTrigger: number;
  completeLesson: (lessonId: string, moduleId: string) => Promise<{ leveledUp: boolean }>;
  completeDailyAction: (actionId: string) => Promise<void>;
  isLessonCompleted: (lessonId: string) => boolean;
  isBadgeEarned: (badgeId: string) => boolean;
  getModuleProgress: (moduleId: string) => number;
  getTodayCompletedActions: () => string[];
  todayActions: DailyAction[];
  activateXPBoost: () => Promise<boolean>;
  isXPBoostActive: () => boolean;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [levelUpTrigger, setLevelUpTrigger] = useState(0);
  const todayActions = getTodayActions();

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        const today = new Date().toDateString();
        if (stateRef.current.dailyActionsDate !== today) {
          const reset: GameState = {
            ...stateRef.current,
            dailyActionsCompleted: [],
            dailyActionsDate: today,
          };
          setState(reset);
          saveState(reset);
        }
      }
    });
    return () => sub.remove();
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  async function loadState() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const today = new Date().toDateString();
        if (parsed.dailyActionsDate !== today) {
          parsed.dailyActionsCompleted = [];
          parsed.dailyActionsDate = today;
        }
        const migrated: GameState = {
          ...DEFAULT_STATE,
          ...parsed,
        };
        setState(migrated);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }

  async function saveState(newState: GameState) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      // ignore
    }
  }

  function updateStreak(currentState: GameState): GameState {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (currentState.lastActiveDate === today) {
      return currentState;
    }

    if (currentState.lastActiveDate === yesterday) {
      return { ...currentState, streak: currentState.streak + 1, lastActiveDate: today };
    }

    if (currentState.lastActiveDate !== null) {
      if (currentState.streakFreezes > 0) {
        return {
          ...currentState,
          streak: currentState.streak,
          lastActiveDate: today,
          streakFreezes: currentState.streakFreezes - 1,
        };
      }
    }

    return { ...currentState, streak: 1, lastActiveDate: today };
  }

  function checkBadges(
    currentState: GameState,
    completedLessons: string[],
    streak: number
  ): string[] {
    const newBadges = [...currentState.earnedBadges];
    const addBadge = (id: string) => {
      if (!newBadges.includes(id)) newBadges.push(id);
    };

    if (completedLessons.length >= 1) {
      addBadge("badge-first-bloom");
    }

    if (streak >= 7) {
      addBadge("badge-streak-7");
    }

    let allModulesStarted = true;
    let allModulesCompleted = true;

    for (const mod of MODULES) {
      const completedCount = mod.lessons.filter((l) =>
        completedLessons.includes(l.id)
      ).length;
      if (completedCount === 0) allModulesStarted = false;
      if (completedCount < mod.lessons.length) {
        allModulesCompleted = false;
      } else if (!newBadges.includes(mod.badgeId)) {
        addBadge(mod.badgeId);
      }
    }

    if (allModulesStarted) addBadge("badge-seed-planter");
    if (allModulesCompleted) addBadge("badge-full-bloom");

    return newBadges;
  }

  function checkMilestonePowerUps(
    prevBadgeCount: number,
    newBadgeCount: number,
    prevLessonCount: number,
    newLessonCount: number,
    currentFreezes: number,
    currentBoosts: number
  ): { streakFreezes: number; xpBoosts: number } {
    let streakFreezes = currentFreezes;
    let xpBoosts = currentBoosts;

    const prevFreezeThresholds = Math.floor(prevBadgeCount / POWER_UP_MILESTONES.badgesPerStreakFreeze);
    const newFreezeThresholds = Math.floor(newBadgeCount / POWER_UP_MILESTONES.badgesPerStreakFreeze);
    streakFreezes += newFreezeThresholds - prevFreezeThresholds;

    const prevBoostThresholds = Math.floor(prevLessonCount / POWER_UP_MILESTONES.lessonsPerXPBoost);
    const newBoostThresholds = Math.floor(newLessonCount / POWER_UP_MILESTONES.lessonsPerXPBoost);
    xpBoosts += newBoostThresholds - prevBoostThresholds;

    return { streakFreezes, xpBoosts };
  }

  function getXPMultiplier(currentState: GameState): number {
    if (
      currentState.xpBoostExpiresAt !== null &&
      Date.now() < currentState.xpBoostExpiresAt
    ) {
      return 2;
    }
    return 1;
  }

  const completeLesson = useCallback(async (lessonId: string, moduleId: string): Promise<{ leveledUp: boolean }> => {
    const current = stateRef.current;
    if (current.completedLessons.includes(lessonId)) return { leveledUp: false };

    const mod = MODULES.find((m) => m.id === moduleId);
    const lesson = mod?.lessons.find((l) => l.id === lessonId);
    const baseXP = lesson?.xp ?? 50;
    const multiplier = getXPMultiplier(current);
    const xpGain = baseXP * multiplier;

    const newCompleted = [...current.completedLessons, lessonId];
    const newXP = current.xp + xpGain;
    const withStreak = updateStreak(current);
    const newBadges = checkBadges(
      { ...current, completedLessons: newCompleted },
      newCompleted,
      withStreak.streak
    );

    const newlyEarnedIds = newBadges.filter((id) => !current.earnedBadges.includes(id));
    const badgeXP = newlyEarnedIds.reduce((sum, id) => {
      const badge = BADGES.find((b) => b.id === id);
      return sum + (badge?.xpReward ?? 0);
    }, 0);
    const finalXP = newXP + badgeXP;
    const finalLevel = getLevelFromXP(finalXP);
    const leveledUp = finalLevel > current.level;

    const { streakFreezes, xpBoosts } = checkMilestonePowerUps(
      current.earnedBadges.length,
      newBadges.length,
      current.completedLessons.length,
      newCompleted.length,
      withStreak.streakFreezes,
      withStreak.xpBoosts
    );

    const newState: GameState = {
      ...withStreak,
      xp: finalXP,
      level: finalLevel,
      completedLessons: newCompleted,
      earnedBadges: newBadges,
      streakFreezes,
      xpBoosts,
    };

    setState(newState);
    await saveState(newState);

    if (leveledUp) {
      setLevelUpTrigger((t) => t + 1);
    }

    return { leveledUp };
  }, []);

  const completeDailyAction = useCallback(async (actionId: string) => {
    const current = stateRef.current;
    const today = new Date().toDateString();

    const alreadyCompleted =
      current.dailyActionsDate === today &&
      current.dailyActionsCompleted.includes(actionId);
    if (alreadyCompleted) return;

    const baseCompleted =
      current.dailyActionsDate === today ? current.dailyActionsCompleted : [];
    const newCompleted = [...baseCompleted, actionId];
    const baseXP = current.xp + 25;
    const withStreak = updateStreak(current);
    const newBadges = checkBadges(current, current.completedLessons, withStreak.streak);

    const newlyEarnedIds = newBadges.filter((id) => !current.earnedBadges.includes(id));
    const badgeXP = newlyEarnedIds.reduce((sum, id) => {
      const badge = BADGES.find((b) => b.id === id);
      return sum + (badge?.xpReward ?? 0);
    }, 0);
    const finalXP = baseXP + badgeXP;
    const finalLevel = getLevelFromXP(finalXP);
    const leveledUp = finalLevel > current.level;

    const { streakFreezes, xpBoosts } = checkMilestonePowerUps(
      current.earnedBadges.length,
      newBadges.length,
      current.completedLessons.length,
      current.completedLessons.length,
      withStreak.streakFreezes,
      withStreak.xpBoosts
    );

    const newState: GameState = {
      ...withStreak,
      xp: finalXP,
      level: finalLevel,
      dailyActionsCompleted: newCompleted,
      dailyActionsDate: today,
      earnedBadges: newBadges,
      streakFreezes,
      xpBoosts,
    };

    setState(newState);
    await saveState(newState);

    if (leveledUp) {
      setLevelUpTrigger((t) => t + 1);
    }
  }, []);

  const activateXPBoost = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    if (current.xpBoosts <= 0) return false;
    if (current.xpBoostExpiresAt !== null && Date.now() < current.xpBoostExpiresAt) return false;

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const newState: GameState = {
      ...current,
      xpBoosts: current.xpBoosts - 1,
      xpBoostExpiresAt: expiresAt,
    };

    setState(newState);
    await saveState(newState);
    return true;
  }, []);

  const isXPBoostActive = useCallback((): boolean => {
    const current = stateRef.current;
    return (
      current.xpBoostExpiresAt !== null &&
      Date.now() < current.xpBoostExpiresAt
    );
  }, []);

  const isLessonCompleted = useCallback(
    (lessonId: string) => state.completedLessons.includes(lessonId),
    [state.completedLessons]
  );

  const isBadgeEarned = useCallback(
    (badgeId: string) => state.earnedBadges.includes(badgeId),
    [state.earnedBadges]
  );

  const getModuleProgress = useCallback(
    (moduleId: string) => {
      const mod = MODULES.find((m) => m.id === moduleId);
      if (!mod) return 0;
      const completed = mod.lessons.filter((l) =>
        state.completedLessons.includes(l.id)
      ).length;
      return completed / mod.lessons.length;
    },
    [state.completedLessons]
  );

  const getTodayCompletedActions = useCallback(
    () => state.dailyActionsCompleted,
    [state.dailyActionsCompleted]
  );

  return (
    <GameContext.Provider
      value={{
        state,
        isLoaded,
        levelUpTrigger,
        completeLesson,
        completeDailyAction,
        isLessonCompleted,
        isBadgeEarned,
        getModuleProgress,
        getTodayCompletedActions,
        todayActions,
        activateXPBoost,
        isXPBoostActive,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextType {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside GameProvider");
  return ctx;
}
