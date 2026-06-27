import React, { useEffect } from "react";
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
  level: number;
}

export function LevelUpOverlay({ trigger, level }: Props) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const ringScale = useSharedValue(0.3);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = 0;
    opacity.value = 0;
    ringScale.value = 0.3;
    ringOpacity.value = 0;

    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1400, withTiming(0, { duration: 500 }))
    );
    scale.value = withSequence(
      withSpring(1.08, { damping: 7, stiffness: 180 }),
      withDelay(1200, withSpring(0, { damping: 14, stiffness: 200 }))
    );
    ringOpacity.value = withSequence(
      withTiming(0.6, { duration: 200 }),
      withDelay(800, withTiming(0, { duration: 700 }))
    );
    ringScale.value = withTiming(1.8, { duration: 1400 });
  }, [trigger]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View style={[styles.overlay, { pointerEvents: "none" }]}>
      <View style={styles.center}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Animated.View style={[styles.banner, containerStyle]}>
          <Text style={styles.emoji}>🌿</Text>
          <Text style={styles.title}>Level Up!</Text>
          <Text style={styles.subtitle}>Level {level} reached</Text>
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
    zIndex: 100,
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
    borderWidth: 3,
    borderColor: "#7BC4A0",
  },
  banner: {
    backgroundColor: "#0D2B28EE",
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#7BC4A0",
    gap: 4,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    color: "#7BC4A0",
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#A8D8C0",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
