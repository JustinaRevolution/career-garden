import React from "react";
import TestRenderer, { act } from "react-test-renderer";

/**
 * These tests cover the celebration coordination layer: every celebration
 * (level-up, streak milestone, streak freeze, and the multi-badge queue) flows
 * through a single serial queue, and CelebrationHost renders exactly one overlay
 * at a time — advancing only after the active one reports completion.
 *
 * The overlay components are replaced with deterministic stand-ins that call
 * onComplete after their nominal duration, so we can assert ordering and
 * non-overlap with fake timers instead of pulling in reanimated.
 */

const LEVEL_UP_MS = 2100;
const STREAK_MILESTONE_MS = 2850;
const STREAK_FREEZE_MS = 1800;
const BADGE_CYCLE_MS = 3500; // per badge, mirrors BadgeEarnedOverlay CYCLE_MS

jest.mock("@/components/LevelUpOverlay", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LevelUpOverlay: ({ trigger, onComplete }: any) => {
      React.useEffect(() => {
        if (!trigger) return;
        const t = setTimeout(() => onComplete && onComplete(), 2100);
        return () => clearTimeout(t);
      }, [trigger]);
      return React.createElement(View, { celebrationKind: "levelUp" });
    },
  };
});

jest.mock("@/components/StreakMilestoneOverlay", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    StreakMilestoneOverlay: ({ trigger, onComplete }: any) => {
      React.useEffect(() => {
        if (!trigger) return;
        const t = setTimeout(() => onComplete && onComplete(), 2850);
        return () => clearTimeout(t);
      }, [trigger]);
      return React.createElement(View, { celebrationKind: "streakMilestone" });
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
    // Emulates the multi-badge queue: the whole burst is a single overlay that
    // only reports completion after every badge has been announced.
    BadgeEarnedOverlay: ({ trigger, badgeIds, onComplete }: any) => {
      React.useEffect(() => {
        if (!trigger || !badgeIds || badgeIds.length === 0) return;
        const t = setTimeout(() => onComplete && onComplete(), badgeIds.length * 3500);
        return () => clearTimeout(t);
      }, [trigger]);
      return React.createElement(View, {
        celebrationKind: "badge",
        badgeCount: badgeIds ? badgeIds.length : 0,
      });
    },
  };
});

// Controllable queue that mirrors GameContext's enqueue/advance semantics.
jest.mock("@/context/GameContext", () => {
  const React = require("react");
  const store: { queue: any[]; id: number; subs: Set<() => void> } = {
    queue: [],
    id: 0,
    subs: new Set(),
  };
  const notify = () => store.subs.forEach((f) => f());
  return {
    __esModule: true,
    useGame: () => {
      const [, force] = React.useReducer((x: number) => x + 1, 0);
      React.useEffect(() => {
        store.subs.add(force);
        return () => {
          store.subs.delete(force);
        };
      }, []);
      return {
        celebration: store.queue[0] ?? null,
        advanceCelebration: () => {
          store.queue = store.queue.slice(1);
          notify();
        },
      };
    },
    __enqueue: (item: any) => {
      store.id += 1;
      store.queue = [...store.queue, { ...item, id: store.id }];
      notify();
    },
    __reset: () => {
      store.queue = [];
      store.id = 0;
    },
  };
});

import { CelebrationHost } from "@/components/CelebrationHost";
import * as GameContext from "@/context/GameContext";

const enqueue = (GameContext as any).__enqueue as (item: any) => void;
const resetQueue = (GameContext as any).__reset as () => void;

const GAP_MS = 400; // CelebrationHost gap between overlays

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

