import React from "react";
import { AppState } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

/**
 * End-to-end coverage for the "big lesson completion" celebration burst.
 *
 * Unlike CelebrationHost.test.tsx (which drives a hand-built queue through a
 * mocked GameContext), this test exercises the *real* pipeline: a single
 * completeLesson call on the real GameProvider must enqueue a level-up, a
 * streak milestone, and a newly earned badge; the real CelebrationHost must
 * then render them one at a time, in order, never overlapping.
 *
 * Only the leaf overlay components are replaced with deterministic stand-ins
 * that call onComplete after their nominal duration, so ordering and non-overlap
 * can be asserted with fake timers instead of pulling in reanimated.
 */

const LEVEL_UP_MS = 2100;
const STREAK_MILESTONE_MS = 2850;
const BADGE_CYCLE_MS = 3500; // per badge, mirrors BadgeEarnedOverlay CYCLE_MS
const GAP_MS = 400; // CelebrationHost gap between overlays

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("@/components/LevelUpOverlay", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LevelUpOverlay: ({ trigger, level, onComplete }: any) => {
      React.useEffect(() => {
        if (!trigger) return;
        const t = setTimeout(() => onComplete && onComplete(), LEVEL_UP_MS);
        return () => clearTimeout(t);
      }, [trigger]);
      return React.createElement(View, { celebrationKind: "levelUp", level });
    },
  };
});

jest.mock("@/components/StreakMilestoneOverlay", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    StreakMilestoneOverlay: ({ trigger, milestone, onComplete }: any) => {
      React.useEffect(() => {
        if (!trigger) return;
        const t = setTimeout(() => onComplete && onComplete(), STREAK_MILESTONE_MS);
        return () => clearTimeout(t);
      }, [trigger]);
      return React.createElement(View, { celebrationKind: "streakMilestone", milestone });
    },
  };
});

jest.mock("@/components/StreakFreezeToast", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    StreakFreezeToast: ({ trigger, onComplete }: any) => {
      React.useEffect(() => {
        if (!trigger) return;
        const t = setTimeout(() => onComplete && onComplete(), 1800);
        return () => clearTimeout(t);
      }, [trigger]);
      return React.createElement(View, { celebrationKind: "streakFreeze" });
    },
  };
});

jest.mock("@/components/BadgeEarnedOverlay", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BadgeEarnedOverlay: ({ trigger, badgeIds, onComplete }: any) => {
      React.useEffect(() => {
        if (!trigger || !badgeIds || badgeIds.length === 0) return;
        const t = setTimeout(() => onComplete && onComplete(), badgeIds.length * BADGE_CYCLE_MS);
        return () => clearTimeout(t);
      }, [trigger]);
      return React.createElement(View, {
        celebrationKind: "badge",
        badgeCount: badgeIds ? badgeIds.length : 0,
        badgeIds,
      });
    },
  };
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { CelebrationHost } from "@/components/CelebrationHost";
import { GameProvider, useGame } from "@/context/GameContext";

const STORAGE_KEY = "@career_garden_state_v3";

// Bridge to reach the real completeLesson from outside the tree.
let latest: {
  completeLesson: (lessonId: string, moduleId: string) => Promise<any>;
  isLoaded: boolean;
} = { completeLesson: async () => ({}), isLoaded: false };

function Capture() {
  const { completeLesson, isLoaded } = useGame();
  latest = { completeLesson, isLoaded };
  return null;
}

// The committed render tree (toJSON) is the source of truth for what the user
// actually sees. CelebrationHost renders either nothing or a single overlay.
function committedNodes(tree: TestRenderer.ReactTestRenderer | null): any[] {
  const json = tree?.toJSON();
  if (!json) return [];
  return Array.isArray(json) ? json : [json];
}

function activeCount(tree: TestRenderer.ReactTestRenderer | null): number {
  return committedNodes(tree).filter((n) => n && n.props && n.props.celebrationKind).length;
}

function currentKind(tree: TestRenderer.ReactTestRenderer | null): string | null {
  const node = committedNodes(tree).find((n) => n && n.props && n.props.celebrationKind);
  return node ? (node.props.celebrationKind as string) : null;
}

describe("Lesson completion celebration burst (end-to-end)", () => {
  let prevAppState: string;

  beforeEach(async () => {
    await AsyncStorage.clear();
    latest = { completeLesson: async () => ({}), isLoaded: false };
    // completeLesson only enqueues a milestone immediately when the app is
    // foregrounded; otherwise it is deferred to a pending replay.
    prevAppState = AppState.currentState;
    (AppState as any).currentState = "active";
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    (AppState as any).currentState = prevAppState;
  });

  it("plays level-up, streak milestone, then badge one at a time without overlap", async () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Seed a state where finishing ONE more lesson simultaneously:
    //  - crosses a level threshold (100 base + 50 lesson + 200 badge = 350 XP -> level 3)
    //  - advances the streak from 6 to 7 (a milestone)
    //  - earns the 7-day streak badge (a newly earned badge)
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 100,
        level: 1,
        streak: 6,
        lastActiveDate: yesterday,
        completedLessons: ["resume-1"],
        earnedBadges: ["badge-first-bloom"],
        dailyActionsCompleted: [],
        dailyActionsDate: today,
        streakFreezes: 0,
        xpBoosts: 0,
        xpBoostExpiresAt: null,
        pendingStreakMilestone: null,
      })
    );

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <GameProvider>
          <Capture />
          <CelebrationHost />
        </GameProvider>
      );
    });
    // Let loadState's awaited AsyncStorage read resolve.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(latest.isLoaded).toBe(true);
    // Nothing should be showing yet — the burst only starts on completion.
    expect(currentKind(tree!)).toBeNull();

    // Drive the real lesson completion. This is the single trigger under test.
    let result: any;
    await act(async () => {
      result = await latest.completeLesson("resume-2", "resume");
    });

    // Sanity: the completion really did produce all three triggers.
    expect(result.leveledUp).toBe(true);
    expect(result.newBadgeIds).toContain("badge-streak-7");

    const seen: string[] = [];
    const record = () => {
      // Never more than one overlay committed at any instant.
      expect(activeCount(tree!)).toBeLessThanOrEqual(1);
      const k = currentKind(tree!);
      if (k && seen[seen.length - 1] !== k) seen.push(k);
    };

    // The first overlay is the level-up.
    record();
    expect(currentKind(tree!)).toBe("levelUp");

    // Walk through each overlay's duration plus the inter-overlay gap, checking
    // non-overlap at every step.
    const steps = [
      LEVEL_UP_MS,
      GAP_MS,
      STREAK_MILESTONE_MS,
      GAP_MS,
      BADGE_CYCLE_MS, // single badge burst
      GAP_MS,
    ];
    for (const ms of steps) {
      await act(async () => {
        jest.advanceTimersByTime(ms);
        await Promise.resolve();
      });
      record();
    }

    // All three played, exactly in the enqueue order, with no overlap.
    expect(seen).toEqual(["levelUp", "streakMilestone", "badge"]);
    // Queue fully drained -> nothing rendered.
    expect(currentKind(tree!)).toBeNull();

    act(() => tree.unmount());
  });
});
