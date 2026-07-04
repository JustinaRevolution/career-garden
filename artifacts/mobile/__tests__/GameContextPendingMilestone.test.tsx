import React from "react";
import TestRenderer, { act } from "react-test-renderer";

/**
 * Verifies the deferred streak-milestone replay path in GameContext.
 *
 * A milestone reached while the app was backgrounded is persisted as
 * `pendingStreakMilestone`. On a cold launch no AppState "active" change
 * fires, so loadState must replay that milestone exactly once and persist
 * the cleared field so it is never shown again on a later launch.
 */

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameProvider, useGame, Celebration } from "@/context/GameContext";

const STORAGE_KEY = "@career_garden_state_v3";

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
  // Let loadState's awaited promises resolve.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("GameContext deferred milestone replay", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    latest = { celebration: null, advance: () => {}, isLoaded: false };
  });

  it("replays a persisted pending milestone exactly once and clears it", async () => {
    const today = new Date().toDateString();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: 7,
        lastActiveDate: today,
        dailyActionsDate: today,
        dailyActionsCompleted: [],
        streakFreezes: 0,
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

    // Shown exactly once after load.
    expect(latest.isLoaded).toBe(true);
    expect(latest.celebration).not.toBeNull();
    expect(latest.celebration?.kind).toBe("streakMilestone");
    expect(
      latest.celebration?.kind === "streakMilestone" &&
        latest.celebration.milestone
    ).toBe(7);

    // Persisted state must have cleared the pending field.
    const savedRaw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(JSON.parse(savedRaw as string).pendingStreakMilestone).toBeNull();

    // Advancing the queue drains it — the milestone does not reappear.
    await act(async () => {
      latest.advance();
    });
    expect(latest.celebration).toBeNull();

    act(() => tree.unmount());
  });

  it("does not enqueue any milestone when none is pending", async () => {
    const today = new Date().toDateString();
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        xp: 0,
        level: 1,
        streak: 2,
        lastActiveDate: today,
        dailyActionsDate: today,
        dailyActionsCompleted: [],
        streakFreezes: 0,
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

    expect(latest.isLoaded).toBe(true);
    expect(latest.celebration).toBeNull();

    act(() => tree.unmount());
  });
});
