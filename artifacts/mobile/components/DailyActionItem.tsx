import { Ionicons } from "@expo/vector-icons";
import { impact } from "@/lib/haptics";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";
import { DailyAction } from "@/data/content";

interface Props {
  action: DailyAction;
  isCompleted: boolean;
  onComplete: (actionId: string) => void;
}

export function DailyActionItem({ action, isCompleted, onComplete }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);
  const opacity = useSharedValue(isCompleted ? 0.5 : 1);

  useEffect(() => {
    checkScale.value = withSpring(isCompleted ? 1 : 0, { damping: 12 });
    opacity.value = withTiming(isCompleted ? 0.5 : 1, { duration: 300 });
  }, [isCompleted]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  async function handlePress() {
    if (isCompleted) return;
    scale.value = withSpring(0.96, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    impact();
    onComplete(action.id);
  }

  return (
    <Pressable onPress={handlePress} testID={`daily-action-${action.id}`}>
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: colors.card, borderColor: colors.border },
          containerStyle,
        ]}
      >
        <View style={styles.checkArea}>
          <View
            style={[
              styles.circle,
              {
                borderColor: isCompleted ? colors.primary : colors.border,
                backgroundColor: isCompleted ? colors.primary : "transparent",
              },
            ]}
          >
            <Animated.View style={checkStyle}>
              <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
            </Animated.View>
          </View>
        </View>
        <Text
          style={[
            styles.text,
            {
              color: colors.foreground,
              textDecorationLine: isCompleted ? "line-through" : "none",
            },
          ]}
        >
          {action.text}
        </Text>
        <View style={[styles.xpBadge, { backgroundColor: colors.accent + "20" }]}>
          <Text style={[styles.xpText, { color: colors.accent }]}>+{action.xp}</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  checkArea: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
