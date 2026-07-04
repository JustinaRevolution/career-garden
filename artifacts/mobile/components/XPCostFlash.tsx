import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface Props {
  trigger: number;
  amount: number;
  color: string;
}

export function XPCostFlash({ trigger, amount, color }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    opacity.value = 1;
    translateY.value = 0;
    opacity.value = withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(-34, { duration: 1000, easing: Easing.out(Easing.quad) });
  }, [trigger]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <Text style={[styles.text, { color }]}>−{amount} XP</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 2,
    alignSelf: "center",
    zIndex: 10,
  },
  text: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
