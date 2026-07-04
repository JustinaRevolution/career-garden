import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { BADGES } from "@/data/content";

type Badge = typeof BADGES[number];

interface Props {
  badgeIds: string[];
  trigger: number;
  onComplete?: () => void;
}

const ENTER_MS = 250;
const DISPLAY_MS = 2500;
const EXIT_MS = 500;
const GAP_MS = 250;
const CYCLE_MS = ENTER_MS + DISPLAY_MS + EXIT_MS + GAP_MS;

export function BadgeEarnedOverlay({ badgeIds, trigger, onComplete }: Props) {
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  const [display, setDisplay] = useState<{
    badge: Badge;
    index: number;
    total: number;
  } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (trigger === 0 || badgeIds.length === 0) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];

    const badges = badgeIds
      .map((id) => BADGES.find((b) => b.id === id))
      .filter((b): b is Badge => Boolean(b));

    if (badges.length === 0) {
      onCompleteRef.current?.();
      return;
    }

    badges.forEach((badge, i) => {
      const showTimer = setTimeout(() => {
        setDisplay({ badge, index: i, total: badges.length });
        translateY.value = 120;
        opacity.value = 0;
        translateY.value = withSpring(0, { damping: 14, stiffness: 160 });
        opacity.value = withSequence(
          withTiming(1, { duration: ENTER_MS }),
          withDelay(DISPLAY_MS, withTiming(0, { duration: EXIT_MS }))
        );
      }, i * CYCLE_MS);
      timers.current.push(showTimer);
    });

    const doneTimer = setTimeout(() => onCompleteRef.current?.(), badges.length * CYCLE_MS);
    timers.current.push(doneTimer);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [trigger]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!display) return null;

  const { badge, index, total } = display;

  function handlePress() {
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(80, { duration: 200 });
    setTimeout(() => router.push("/(tabs)/badges"), 180);
  }

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View style={animStyle}>
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.toast,
            { borderColor: badge.color + "55" },
            pressed && styles.toastPressed,
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: badge.color + "22" }]}>
            <Ionicons name={badge.icon} size={28} color={badge.color} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.earned}>
              Badge Earned!{total > 1 ? ` (${index + 1}/${total})` : ""}
            </Text>
            <Text style={[styles.name, { color: badge.color }]}>{badge.title}</Text>
            <Text style={styles.xp}>+{badge.xpReward} XP · Tap to view</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 100,
    zIndex: 95,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#0D2B28EE",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    minWidth: 260,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  toastPressed: {
    opacity: 0.8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    gap: 2,
  },
  earned: {
    color: "#A8D8C0",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  name: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  xp: {
    color: "#F5D06E",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
