import React, { useCallback, useEffect, useRef, useState } from "react";

import { BadgeEarnedOverlay } from "@/components/BadgeEarnedOverlay";
import { LevelUpOverlay } from "@/components/LevelUpOverlay";
import { StreakMilestoneOverlay } from "@/components/StreakMilestoneOverlay";
import { Celebration, useGame } from "@/context/GameContext";

const GAP_MS = 400;

export function CelebrationHost() {
  const { celebration, advanceCelebration } = useGame();
  const [active, setActive] = useState<Celebration | null>(null);
  const [trigger, setTrigger] = useState(0);
  const gapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!celebration) {
      setActive(null);
      return;
    }
    if (active && active.id === celebration.id) return;
    setActive(celebration);
    setTrigger((t) => t + 1);
  }, [celebration, active]);

  const handleComplete = useCallback(() => {
    if (gapTimer.current) clearTimeout(gapTimer.current);
    gapTimer.current = setTimeout(() => advanceCelebration(), GAP_MS);
  }, [advanceCelebration]);

  useEffect(() => {
    return () => {
      if (gapTimer.current) clearTimeout(gapTimer.current);
    };
  }, []);

  if (!active) return null;

  if (active.kind === "levelUp") {
    return <LevelUpOverlay trigger={trigger} level={active.level} onComplete={handleComplete} />;
  }
  if (active.kind === "streakMilestone") {
    return (
      <StreakMilestoneOverlay trigger={trigger} milestone={active.milestone} onComplete={handleComplete} />
    );
  }
  return <BadgeEarnedOverlay trigger={trigger} badgeIds={active.badgeIds} onComplete={handleComplete} />;
}
