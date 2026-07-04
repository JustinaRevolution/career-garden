import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface Props {
  trigger: number;
  amount: number;
  color: string;
}

export function XPGainFlash({ trigger, amount, color }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (trigger === 0) return;
    opacity.value = 1;
    translateY.value = 0;
    scale.value = withSequence(
      withTiming(1.15, { duration: 180, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) })
    );
    opacity.value = withTiming(0, { duration: 1100, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(-38, { duration: 1100, easing: Easing.out(Easing.quad) });
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Text style={[styles.text, { color }]}>+{amount} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -6,
    right: 4,
    zIndex: 10,
  },
  text: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
