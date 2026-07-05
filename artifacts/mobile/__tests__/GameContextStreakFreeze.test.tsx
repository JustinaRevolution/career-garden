import React from "react";
import { AppState, AppStateStatus } from "react-native";
import TestRenderer, { act } from "react-test-renderer";

/**
 * Verifies the auto-applied streak-freeze notice reliably reaches the shared
 * celebration queue in every path that can consume a freeze:
 *
 *   - Cold launch: loadState applies a freeze when the app was closed across a
 *     missed day and must enqueue the "Streak Saved!" toast.
 *   - App resume: the AppState "active" handler applies a freeze when the app
 *     was backgrounded across a missed day and must enqueue it too.
 *   - When a freeze and a deferred milestone surface together, the freeze must
 *     be queued FIRST so it plays before the milestone (never simultaneously).
 *   - Long session across many midnights: the per-day guard
 *     (`freezeAppliedDateRef`) must allow one freeze to be consumed on EACH
 *     eligible day, not just once per session (the old session-long-boolean
 *     bug), while still consuming at most one freeze per day from rapid
 *     duplicate "active" events.
 *
 * The freeze notice is enqueued under the exact same condition that consumes a
 * freeze, so it can never be silently swallowed. These tests lock that in.
 */

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameProvider, useGame, Celebration } from "@/context/GameContext";

const STORAGE_KEY = "@career_garden_state_v3";
const DAY_MS = 86400000;

let latest: {
  celebration: Celebration | null;
  advance: () => void;
  isLoaded: boolean;
} = { celebration: null, advance: () => {}, isLoaded: false };

function Capture() {
  const { celebration, advanceCelebration, isLoaded } = useGame();
  latest = { celebration, advance: advanceCelebration, isLoaded };
  return null;
}

