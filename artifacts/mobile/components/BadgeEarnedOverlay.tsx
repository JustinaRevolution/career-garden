import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
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

interface Props {
  badgeId: string | null;
  trigger: number;
}

export function BadgeEarnedOverlay({ badgeId, trigger }: Props) {
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);
  const badgeRef = useRef<typeof BADGES[number] | null>(null);

  if (badgeId) {
    const found = BADGES.find((b) => b.id === badgeId);
    if (found) badgeRef.current = found;
  }

  const badge = badgeRef.current;

  useEffect(() => {
    if (trigger === 0 || !badge) return;
    translateY.value = 120;
    opacity.value = 0;

    translateY.value = withSpring(0, { damping: 14, stiffness: 160 });
    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(2500, withTiming(0, { duration: 500 }))
    );
  }, [trigger]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!badge) return null;

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
            <Text style={styles.earned}>Badge Earned!</Text>
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
