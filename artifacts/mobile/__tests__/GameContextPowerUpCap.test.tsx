import React from "react";
import TestRenderer, { act } from "react-test-renderer";

/**
 * Locks in the storage cap for power-ups (Streak Freeze, 2x XP Boost).
 *
 * Every path that can add a power-up is gated on POWER_UP_CAP:
 *   - Milestone earning (checkMilestonePowerUps) grants only what fits and
 *     never pushes a count above the cap, even when several thresholds are
 *     crossed at once.
 *   - Buying from the shop (buyStreakFreeze / buyXPBoost) refuses when the
 *     user is already at the cap.
 *   - Discarding (discardStreakFreeze / discardXPBoost) frees a slot and
 *     no-ops at zero so a count can never go negative.
 *
 * A regression in any of these would silently let counts drift past the cap
 * or break the discard flow, so these tests guard them directly.
 */

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  GameProvider,
  useGame,
  checkMilestonePowerUps,
} from "@/context/GameContext";
import { POWER_UP_CAP, POWER_UP_MILESTONES, XP_SHOP } from "@/data/content";

const STORAGE_KEY = "@career_garden_state_v3";

const { badgesPerStreakFreeze, lessonsPerXPBoost } = POWER_UP_MILESTONES;

describe("checkMilestonePowerUps cap", () => {
  it("grants a freeze from a badge milestone but never exceeds the cap", () => {
    // Crossing one badge threshold with room to spare grants exactly one.
    const result = checkMilestonePowerUps(
      badgesPerStreakFreeze - 1,
      badgesPerStreakFreeze,
      0,
      0,
      0,
      0,
      []
    );
    expect(result.streakFreezes).toBe(1);
    expect(result.log.filter((e) => e.type === "earned-freeze")).toHaveLength(1);
  });

  it("grants only what fits when a milestone would push past the cap", () => {
    // Two freeze thresholds crossed at once, but only one slot is free.
    const prevBadges = badgesPerStreakFreeze - 1;
    const newBadges = badgesPerStreakFreeze * 3; // crosses 2 more thresholds
    const result = checkMilestonePowerUps(
      prevBadges,
      newBadges,
      0,
      0,
      POWER_UP_CAP - 1, // one slot left
      0,
      []
    );
    expect(result.streakFreezes).toBe(POWER_UP_CAP);
    // Only the granted freeze is logged, not the ones that did not fit.
    expect(result.log.filter((e) => e.type === "earned-freeze")).toHaveLength(1);
  });

  it("grants nothing and logs nothing when already at the freeze cap", () => {
    const result = checkMilestonePowerUps(
      badgesPerStreakFreeze - 1,
      badgesPerStreakFreeze,
      0,
      0,
      POWER_UP_CAP, // full
      0,
      []
    );
    expect(result.streakFreezes).toBe(POWER_UP_CAP);
    expect(result.log).toHaveLength(0);
  });

  it("grants nothing and logs nothing when already at the boost cap", () => {
    const result = checkMilestonePowerUps(
      0,
      0,
      lessonsPerXPBoost - 1,
      lessonsPerXPBoost,
      0,
      POWER_UP_CAP, // full
      []
    );
    expect(result.xpBoosts).toBe(POWER_UP_CAP);
    expect(result.log).toHaveLength(0);
  });

  it("caps a boost milestone that would overflow, granting only what fits", () => {
    const result = checkMilestonePowerUps(
      0,
      0,
      lessonsPerXPBoost - 1,
      lessonsPerXPBoost * 3, // crosses 3 thresholds
      0,
      POWER_UP_CAP - 2, // two slots free
      []
    );
    expect(result.xpBoosts).toBe(POWER_UP_CAP);
    expect(result.log.filter((e) => e.type === "earned-boost")).toHaveLength(2);
  });
});

let api: ReturnType<typeof useGame> | null = null;

function Capture() {
  api = useGame();
  return null;
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function mountWith(partial: Record<string, unknown>) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      xp: 100000,
      level: 1,
      streak: 0,
      lastActiveDate: new Date().toDateString(),
      dailyActionsDate: new Date().toDateString(),
      dailyActionsCompleted: [],
      streakFreezes: 0,
      xpBoosts: 0,
      ...partial,
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
  return () => act(() => tree.unmount());
}

describe("buying power-ups respects the cap", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    api = null;
  });

  it("buyStreakFreeze refuses when already at the cap", async () => {
    const unmount = await mountWith({ streakFreezes: POWER_UP_CAP });

    let ok = true;
    await act(async () => {
      ok = await api!.buyStreakFreeze();
    });

    expect(ok).toBe(false);
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.streakFreezes).toBe(POWER_UP_CAP);
    // XP was not spent on a refused purchase.
    expect(saved.xp).toBe(100000);
    unmount();
  });

  it("buyStreakFreeze succeeds when there is room", async () => {
    const unmount = await mountWith({ streakFreezes: POWER_UP_CAP - 1 });

    let ok = false;
    await act(async () => {
      ok = await api!.buyStreakFreeze();
    });

    expect(ok).toBe(true);
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.streakFreezes).toBe(POWER_UP_CAP);
    expect(saved.xp).toBe(100000 - XP_SHOP.streakFreezePrice);
    unmount();
  });

  it("buyXPBoost refuses when already at the cap", async () => {
    const unmount = await mountWith({ xpBoosts: POWER_UP_CAP });

    let ok = true;
    await act(async () => {
      ok = await api!.buyXPBoost();
    });

    expect(ok).toBe(false);
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.xpBoosts).toBe(POWER_UP_CAP);
    expect(saved.xp).toBe(100000);
    unmount();
  });

  it("buyXPBoost succeeds when there is room", async () => {
    const unmount = await mountWith({ xpBoosts: POWER_UP_CAP - 1 });

    let ok = false;
    await act(async () => {
      ok = await api!.buyXPBoost();
    });

    expect(ok).toBe(true);
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.xpBoosts).toBe(POWER_UP_CAP);
    expect(saved.xp).toBe(100000 - XP_SHOP.xpBoostPrice);
    unmount();
  });
});

describe("discarding power-ups frees space and never goes negative", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    api = null;
  });

  it("discardStreakFreeze decrements the count", async () => {
    const unmount = await mountWith({ streakFreezes: 2 });

    let ok = false;
    await act(async () => {
      ok = await api!.discardStreakFreeze();
    });

    expect(ok).toBe(true);
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.streakFreezes).toBe(1);
    unmount();
  });

  it("discardStreakFreeze no-ops at zero", async () => {
    const unmount = await mountWith({ streakFreezes: 0 });

    let ok = true;
    await act(async () => {
      ok = await api!.discardStreakFreeze();
    });

    expect(ok).toBe(false);
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.streakFreezes).toBe(0);
    unmount();
  });

  it("discardXPBoost decrements the count", async () => {
    const unmount = await mountWith({ xpBoosts: 3 });

    let ok = false;
    await act(async () => {
      ok = await api!.discardXPBoost();
    });

    expect(ok).toBe(true);
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.xpBoosts).toBe(2);
    unmount();
  });

  it("discardXPBoost no-ops at zero", async () => {
    const unmount = await mountWith({ xpBoosts: 0 });

    let ok = true;
    await act(async () => {
      ok = await api!.discardXPBoost();
    });

    expect(ok).toBe(false);
    const saved = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) as string);
    expect(saved.xpBoosts).toBe(0);
    unmount();
  });
});
