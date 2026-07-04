import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface Props {
  trigger: number;
  onComplete?: () => void;
}

const TOTAL_MS = 2950;

export function StreakFreezeToast({ trigger, onComplete }: Props) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trigger === 0) return;
    translateY.value = -100;
    opacity.value = 0;

    translateY.value = withSpring(0, { damping: 14, stiffness: 160 });
    opacity.value = withSequence(
      withTiming(1, { duration: 250 }),
      withDelay(2200, withTiming(0, { duration: 500 }))
    );

    if (doneTimer.current) clearTimeout(doneTimer.current);
    doneTimer.current = setTimeout(() => onCompleteRef.current?.(), TOTAL_MS);
    return () => {
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, [trigger]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={[styles.overlay, { pointerEvents: "none" }]}>
      <Animated.View style={[styles.toast, animStyle]}>
        <Text style={styles.icon}>🧊</Text>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Streak Saved!</Text>
          <Text style={styles.sub}>Your streak freeze protected{"\n"}your streak!</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 60,
    zIndex: 97,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#0D1E3AEE",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: "#4A90D9AA",
    minWidth: 260,
    shadowColor: "#4A90D9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    fontSize: 32,
  },
  textBlock: {
    gap: 2,
  },
  title: {
    color: "#7AC4F5",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  sub: {
    color: "#A8C8E8",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