describe("CelebrationHost coordination", () => {
  let tree: TestRenderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.useFakeTimers();
    resetQueue();
  });

  afterEach(() => {
    // Unmount so the mocked useGame effect cleanup removes its store subscriber,
    // preventing cross-test contamination of the shared queue.
    if (tree) {
      act(() => {
        tree!.unmount();
      });
      tree = null;
    }
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("plays queued celebrations one at a time, in order, never overlapping", () => {
    act(() => {
      tree = TestRenderer.create(<CelebrationHost />);
    });

    // Order matches how completeLesson enqueues: level-up, milestone, badges.
    act(() => {
      enqueue({ kind: "levelUp", level: 4 });
      enqueue({ kind: "streakMilestone", milestone: 7 });
      enqueue({ kind: "badge", badgeIds: ["a", "b"] });
    });

    const seen: string[] = [];
    const record = () => {
      // Never more than one overlay committed at any instant.
      expect(activeCount(tree)).toBeLessThanOrEqual(1);
      const k = currentKind(tree);
      if (k && seen[seen.length - 1] !== k) seen.push(k);
    };

    record();
    expect(currentKind(tree)).toBe("levelUp");

    // Advance through each overlay's duration plus the inter-overlay gap.
    const steps = [
      LEVEL_UP_MS,
      GAP_MS,
      STREAK_MILESTONE_MS,
      GAP_MS,
      2 * BADGE_CYCLE_MS,
      GAP_MS,
    ];
    for (const ms of steps) {
      act(() => {
        jest.advanceTimersByTime(ms);
      });
      record();
    }

    expect(seen).toEqual(["levelUp", "streakMilestone", "badge"]);
    // Queue drained -> nothing rendered.
    expect(currentKind(tree)).toBeNull();
  });

  it("lets the full badge burst finish even when a level-up arrives mid-cycle", () => {
    act(() => {
      tree = TestRenderer.create(<CelebrationHost />);
    });

    // A three-badge burst runs for 3 * 3500ms.
    act(() => {
      enqueue({ kind: "badge", badgeIds: ["a", "b", "c"] });
    });
    expect(currentKind(tree)).toBe("badge");

    // Part-way through the burst, a level-up fires from elsewhere.
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    act(() => {
      enqueue({ kind: "levelUp", level: 9 });
    });

    // The badge burst must NOT be interrupted — still showing badges.
    expect(currentKind(tree)).toBe("badge");

    // Finish the remaining badge time; level-up must not have appeared yet.
    act(() => {
      jest.advanceTimersByTime(3 * BADGE_CYCLE_MS - 4000);
    });
    expect(currentKind(tree)).toBe("badge");

    // After the gap, the level-up finally plays.
    act(() => {
      jest.advanceTimersByTime(GAP_MS);
    });
    expect(currentKind(tree)).toBe("levelUp");

    act(() => {
      jest.advanceTimersByTime(LEVEL_UP_MS + GAP_MS);
    });
    expect(currentKind(tree)).toBeNull();
  });

  it("keeps announcing every queued celebration when the user navigates away mid-burst", () => {
    const { View } = require("react-native");

    // Mirrors app/_layout.tsx: the navigable screen and CelebrationHost are
    // siblings under the app root. Changing `route` re-renders the screen but
    // CelebrationHost stays mounted in the same slot, so its queue must survive.
    const Root = ({ route }: { route: string }) => (
      <>
        <View route={route} />
        <CelebrationHost />
      </>
    );

    act(() => {
      tree = TestRenderer.create(<Root route="lesson" />);
    });

    // A lesson completion enqueues a level-up, a streak milestone, and a badge burst.
    act(() => {
      enqueue({ kind: "levelUp", level: 5 });
      enqueue({ kind: "streakMilestone", milestone: 7 });
      enqueue({ kind: "badge", badgeIds: ["a", "b"] });
    });

    const seen: string[] = [];
    const record = () => {
      // Never more than one overlay committed, even across navigations.
      expect(activeCount(tree)).toBeLessThanOrEqual(1);
      const k = currentKind(tree);
      if (k && seen[seen.length - 1] !== k) seen.push(k);
    };

    record();
    expect(currentKind(tree)).toBe("levelUp");

    // Leave the lesson while the level-up is still on screen. The route changes
    // but the celebration must keep playing.
    act(() => {
      tree!.update(<Root route="home" />);
    });
    expect(currentKind(tree)).toBe("levelUp");

    // Finish the level-up, then navigate again mid-milestone.
    act(() => {
      jest.advanceTimersByTime(LEVEL_UP_MS + GAP_MS);
    });
    record();
    expect(currentKind(tree)).toBe("streakMilestone");

    act(() => {
      tree!.update(<Root route="garden" />);
    });
    expect(currentKind(tree)).toBe("streakMilestone");

    // Finish the milestone -> badge burst, then navigate once more mid-burst.
    act(() => {
      jest.advanceTimersByTime(STREAK_MILESTONE_MS + GAP_MS);
    });
    record();
    expect(currentKind(tree)).toBe("badge");

    act(() => {
      tree!.update(<Root route="profile" />);
    });
    expect(currentKind(tree)).toBe("badge");

    // Drain the badge burst.
    act(() => {
      jest.advanceTimersByTime(2 * BADGE_CYCLE_MS + GAP_MS);
    });
    record();

    // Despite three route changes, every queued celebration played to
    // completion, in order, and the queue drained cleanly.
    expect(seen).toEqual(["levelUp", "streakMilestone", "badge"]);
    expect(currentKind(tree)).toBeNull();
  });
});
