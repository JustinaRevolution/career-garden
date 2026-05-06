import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { GardenScene } from "@/components/GardenScene";
import { DailyActionItem } from "@/components/DailyActionItem";
import { XPBar } from "@/components/XPBar";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { getGardenLevel } from "@/data/content";

export default function GardenScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, completeDailyAction, todayActions } = useGame();
  const gardenLevel = getGardenLevel(state.xp);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [sharing, setSharing] = useState(false);
  const gardenRef = useRef<View>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const gardenNames = [
    "Bare Pond",
    "Awakening",
    "First Life",
    "Blooming",
    "Lantern Lit",
    "Twin Koi",
    "Full Garden",
  ];
  const gardenName = gardenNames[Math.min(gardenLevel - 1, gardenNames.length - 1)];

  const handleDailyAction = useCallback(
    (actionId: string) => {
      completeDailyAction(actionId);
      setBurstTrigger((n) => n + 1);
    },
    [completeDailyAction]
  );

  const handleShare = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("Sharing not available", "Sharing is only supported on iOS and Android.");
      return;
    }

    if (!gardenRef.current) return;

    try {
      setSharing(true);
      const uri = await captureRef(gardenRef, {
        format: "png",
        quality: 1,
      });
      const day = state.streak > 0 ? state.streak : 1;
      const caption = `Day ${day} of my job search garden 🌸 #CareerGarden`;

      if (Platform.OS === "ios") {
        await Share.share(
          { message: caption, url: uri },
          { subject: "My Career Garden" }
        );
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert("Sharing not available", "Your device doesn't support sharing.");
          return;
        }
        await Sharing.shareAsync(uri, {
          dialogTitle: caption,
          mimeType: "image/png",
        });
        await Share.share({ message: caption });
      }
    } catch {
      Alert.alert("Could not share", "Something went wrong capturing your garden.");
    } finally {
      setSharing(false);
    }
  }, [state.streak, gardenRef]);

  return (
    <View style={styles.rootContainer}>
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.appName, { color: colors.primary }]}>Career Garden</Text>
          <Text style={[styles.gardenState, { color: colors.mutedForeground }]}>
            {gardenName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleShare}
          disabled={sharing}
          style={[
            styles.shareButton,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: sharing ? 0.5 : 1 },
          ]}
          activeOpacity={0.75}
        >
          <Text style={[styles.shareButtonText, { color: colors.primary }]}>
            {sharing ? "Sharing…" : "Share Garden 🌸"}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.xpSection}>
        <XPBar xp={state.xp} streak={state.streak} compact />
      </View>

      <GardenScene
        ref={gardenRef}
        gardenLevel={gardenLevel}
        height={220}
        burstTrigger={burstTrigger}
        showBlossoms={state.level >= 10}
      />

      <View style={styles.gardenHint}>
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
          {gardenLevel < 7
            ? "Complete more lessons to grow your garden"
            : "Your garden is in full bloom"}
        </Text>
      </View>

      <View style={styles.dailySection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Today's Ritual
        </Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Small actions, tended daily
        </Text>

        {todayActions.map((action) => (
          <DailyActionItem
            key={action.id}
            action={action}
            isCompleted={state.dailyActionsCompleted.includes(action.id)}
            onComplete={handleDailyAction}
          />
        ))}
      </View>

      {state.completedLessons.length > 0 && (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {state.completedLessons.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Lessons</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.accent }]}>
              {state.earnedBadges.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Badges</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statNumber, { color: colors.xpGold }]}>
              {state.xp}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>XP</Text>
          </View>
        </View>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1 },
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  appName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  gardenState: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  shareButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  shareButtonText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  xpSection: {},
  dailySection: { gap: 4 },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  gardenHint: { alignItems: "center" },
  hintText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statNumber: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
