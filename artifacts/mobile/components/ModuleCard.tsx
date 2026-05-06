import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Module } from "@/data/content";
import { ProgressRing } from "./ProgressRing";

interface Props {
  module: Module;
  progress: number;
  onPress: () => void;
}

export function ModuleCard({ module, progress, onPress }: Props) {
  const colors = useColors();
  const completedCount = Math.round(progress * module.lessons.length);
  const isCompleted = progress >= 1;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      testID={`module-card-${module.id}`}
    >
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.iconWrapper, { backgroundColor: module.color + "22" }]}>
          <Ionicons name={module.icon} size={24} color={module.color} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.foreground }]}>{module.title}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {module.subtitle}
          </Text>
          <Text style={[styles.progress, { color: colors.mutedForeground }]}>
            {completedCount} / {module.lessons.length} lessons
          </Text>
        </View>

        <View style={styles.right}>
          <ProgressRing
            progress={progress}
            size={48}
            strokeWidth={4}
            color={isCompleted ? colors.success : module.color}
            trackColor={colors.muted}
          >
            {isCompleted ? (
              <Ionicons name="checkmark" size={16} color={colors.success} />
            ) : (
              <Text style={[styles.pct, { color: module.color }]}>
                {Math.round(progress * 100)}
              </Text>
            )}
          </ProgressRing>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progress: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  right: {
    alignItems: "center",
    justifyContent: "center",
  },
  pct: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
});
