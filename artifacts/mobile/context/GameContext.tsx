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
  PowerUpEvent,
  XP_SHOP,
} from "@/data/content";

const STORAGE_KEY = "@career_garden_state_v2";

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
  powerUpLog: PowerUpEvent[];
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
  powerUpLog: [],
};

const STREAK_MILESTONES = [3, 7, 14, 30];

function getStreakMilestone(prev: number, next: number): number | null {
  for (const m of STREAK_MILESTONES) {
    if (prev < m && next >= m) return m;
  }
  return null;
}

interface GameContextType {
  state: GameState;
  isLoaded: boolean;
  levelUpTrigger: number;
  streakMilestoneTrigger: number;
  streakMilestoneValue: number;
  streakFreezeTrigger: number;
  completeLesson: (lessonId: string, moduleId: string) => Promise<{ leveledUp: boolean; newBadgeIds: string[] }>;
  completeDailyAction: (actionId: string) => Promise<{ newBadgeIds: string[] }>;
  isLessonCompleted: (lessonId: string) => boolean;
  isBadgeEarned: (badgeId: string) => boolean;
  getModuleProgress: (moduleId: string) => number;
  getTodayCompletedActions: () => string[];
  todayActions: DailyAction[];
  activateXPBoost: () => Promise<boolean>;
  isXPBoostActive: () => boolean;
  buyStreakFreeze: () => Promise<boolean>;
  buyXPBoost: () => Promise<boolean>;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [levelUpTrigger, setLevelUpTrigger] = useState(0);
  const [streakMilestoneTrigger, setStreakMilestoneTrigger] = useState(0);
  const [streakMilestoneValue, setStreakMilestoneValue] = useState(0);
  const [streakFreezeTrigger, setStreakFreezeTrigger] = useState(0);
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
        const migrated: GameState = { ...DEFAULT_STATE, ...parsed };
        setState(migrated);
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }

  async function saveState(newState: GameState) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // ignore
    }
  }

  function appendLog(log: PowerUpEvent[], event: PowerUpEvent): PowerUpEvent[] {
    return [event, ...log].slice(0, 50);
  }

  function updateStreak(currentState: GameState): { next: GameState; freezeUsed: boolean } {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (currentState.lastActiveDate === today) {
      return { next: currentState, freezeUsed: false };
    }

    if (currentState.lastActiveDate === yesterday) {
      return {
        next: { ...currentState, streak: currentState.streak + 1, lastActiveDate: today },
        freezeUsed: false,
      };
    }

    if (currentState.lastActiveDate !== null && currentState.streakFreezes > 0) {
      const log = appendLog(currentState.powerUpLog, { type: "used-freeze", timestamp: Date.now() });
      return {
        next: {
          ...currentState,
          streak: currentState.streak,
          lastActiveDate: today,
          streakFreezes: currentState.streakFreezes - 1,
          powerUpLog: log,
        },
        freezeUsed: true,
      };
    }

    return { next: { ...currentState, streak: 1, lastActiveDate: today }, freezeUsed: false };
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

    if (completedLessons.length >= 1) addBadge("badge-first-bloom");
    if (streak >= 7) addBadge("badge-streak-7");

    let allModulesStarted = true;
    let allModulesCompleted = true;

    for (const mod of MODULES) {
      const completedCount = mod.lessons.filter((l) => completedLessons.includes(l.id)).length;
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
    currentBoosts: number,
    log: PowerUpEvent[]
  ): { streakFreezes: number; xpBoosts: number; log: PowerUpEvent[] } {
    let streakFreezes = currentFreezes;
    let xpBoosts = currentBoosts;
    let updatedLog = log;

    const prevFreezeThresholds = Math.floor(prevBadgeCount / POWER_UP_MILESTONES.badgesPerStreakFreeze);
    const newFreezeThresholds = Math.floor(newBadgeCount / POWER_UP_MILESTONES.badgesPerStreakFreeze);
    const earnedFreezes = newFreezeThresholds - prevFreezeThresholds;
    if (earnedFreezes > 0) {
      streakFreezes += earnedFreezes;
      for (let i = 0; i < earnedFreezes; i++) {
        updatedLog = appendLog(updatedLog, { type: "earned-freeze", timestamp: Date.now() });
      }
    }

    const prevBoostThresholds = Math.floor(prevLessonCount / POWER_UP_MILESTONES.lessonsPerXPBoost);
    const newBoostThresholds = Math.floor(newLessonCount / POWER_UP_MILESTONES.lessonsPerXPBoost);
    const earnedBoosts = newBoostThresholds - prevBoostThresholds;
    if (earnedBoosts > 0) {
      xpBoosts += earnedBoosts;
      for (let i = 0; i < earnedBoosts; i++) {
        updatedLog = appendLog(updatedLog, { type: "earned-boost", timestamp: Date.now() });
      }
    }

    return { streakFreezes, xpBoosts, log: updatedLog };
  }

  function getXPMultiplier(currentState: GameState): number {
    if (currentState.xpBoostExpiresAt !== null && Date.now() < currentState.xpBoostExpiresAt) {
      return 2;
    }
    return 1;
  }

  const completeLesson = useCallback(
    async (lessonId: string, moduleId: string): Promise<{ leveledUp: boolean; newBadgeIds: string[] }> => {
      const current = stateRef.current;
      if (current.completedLessons.includes(lessonId)) return { leveledUp: false, newBadgeIds: [] };

      const mod = MODULES.find((m) => m.id === moduleId);
      const lesson = mod?.lessons.find((l) => l.id === lessonId);
      const baseXP = lesson?.xp ?? 50;
      const multiplier = getXPMultiplier(current);
      const xpGain = baseXP * multiplier;

      const newCompleted = [...current.completedLessons, lessonId];
      const newXP = current.xp + xpGain;
      const { next: withStreak, freezeUsed } = updateStreak(current);
      const newBadges = checkBadges({ ...current, completedLessons: newCompleted }, newCompleted, withStreak.streak);

      const newlyEarnedIds = newBadges.filter((id) => !current.earnedBadges.includes(id));
      const badgeXP = newlyEarnedIds.reduce((sum, id) => {
        const badge = BADGES.find((b) => b.id === id);
        return sum + (badge?.xpReward ?? 0);
      }, 0);
      const finalXP = newXP + badgeXP;
      const finalLevel = getLevelFromXP(finalXP);
      const leveledUp = finalLevel > current.level;

      const { streakFreezes, xpBoosts, log } = checkMilestonePowerUps(
        current.earnedBadges.length,
        newBadges.length,
        current.completedLessons.length,
        newCompleted.length,
        withStreak.streakFreezes,
        withStreak.xpBoosts,
        withStreak.powerUpLog
      );

      const newState: GameState = {
        ...withStreak,
        xp: finalXP,
        level: finalLevel,
        completedLessons: newCompleted,
        earnedBadges: newBadges,
        streakFreezes,
        xpBoosts,
        powerUpLog: log,
      };

      setState(newState);
      await saveState(newState);

      if (leveledUp) setLevelUpTrigger((t) => t + 1);
      if (freezeUsed) setStreakFreezeTrigger((t) => t + 1);

      const milestone = getStreakMilestone(current.streak, withStreak.streak);
      if (milestone !== null) {
        setStreakMilestoneValue(milestone);
        setStreakMilestoneTrigger((t) => t + 1);
      }

      return { leveledUp, newBadgeIds: newlyEarnedIds };
    },
    []
  );

  const completeDailyAction = useCallback(
    async (actionId: string): Promise<{ newBadgeIds: string[] }> => {
      const current = stateRef.current;
      const today = new Date().toDateString();

      const alreadyCompleted =
        current.dailyActionsDate === today && current.dailyActionsCompleted.includes(actionId);
      if (alreadyCompleted) return { newBadgeIds: [] };

      const baseCompleted = current.dailyActionsDate === today ? current.dailyActionsCompleted : [];
      const newCompleted = [...baseCompleted, actionId];
      const multiplier = getXPMultiplier(current);
      const baseXP = current.xp + 25 * multiplier;
      const { next: withStreak, freezeUsed } = updateStreak(current);
      const newBadges = checkBadges(current, current.completedLessons, withStreak.streak);

      const newlyEarnedIds = newBadges.filter((id) => !current.earnedBadges.includes(id));
      const badgeXP = newlyEarnedIds.reduce((sum, id) => {
        const badge = BADGES.find((b) => b.id === id);
        return sum + (badge?.xpReward ?? 0);
      }, 0);
      const finalXP = baseXP + badgeXP;
      const finalLevel = getLevelFromXP(finalXP);
      const leveledUp = finalLevel > current.level;

      const { streakFreezes, xpBoosts, log } = checkMilestonePowerUps(
        current.earnedBadges.length,
        newBadges.length,
        current.completedLessons.length,
        current.completedLessons.length,
        withStreak.streakFreezes,
        withStreak.xpBoosts,
        withStreak.powerUpLog
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
        powerUpLog: log,
      };

      setState(newState);
      await saveState(newState);

      if (leveledUp) setLevelUpTrigger((t) => t + 1);
      if (freezeUsed) setStreakFreezeTrigger((t) => t + 1);

      const milestone = getStreakMilestone(current.streak, withStreak.streak);
      if (milestone !== null) {
        setStreakMilestoneValue(milestone);
        setStreakMilestoneTrigger((t) => t + 1);
      }

      return { newBadgeIds: newlyEarnedIds };
    },
    []
  );

  const activateXPBoost = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    if (current.xpBoosts <= 0) return false;
    if (current.xpBoostExpiresAt !== null && Date.now() < current.xpBoostExpiresAt) return false;

    const log = appendLog(current.powerUpLog, { type: "used-boost", timestamp: Date.now() });
    const newState: GameState = {
      ...current,
      xpBoosts: current.xpBoosts - 1,
      xpBoostExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      powerUpLog: log,
    };

    setState(newState);
    await saveState(newState);
    return true;
  }, []);

  const isXPBoostActive = useCallback((): boolean => {
    const c = stateRef.current;
    return c.xpBoostExpiresAt !== null && Date.now() < c.xpBoostExpiresAt;
  }, []);

  const buyStreakFreeze = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    if (current.xp < XP_SHOP.streakFreezePrice) return false;
    const log = appendLog(current.powerUpLog, { type: "bought-freeze", timestamp: Date.now() });
    const newState: GameState = {
      ...current,
      xp: current.xp - XP_SHOP.streakFreezePrice,
      streakFreezes: current.streakFreezes + 1,
      powerUpLog: log,
    };
    setState(newState);
    await saveState(newState);
    return true;
  }, []);

  const buyXPBoost = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    if (current.xp < XP_SHOP.xpBoostPrice) return false;
    const log = appendLog(current.powerUpLog, { type: "bought-boost", timestamp: Date.now() });
    const newState: GameState = {
      ...current,
      xp: current.xp - XP_SHOP.xpBoostPrice,
      xpBoosts: current.xpBoosts + 1,
      powerUpLog: log,
    };
    setState(newState);
    await saveState(newState);
    return true;
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
      const completed = mod.lessons.filter((l) => state.completedLessons.includes(l.id)).length;
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
        streakMilestoneTrigger,
        streakMilestoneValue,
        streakFreezeTrigger,
        completeLesson,
        completeDailyAction,
        isLessonCompleted,
        isBadgeEarned,
        getModuleProgress,
        getTodayCompletedActions,
        todayActions,
        activateXPBoost,
        isXPBoostActive,
        buyStreakFreeze,
        buyXPBoost,
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
