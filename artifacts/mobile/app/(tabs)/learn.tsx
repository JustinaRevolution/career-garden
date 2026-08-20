import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModuleCard } from "@/components/ModuleCard";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { MODULES } from "@/data/content";

export default function LearnScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getModuleProgress, state } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const totalLessons = MODULES.reduce((s, m) => s + m.lessons.length, 0);
  const completedLessons = state.completedLessons.length;
  const overallPct = Math.round((completedLessons / totalLessons) * 100);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]}>Your Journey</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        {completedLessons} of {totalLessons} lessons complete · {overallPct}%
      </Text>

      <View
        style={[styles.progressBarTrack, { backgroundColor: colors.muted }]}
      >
        <View
          style={[
            styles.progressBarFill,
            {
              backgroundColor: colors.primary,
              width: `${overallPct}%`,
            },
          ]}
        />
      </View>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
        8 PATHS TO MASTER
      </Text>

      {MODULES.map((module) => (
        <ModuleCard
          key={module.id}
          module={module}
          progress={getModuleProgress(module.id)}
          onPress={() =>
            router.push({ pathname: "/module/[id]", params: { id: module.id } })
          }
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 6 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 4,
  },
});
