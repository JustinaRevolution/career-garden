import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GardenScene } from "@/components/GardenScene";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { GOAL_TIMELINES } from "@/data/content";

export function Onboarding() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setGoal, completeOnboarding } = useGame();

  const [role, setRole] = useState("");
  const [timelineId, setTimelineId] = useState(GOAL_TIMELINES[1].id);
  const [saving, setSaving] = useState(false);

  const topPad = Platform.OS === "web" ? 40 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  async function handleStart() {
    setSaving(true);
    const timeline = GOAL_TIMELINES.find((t) => t.id === timelineId) ?? GOAL_TIMELINES[1];
    if (role.trim().length > 0) {
      await setGoal(role, timeline.days);
    }
    await completeOnboarding();
  }

  async function handleSkip() {
    setSaving(true);
    await completeOnboarding();
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 24, paddingBottom: bottomPad + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.welcome, { color: colors.mutedForeground }]}>Welcome to</Text>
        <Text style={[styles.appName, { color: colors.primary }]}>Career Garden</Text>
        <Text style={[styles.tagline, { color: colors.foreground }]}>
          Grow a calm, beautiful pond as you build the skills to land your next role.
        </Text>

        <View style={styles.gardenWrap}>
          <GardenScene gardenLevel={4} height={170} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>What role are you aiming for?</Text>
          <TextInput
            value={role}
            onChangeText={setRole}
            placeholder="e.g. Product Designer"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card },
            ]}
            maxLength={60}
            returnKeyType="done"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.foreground }]}>By when?</Text>
          <View style={styles.timelineRow}>
            {GOAL_TIMELINES.map((t) => {
              const selected = t.id === timelineId;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTimelineId(t.id)}
                  style={[
                    styles.timelineChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.timelineText,
                      { color: selected ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={handleStart}
          disabled={saving}
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: saving ? 0.6 : 1 }]}
        >
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
            Plant my garden
          </Text>
          <Ionicons name="leaf" size={18} color={colors.primaryForeground} />
        </Pressable>

        <Pressable onPress={handleSkip} disabled={saving} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 4 },
  welcome: { fontSize: 15, fontFamily: "Inter_400Regular" },
  appName: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5, marginBottom: 8 },
  tagline: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24, marginBottom: 20 },
  gardenWrap: { marginBottom: 24 },
  section: { gap: 10, marginBottom: 22 },
  label: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  timelineRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timelineChip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timelineText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  skipBtn: { alignItems: "center", paddingVertical: 16 },
  skipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