async function flush() {
  // Let loadState's awaited AsyncStorage read resolve.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("GameContext streak-freeze auto-apply notice", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    latest = { celebration: null, advance: () => {}, isLoaded: false };
  });

  it("shows the freeze toast when a freeze auto-applies on cold launch", async () => {
    const today = new Date().toDateString();
    const twoDaysAgo = new Date(Date.now() - 2 * DAY_MS).toDateString();

    // App last active two days ago (a day was missed) with a freeze in stock.
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: 5,
        lastActiveDate: twoDaysAgo,
        dailyActionsDate: twoDaysAgo,
        dailyActionsCompleted: [],
        streakFreezes: 1,
        pendingStreakMilestone: null,
      })
    );

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <GameProvider>
          <Capture />
        </GameProvider>
      );
    });
    await flush();

    // The freeze notice is queued exactly once.
    expect(latest.isLoaded).toBe(true);
    expect(latest.celebration).not.toBeNull();
    expect(latest.celebration?.kind).toBe("streakFreeze");

    // The freeze was consumed and the streak was carried to today, persisted.
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.streakFreezes).toBe(0);
    expect(saved.lastActiveDate).toBe(today);
    expect(saved.streak).toBe(5);

    // Draining the queue removes it — it does not reappear.
    await act(async () => {
      latest.advance();
    });
    expect(latest.celebration).toBeNull();

    act(() => tree.unmount());
  });

  it("plays the freeze before a deferred milestone on cold launch", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * DAY_MS).toDateString();

    // A freeze auto-applies AND a milestone was deferred while backgrounded.
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: 7,
        lastActiveDate: twoDaysAgo,
        dailyActionsDate: twoDaysAgo,
        dailyActionsCompleted: [],
        streakFreezes: 1,
        pendingStreakMilestone: 7,
      })
    );

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(
        <GameProvider>
          <Capture />
        </GameProvider>
      );
    });
    await flush();

    // Freeze is first in the queue...
    expect(latest.celebration?.kind).toBe("streakFreeze");

    // ...and the milestone follows only after the freeze is dismissed.
    await act(async () => {
      latest.advance();
    });
    expect(latest.celebration?.kind).toBe("streakMilestone");
    expect(
      latest.celebration?.kind === "streakMilestone" && latest.celebration.milestone
    ).toBe(7);

    await act(async () => {
      latest.advance();
    });
    expect(latest.celebration).toBeNull();

    act(() => tree.unmount());
  });

  it("shows the freeze toast when a freeze auto-applies on app resume", async () => {
    jest.useFakeTimers();
    const handlers: Array<(s: AppStateStatus) => void> = [];
    const addSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((type, cb) => {
        if (type === "change") handlers.push(cb);
        return { remove: () => {} } as any;
      });

    try {
      const base = new Date("2026-03-15T12:00:00").getTime();
      jest.setSystemTime(base);
      const yesterday = new Date(base - DAY_MS).toDateString();

      // On launch the app was active yesterday — no freeze applies yet.
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          xp: 0,
          level: 1,
          streak: 4,
          lastActiveDate: yesterday,
          dailyActionsDate: yesterday,
          dailyActionsCompleted: [],
          streakFreezes: 1,
          pendingStreakMilestone: null,
        })
      );

      let tree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(
          <GameProvider>
            <Capture />
          </GameProvider>
        );
      });
      await flush();

      // Cold launch consumed nothing — the freeze is untouched, no toast.
      expect(latest.isLoaded).toBe(true);
      expect(latest.celebration).toBeNull();

      // Backgrounded across two days, then resumed.
      jest.setSystemTime(base + 2 * DAY_MS);
      const today = new Date(base + 2 * DAY_MS).toDateString();
      await act(async () => {
        handlers.forEach((h) => h("active"));
      });

      // Resume applied the freeze and queued the notice.
      expect(latest.celebration?.kind).toBe("streakFreeze");
      const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
      expect(saved.streakFreezes).toBe(0);
      expect(saved.lastActiveDate).toBe(today);

      act(() => tree.unmount());
    } finally {
      addSpy.mockRestore();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it("consumes one freeze on EACH eligible day across a multi-day session", async () => {
    jest.useFakeTimers();
    const handlers: Array<(s: AppStateStatus) => void> = [];
    const addSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((type, cb) => {
        if (type === "change") handlers.push(cb);
        return { remove: () => {} } as any;
      });

    try {
      const base = new Date("2026-03-15T12:00:00").getTime();
      jest.setSystemTime(base);
      const yesterday = new Date(base - DAY_MS).toDateString();

      // Active yesterday on launch, three freezes banked, streak of 10.
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          xp: 0,
          level: 1,
          streak: 10,
          lastActiveDate: yesterday,
          dailyActionsDate: yesterday,
          dailyActionsCompleted: [],
          streakFreezes: 3,
          pendingStreakMilestone: null,
        })
      );

      let tree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(
          <GameProvider>
            <Capture />
          </GameProvider>
        );
      });
      await flush();

      // Cold launch was active yesterday — no freeze consumed yet.
      expect(latest.isLoaded).toBe(true);
      expect(latest.celebration).toBeNull();

      // The session stays open across three separate fully-missed days. Each
      // eligible resume lands two days past the last active day, so a freeze
      // must be consumed AND a toast enqueued every single time — this is the
      // behavior the old session-long boolean guard silently broke.
      for (let day = 1; day <= 3; day++) {
        jest.setSystemTime(base + 2 * day * DAY_MS);
        const today = new Date(base + 2 * day * DAY_MS).toDateString();
        await act(async () => {
          handlers.forEach((h) => h("active"));
        });

        // A fresh freeze toast surfaces this day.
        expect(latest.celebration?.kind).toBe("streakFreeze");

        // Exactly one freeze consumed this day; streak carried forward intact.
        const saved = JSON.parse(
          (await AsyncStorage.getItem(STORAGE_KEY)) as string
        );
        expect(saved.streakFreezes).toBe(3 - day);
        expect(saved.lastActiveDate).toBe(today);
        expect(saved.streak).toBe(10);

        // Drain the toast so the next day's toast is unambiguously new.
        await act(async () => {
          latest.advance();
        });
        expect(latest.celebration).toBeNull();
      }

      // A fourth eligible day with no freezes left saves nothing and is silent.
      jest.setSystemTime(base + 8 * DAY_MS);
      await act(async () => {
        handlers.forEach((h) => h("active"));
      });
      expect(latest.celebration).toBeNull();
      const finalSaved = JSON.parse(
        (await AsyncStorage.getItem(STORAGE_KEY)) as string
      );
      expect(finalSaved.streakFreezes).toBe(0);

      act(() => tree.unmount());
    } finally {
      addSpy.mockRestore();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  it("consumes at most one freeze from rapid duplicate active events on one day", async () => {
    jest.useFakeTimers();
    const handlers: Array<(s: AppStateStatus) => void> = [];
    const addSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((type, cb) => {
        if (type === "change") handlers.push(cb);
        return { remove: () => {} } as any;
      });

    try {
      const base = new Date("2026-06-01T09:00:00").getTime();
      jest.setSystemTime(base);
      const yesterday = new Date(base - DAY_MS).toDateString();

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          xp: 0,
          level: 1,
          streak: 8,
          lastActiveDate: yesterday,
          dailyActionsDate: yesterday,
          dailyActionsCompleted: [],
          streakFreezes: 2,
          pendingStreakMilestone: null,
        })
      );

      let tree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(
          <GameProvider>
            <Capture />
          </GameProvider>
        );
      });
      await flush();
      expect(latest.celebration).toBeNull();

      // Jump across a fully-missed day, then fire "active" several times in
      // quick succession (e.g. rapid foreground/background toggling).
      jest.setSystemTime(base + 2 * DAY_MS);
      const today = new Date(base + 2 * DAY_MS).toDateString();
      await act(async () => {
        handlers.forEach((h) => h("active"));
        handlers.forEach((h) => h("active"));
        handlers.forEach((h) => h("active"));
      });

      // Despite three "active" events, only ONE freeze is spent.
      const saved = JSON.parse(
        (await AsyncStorage.getItem(STORAGE_KEY)) as string
      );
      expect(saved.streakFreezes).toBe(1);
      expect(saved.lastActiveDate).toBe(today);

      // And exactly one toast is queued — draining it empties the queue.
      expect(latest.celebration?.kind).toBe("streakFreeze");
      await act(async () => {
        latest.advance();
      });
      expect(latest.celebration).toBeNull();

      act(() => tree.unmount());
    } finally {
      addSpy.mockRestore();
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });
});
