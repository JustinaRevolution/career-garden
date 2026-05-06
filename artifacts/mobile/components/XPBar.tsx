import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import {
  getXPForCurrentLevel,
  getXPToNextLevel,
  getLevelFromXP,
} from "@/data/content";

interface Props {
  xp: number;
  streak: number;
  compact?: boolean;
}

export function XPBar({ xp, streak, compact = false }: Props) {
  const colors = useColors();
  const level = getLevelFromXP(xp);
  const xpInLevel = getXPForCurrentLevel(xp);
  const xpNeeded = getXPToNextLevel(xp);
  const progress = xpInLevel / xpNeeded;

  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 800 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
  }));

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.levelBubble, { backgroundColor: colors.primary }]}>
          <Text style={[styles.levelNumber, { color: colors.primaryForeground }]}>
            {level}
          </Text>
        </View>
        <View style={styles.barWrapper}>
          <View style={[styles.track, { backgroundColor: colors.muted }]}>
            <Animated.View style={[styles.fill, barStyle, { backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
            {xpInLevel} / {xpNeeded} XP
          </Text>
        </View>
        {streak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: colors.accent + "22" }]}>
            <Text style={[styles.streakText, { color: colors.accent }]}>
              {streak}d
            </Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.headerRow}>
        <View style={styles.levelRow}>
          <View style={[styles.levelBubbleLarge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.levelNumberLarge, { color: colors.primaryForeground }]}>
              {level}
            </Text>
          </View>
          <View>
            <Text style={[styles.levelLabel, { color: colors.foreground }]}>Level {level}</Text>
            <Text style={[styles.xpLabelFull, { color: colors.mutedForeground }]}>
              {xp} total XP
            </Text>
          </View>
        </View>
        {streak > 0 && (
          <View style={[styles.streakFull, { backgroundColor: colors.accent + "22" }]}>
            <Text style={[styles.streakFullText, { color: colors.accent }]}>
              {streak} day streak
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.track, styles.trackFull, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.fill, barStyle, { backgroundColor: colors.primary }]} />
      </View>
      <Text style={[styles.xpProgress, { color: colors.mutedForeground }]}>
        {xpInLevel} / {xpNeeded} XP to level {level + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelBubbleLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumberLarge: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  levelLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  xpLabelFull: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  streakFull: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakFullText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  trackFull: {
    height: 8,
    borderRadius: 4,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  xpProgress: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  levelBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumber: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  barWrapper: {
    flex: 1,
    gap: 3,
  },
  xpText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  streakText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
