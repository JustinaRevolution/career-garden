import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  APPLICATION_XP,
  BADGES,
  COSMETICS,
  DailyAction,
  DailyLogEntry,
  getCosmetic,
  getLevelFromXP,
  Goal,
  JobApplication,
  ApplicationStatus,
  MODULES,
  getTodayActions,
  POWER_UP_MILESTONES,
  PowerUpEvent,
  QUIZ_XP,
  XP_SHOP,
} from "@/data/content";

const STORAGE_KEY = "@career_garden_state_v3";

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
  applications: JobApplication[];
  quizzesPassed: string[];
  goal: Goal | null;
  onboardingComplete: boolean;
  notificationsEnabled: boolean;
  dailyLog: Record<string, DailyLogEntry>;
  ownedCosmetics: string[];
  equippedCosmetic: string | null;
  pendingStreakMilestone: number | null;
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
  applications: [],
  quizzesPassed: [],
  goal: null,
  onboardingComplete: false,
  notificationsEnabled: false,
  dailyLog: {},
  ownedCosmetics: [],
  equippedCosmetic: null,
  pendingStreakMilestone: null,
};

const STREAK_MILESTONES = [3, 7, 14, 30];

function getStreakMilestone(prev: number, next: number): number | null {
  for (const m of STREAK_MILESTONES) {
    if (prev < m && next >= m) return m;
  }
  return null;
}

export type CelebrationInput =
  | { kind: "levelUp"; level: number }
  | { kind: "streakMilestone"; milestone: number }
  | { kind: "badge"; badgeIds: string[] };

export type Celebration = CelebrationInput & { id: number };

interface GameContextType {
  state: GameState;
  isLoaded: boolean;
  celebration: Celebration | null;
  advanceCelebration: () => void;
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
  addApplication: (company: string, role: string, status: ApplicationStatus, notes?: string) => Promise<void>;
  updateApplication: (id: string, updates: Partial<Pick<JobApplication, "company" | "role" | "status" | "notes">>) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  passQuiz: (lessonId: string) => Promise<boolean>;
  isQuizPassed: (lessonId: string) => boolean;
  setGoal: (role: string, days: number) => Promise<void>;
  clearGoal: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  buyCosmetic: (cosmeticId: string) => Promise<boolean>;
  equipCosmetic: (cosmeticId: string | null) => Promise<void>;
  getEquippedKoiColor: () => string;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [streakFreezeTrigger, setStreakFreezeTrigger] = useState(0);
  const [celebrationQueue, setCelebrationQueue] = useState<Celebration[]>([]);
  const celebrationIdRef = useRef(0);
  const todayActions = getTodayActions();

  const enqueueCelebration = useCallback((item: CelebrationInput) => {
    celebrationIdRef.current += 1;
    const withId = { ...item, id: celebrationIdRef.current } as Celebration;
    setCelebrationQueue((q) => [...q, withId]);
  }, []);

  const advanceCelebration = useCallback(() => {
    setCelebrationQueue((q) => q.slice(1));
  }, []);

  const celebration = celebrationQueue[0] ?? null;
  const freezeConsumedRef = useRef(false);

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        let updated = stateRef.current;
        let changed = false;
        let freezeApplied = false;

        if (updated.dailyActionsDate !== today) {
          updated = {
            ...updated,
            dailyActionsCompleted: [],
            dailyActionsDate: today,
          };
          changed = true;
        }

        const freezeAutoApplies =
          !freezeConsumedRef.current &&
          updated.lastActiveDate !== null &&
          updated.lastActiveDate !== today &&
          updated.lastActiveDate !== yesterday &&
          updated.streakFreezes > 0;

        if (freezeAutoApplies) {
          freezeConsumedRef.current = true;
          const log = appendLog(updated.powerUpLog, { type: "used-freeze", timestamp: Date.now(), detail: "Auto-applied to save your streak" });
          updated = {
            ...updated,
            lastActiveDate: today,
            streakFreezes: updated.streakFreezes - 1,
            powerUpLog: log,
          };
          changed = true;
          freezeApplied = true;
        }

        if (updated.pendingStreakMilestone !== null) {
          const milestone = updated.pendingStreakMilestone;
          updated = { ...updated, pendingStreakMilestone: null };
          changed = true;
          enqueueCelebration({ kind: "streakMilestone", milestone });
        }

