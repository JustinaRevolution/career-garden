import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface Props {
  trigger: number;
  milestone: number;
}

const MILESTONE_MESSAGES: Record<number, { emoji: string; label: string; sub: string }> = {
  3:  { emoji: "🔥", label: "3-Day Streak!",  sub: "You're building momentum." },
  7:  { emoji: "🌟", label: "Week Warrior!",   sub: "7 days strong. The garden blooms." },
  14: { emoji: "🏆", label: "Fortnight Force!", sub: "Two weeks of daily dedication." },
  30: { emoji: "🌸", label: "30-Day Legend!",  sub: "A full month. Your garden thrives." },
};

export function StreakMilestoneOverlay({ trigger, milestone }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const ringScale = useSharedValue(0.4);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = 0;
    opacity.value = 0;
    ringScale.value = 0.4;
    ringOpacity.value = 0;

    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(2000, withTiming(0, { duration: 600 }))
    );
    scale.value = withSequence(
      withSpring(1.06, { damping: 8, stiffness: 160 }),
      withDelay(1800, withSpring(0, { damping: 14 }))
    );
    ringOpacity.value = withSequence(
      withTiming(0.5, { duration: 300 }),
      withDelay(1000, withTiming(0, { duration: 800 }))
    );
    ringScale.value = withTiming(2.2, {
      duration: 1800,
      easing: Easing.out(Easing.ease),
    });
  }, [trigger]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const info = MILESTONE_MESSAGES[milestone] ?? MILESTONE_MESSAGES[3];

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.banner, containerStyle]}>
          <Text style={styles.emoji}>{info.emoji}</Text>
          <Text style={styles.label}>{info.label}</Text>
          <Text style={styles.sub}>{info.sub}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 98,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "#F5A54A",
  },
  banner: {
    backgroundColor: "#1A1208EE",
    borderRadius: 22,
    paddingHorizontal: 36,
    paddingVertical: 24,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F5A54A",
    gap: 6,
    shadowColor: "#F5A54A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  label: {
    color: "#F5D06E",
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  sub: {
    color: "#C8A87A",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
