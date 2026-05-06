import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProgressRing } from "@/components/ProgressRing";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { MODULES } from "@/data/content";

export default function ModuleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isLessonCompleted, getModuleProgress } = useGame();

  const module = MODULES.find((m) => m.id === id);

  if (!module) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>Module not found</Text>
      </View>
    );
  }

  const progress = getModuleProgress(module.id);
  const completedCount = Math.round(progress * module.lessons.length);
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.hero,
          { backgroundColor: module.color + "22", borderBottomColor: module.color + "33" },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={22} color={module.color} />
        </Pressable>

        <View style={styles.heroContent}>
          <View style={[styles.heroIcon, { backgroundColor: module.color + "33" }]}>
            <Ionicons name={module.icon as any} size={36} color={module.color} />
          </View>

          <Text style={[styles.heroTitle, { color: colors.foreground }]}>
            {module.title}
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            {module.subtitle}
          </Text>

          <View style={styles.heroProgress}>
            <ProgressRing
              progress={progress}
              size={64}
              strokeWidth={5}
              color={module.color}
              trackColor={colors.muted}
            >
              <Text style={[styles.pctLabel, { color: module.color }]}>
                {Math.round(progress * 100)}%
              </Text>
            </ProgressRing>
            <View>
              <Text style={[styles.progressLabel, { color: colors.foreground }]}>
                {completedCount} of {module.lessons.length} complete
              </Text>
              <Text style={[styles.xpLabel, { color: colors.mutedForeground }]}>
                {module.lessons.length * 50} total XP available
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.lessonList}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
          LESSONS
        </Text>

        {module.lessons.map((lesson, index) => {
          const completed = isLessonCompleted(lesson.id);
          return (
            <Pressable
              key={lesson.id}
              onPress={() =>
                router.push({
                  pathname: "/lesson",
                  params: { moduleId: module.id, lessonId: lesson.id },
                })
              }
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              testID={`lesson-${lesson.id}`}
            >
              <View
                style={[
                  styles.lessonRow,
                  {
                    backgroundColor: colors.card,
                    borderColor: completed ? module.color + "55" : colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.lessonNumber,
                    {
                      backgroundColor: completed ? module.color : colors.muted,
                    },
                  ]}
                >
                  {completed ? (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  ) : (
                    <Text style={[styles.numText, { color: colors.mutedForeground }]}>
                      {index + 1}
                    </Text>
                  )}
                </View>

                <View style={styles.lessonInfo}>
                  <Text style={[styles.lessonTitle, { color: colors.foreground }]}>
                    {lesson.title}
                  </Text>
                  <Text style={[styles.lessonMeta, { color: colors.mutedForeground }]}>
                    {lesson.duration} · {lesson.xp} XP
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.mutedForeground}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 16,
    paddingBottom: 8,
    alignSelf: "flex-start",
  },
  heroContent: {
    paddingHorizontal: 24,
    gap: 10,
    alignItems: "flex-start",
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  heroProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 10,
  },
  pctLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  progressLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  xpLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  lessonList: {
    padding: 20,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
  },
  lessonNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  lessonInfo: { flex: 1, gap: 2 },
  lessonTitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  lessonMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