        if (changed) {
          stateRef.current = updated;
          setState(updated);
          saveState(updated);
        }
        if (freezeApplied) {
          setStreakFreezeTrigger((t) => t + 1);
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
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (parsed.dailyActionsDate !== today) {
          parsed.dailyActionsCompleted = [];
          parsed.dailyActionsDate = today;
        }
        const migrated: GameState = { ...DEFAULT_STATE, ...parsed };

        const freezeAutoApplies =
          migrated.lastActiveDate !== null &&
          migrated.lastActiveDate !== today &&
          migrated.lastActiveDate !== yesterday &&
          migrated.streakFreezes > 0;

        if (freezeAutoApplies) {
          const log = appendLog(migrated.powerUpLog, { type: "used-freeze", timestamp: Date.now(), detail: "Auto-applied to save your streak" });
          const withFreeze: GameState = {
            ...migrated,
            lastActiveDate: today,
            streakFreezes: migrated.streakFreezes - 1,
            powerUpLog: log,
          };
          setState(withFreeze);
          await saveState(withFreeze);
          setStreakFreezeTrigger((t) => t + 1);
        } else {
          setState(migrated);
        }
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

  function bumpDailyLog(
    log: Record<string, DailyLogEntry>,
    delta: Partial<DailyLogEntry>
  ): Record<string, DailyLogEntry> {
    const today = new Date().toDateString();
    const existing = log[today] ?? { xp: 0, lessons: 0, actions: 0, applications: 0 };
    const updated: DailyLogEntry = {
      xp: existing.xp + (delta.xp ?? 0),
      lessons: existing.lessons + (delta.lessons ?? 0),
      actions: existing.actions + (delta.actions ?? 0),
      applications: existing.applications + (delta.applications ?? 0),
    };
    const keys = Object.keys(log);
    let trimmed = log;
    if (keys.length > 30 && !log[today]) {
      const sorted = keys
        .map((k) => ({ k, t: new Date(k).getTime() }))
        .sort((a, b) => b.t - a.t)
        .slice(0, 30)
        .map((e) => e.k);
      trimmed = {};
      for (const k of sorted) trimmed[k] = log[k];
    }
    return { ...trimmed, [today]: updated };
  }

  function updateStreak(currentState: GameState): { next: GameState; freezeUsed: boolean; milestone: number | null } {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (currentState.lastActiveDate === today) {
      return { next: currentState, freezeUsed: false, milestone: null };
    }

    if (currentState.lastActiveDate === yesterday) {
      const nextStreak = currentState.streak + 1;
      const milestone = getStreakMilestone(currentState.streak, nextStreak);
      return {
        next: { ...currentState, streak: nextStreak, lastActiveDate: today },
        freezeUsed: false,
        milestone,
      };
    }

    if (currentState.lastActiveDate !== null && currentState.streakFreezes > 0) {
      const log = appendLog(currentState.powerUpLog, { type: "used-freeze", timestamp: Date.now(), detail: "Auto-applied to save your streak" });
      return {
        next: {
          ...currentState,
          streak: currentState.streak,
          lastActiveDate: today,
          streakFreezes: currentState.streakFreezes - 1,
          powerUpLog: log,
        },
        freezeUsed: true,
        milestone: null,
      };
    }

    return { next: { ...currentState, streak: 1, lastActiveDate: today }, freezeUsed: false, milestone: null };
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
        updatedLog = appendLog(updatedLog, { type: "earned-freeze", timestamp: Date.now(), detail: `${newBadgeCount} badge${newBadgeCount !== 1 ? "s" : ""} reached` });
      }
    }

    const prevBoostThresholds = Math.floor(prevLessonCount / POWER_UP_MILESTONES.lessonsPerXPBoost);
    const newBoostThresholds = Math.floor(newLessonCount / POWER_UP_MILESTONES.lessonsPerXPBoost);
    const earnedBoosts = newBoostThresholds - prevBoostThresholds;
    if (earnedBoosts > 0) {
      xpBoosts += earnedBoosts;
      for (let i = 0; i < earnedBoosts; i++) {
        updatedLog = appendLog(updatedLog, { type: "earned-boost", timestamp: Date.now(), detail: `${newLessonCount} lesson${newLessonCount !== 1 ? "s" : ""} completed` });
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
      const { next: withStreak, freezeUsed, milestone } = updateStreak(current);
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

      const isActive = AppState.currentState === "active";
      const deferMilestone = milestone !== null && !isActive;

      const newState: GameState = {
        ...withStreak,
        xp: finalXP,
        level: finalLevel,
        completedLessons: newCompleted,
        earnedBadges: newBadges,
        streakFreezes,
        xpBoosts,
        powerUpLog: log,
        dailyLog: bumpDailyLog(withStreak.dailyLog, { xp: finalXP - current.xp, lessons: 1 }),
        pendingStreakMilestone: deferMilestone ? milestone : withStreak.pendingStreakMilestone,
      };

      setState(newState);
      await saveState(newState);

      if (leveledUp) enqueueCelebration({ kind: "levelUp", level: finalLevel });
      if (freezeUsed) setStreakFreezeTrigger((t) => t + 1);
      if (milestone !== null && !deferMilestone) {
        enqueueCelebration({ kind: "streakMilestone", milestone });
      }
      if (newlyEarnedIds.length > 0) {
        enqueueCelebration({ kind: "badge", badgeIds: newlyEarnedIds });
      }

      return { leveledUp, newBadgeIds: newlyEarnedIds };
    },
    [enqueueCelebration]
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
      const { next: withStreak, freezeUsed, milestone } = updateStreak(current);
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

      const isActive = AppState.currentState === "active";
      const deferMilestone = milestone !== null && !isActive;

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
        dailyLog: bumpDailyLog(withStreak.dailyLog, { xp: finalXP - current.xp, actions: 1 }),
        pendingStreakMilestone: deferMilestone ? milestone : withStreak.pendingStreakMilestone,
      };

      setState(newState);
      await saveState(newState);

      if (leveledUp) enqueueCelebration({ kind: "levelUp", level: finalLevel });
      if (freezeUsed) setStreakFreezeTrigger((t) => t + 1);
      if (milestone !== null && !deferMilestone) {
        enqueueCelebration({ kind: "streakMilestone", milestone });
      }
      if (newlyEarnedIds.length > 0) {
        enqueueCelebration({ kind: "badge", badgeIds: newlyEarnedIds });
      }

      return { newBadgeIds: newlyEarnedIds };
    },
    [enqueueCelebration]
  );

  const activateXPBoost = useCallback(async (): Promise<boolean> => {
    const current = stateRef.current;
    if (current.xpBoosts <= 0) return false;
    if (current.xpBoostExpiresAt !== null && Date.now() < current.xpBoostExpiresAt) return false;

    const log = appendLog(current.powerUpLog, { type: "used-boost", timestamp: Date.now(), detail: "2x XP active for 24 hours" });
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
    const log = appendLog(current.powerUpLog, { type: "bought-freeze", timestamp: Date.now(), detail: "Purchased from XP Shop" });
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
    const log = appendLog(current.powerUpLog, { type: "bought-boost", timestamp: Date.now(), detail: "Purchased from XP Shop" });
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

  const addApplication = useCallback(
    async (company: string, role: string, status: ApplicationStatus, notes?: string): Promise<void> => {
      const current = stateRef.current;
      const now = Date.now();
      const app: JobApplication = {
        id: `app-${now}-${Math.random().toString(36).slice(2, 7)}`,
        company: company.trim(),
        role: role.trim(),
        status,
        createdAt: now,
        updatedAt: now,
        notes: notes?.trim() || undefined,
      };
      const multiplier = getXPMultiplier(current);
      const xpGain = APPLICATION_XP * multiplier;
      const finalXP = current.xp + xpGain;
      const finalLevel = getLevelFromXP(finalXP);
      const leveledUp = finalLevel > current.level;
      const newState: GameState = {
        ...current,
        applications: [app, ...current.applications],
        xp: finalXP,
        level: finalLevel,
        dailyLog: bumpDailyLog(current.dailyLog, { xp: xpGain, applications: 1 }),
      };
      setState(newState);
      await saveState(newState);
      if (leveledUp) enqueueCelebration({ kind: "levelUp", level: finalLevel });
    },
    [enqueueCelebration]
  );

  const updateApplication = useCallback(
    async (
      id: string,
      updates: Partial<Pick<JobApplication, "company" | "role" | "status" | "notes">>
    ): Promise<void> => {
      const current = stateRef.current;
      const newState: GameState = {
        ...current,
        applications: current.applications.map((a) =>
          a.id === id
            ? {
                ...a,
                ...updates,
                company: updates.company !== undefined ? updates.company.trim() : a.company,
                role: updates.role !== undefined ? updates.role.trim() : a.role,
                notes: updates.notes !== undefined ? updates.notes.trim() || undefined : a.notes,
                updatedAt: Date.now(),
              }
            : a
        ),
      };
      setState(newState);
      await saveState(newState);
    },
    []
  );

  const deleteApplication = useCallback(async (id: string): Promise<void> => {
    const current = stateRef.current;
    const newState: GameState = {
      ...current,
      applications: current.applications.filter((a) => a.id !== id),
    };
    setState(newState);
    await saveState(newState);
  }, []);

  const passQuiz = useCallback(async (lessonId: string): Promise<boolean> => {
    const current = stateRef.current;
    if (current.quizzesPassed.includes(lessonId)) return false;
    const multiplier = getXPMultiplier(current);
    const xpGain = QUIZ_XP * multiplier;
    const finalXP = current.xp + xpGain;
    const finalLevel = getLevelFromXP(finalXP);
    const leveledUp = finalLevel > current.level;
    const newState: GameState = {
      ...current,
      quizzesPassed: [...current.quizzesPassed, lessonId],
      xp: finalXP,
      level: finalLevel,
      dailyLog: bumpDailyLog(current.dailyLog, { xp: xpGain }),
    };
    setState(newState);
    await saveState(newState);
    if (leveledUp) enqueueCelebration({ kind: "levelUp", level: finalLevel });
    return true;
  }, [enqueueCelebration]);

  const isQuizPassed = useCallback(
    (lessonId: string) => state.quizzesPassed.includes(lessonId),
    [state.quizzesPassed]
  );

  const setGoal = useCallback(async (role: string, days: number): Promise<void> => {
    const current = stateRef.current;
    const now = Date.now();
    const newState: GameState = {
      ...current,
      goal: { role: role.trim(), targetDate: now + days * 86400000, createdAt: now },
    };
    setState(newState);
    await saveState(newState);
  }, []);

  const clearGoal = useCallback(async (): Promise<void> => {
    const current = stateRef.current;
    const newState: GameState = { ...current, goal: null };
    setState(newState);
    await saveState(newState);
  }, []);

  const completeOnboarding = useCallback(async (): Promise<void> => {
    const current = stateRef.current;
    const newState: GameState = { ...current, onboardingComplete: true };
    setState(newState);
    await saveState(newState);
  }, []);

  const setNotificationsEnabled = useCallback(async (enabled: boolean): Promise<void> => {
    const current = stateRef.current;
    const newState: GameState = { ...current, notificationsEnabled: enabled };
    setState(newState);
    await saveState(newState);
  }, []);

  const buyCosmetic = useCallback(async (cosmeticId: string): Promise<boolean> => {
    const current = stateRef.current;
    const cosmetic = COSMETICS.find((c) => c.id === cosmeticId);
    if (!cosmetic) return false;
    if (current.ownedCosmetics.includes(cosmeticId)) return false;
    if (current.xp < cosmetic.price) return false;
    const newState: GameState = {
      ...current,
      xp: current.xp - cosmetic.price,
      ownedCosmetics: [...current.ownedCosmetics, cosmeticId],
      equippedCosmetic: cosmeticId,
    };
    setState(newState);
    await saveState(newState);
    return true;
  }, []);

  const equipCosmetic = useCallback(async (cosmeticId: string | null): Promise<void> => {
    const current = stateRef.current;
    if (cosmeticId !== null && !current.ownedCosmetics.includes(cosmeticId)) return;
    const newState: GameState = { ...current, equippedCosmetic: cosmeticId };
    setState(newState);
    await saveState(newState);
  }, []);

  const getEquippedKoiColor = useCallback((): string => {
    const cosmetic = getCosmetic(state.equippedCosmetic);
    return cosmetic?.value ?? "#F5A54A";
  }, [state.equippedCosmetic]);

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
        celebration,
        advanceCelebration,
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
        addApplication,
        updateApplication,
        deleteApplication,
        passQuiz,
        isQuizPassed,
        setGoal,
        clearGoal,
        completeOnboarding,
        setNotificationsEnabled,
        buyCosmetic,
        equipCosmetic,
        getEquippedKoiColor,
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
