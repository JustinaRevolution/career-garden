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

import { BadgeEarnedOverlay } from "@/components/BadgeEarnedOverlay";
import { GardenScene } from "@/components/GardenScene";
import { DailyActionItem } from "@/components/DailyActionItem";
import { StreakMilestoneOverlay } from "@/components/StreakMilestoneOverlay";
import { XPBar } from "@/components/XPBar";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { getGardenLevel, POWER_UP_MILESTONES } from "@/data/content";

export default function GardenScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    state,
    completeDailyAction,
    todayActions,
    activateXPBoost,
    isXPBoostActive,
    streakMilestoneTrigger,
    streakMilestoneValue,
  } = useGame();
  const gardenLevel = getGardenLevel(state.xp);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [badgeTrigger, setBadgeTrigger] = useState(0);
  const [badgeId, setBadgeId] = useState<string | null>(null);
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

  const boostActive = isXPBoostActive();

  const boostExpiresIn = (() => {
    if (!boostActive || state.xpBoostExpiresAt === null) return null;
    const msLeft = state.xpBoostExpiresAt - Date.now();
    const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));
    return hoursLeft;
  })();

  const nextFreezeAt = POWER_UP_MILESTONES.badgesPerStreakFreeze;
  const badgesUntilFreeze = nextFreezeAt - (state.earnedBadges.length % nextFreezeAt);

  const nextBoostAt = POWER_UP_MILESTONES.lessonsPerXPBoost;
  const lessonsUntilBoost = nextBoostAt - (state.completedLessons.length % nextBoostAt);

  const handleDailyAction = useCallback(
    async (actionId: string) => {
      const { newBadgeIds } = await completeDailyAction(actionId);
      setBurstTrigger((n) => n + 1);
      if (newBadgeIds.length > 0) {
        setBadgeId(newBadgeIds[0]);
        setBadgeTrigger((t) => t + 1);
      }
    },
    [completeDailyAction]
  );

  const handleActivateBoost = useCallback(async () => {
    if (boostActive) {
      Alert.alert(
        "Boost Already Active",
        `Your 2x XP Boost is already running! It expires in ${boostExpiresIn}h.`
      );
      return;
    }
    if (state.xpBoosts <= 0) {
      Alert.alert(
        "No XP Boosters",
        `Complete ${lessonsUntilBoost} more lesson${lessonsUntilBoost !== 1 ? "s" : ""} to earn one.`
      );
      return;
    }
    Alert.alert(
      "Activate 2x XP Boost?",
      "This doubles all XP earned for the next 24 hours.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate!",
          onPress: async () => {
            await activateXPBoost();
          },
        },
      ]
    );
  }, [boostActive, boostExpiresIn, state.xpBoosts, lessonsUntilBoost, activateXPBoost]);

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
      <BadgeEarnedOverlay trigger={badgeTrigger} badgeId={badgeId} />
      <StreakMilestoneOverlay trigger={streakMilestoneTrigger} milestone={streakMilestoneValue} />
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

      <View style={styles.powerUpSection}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Power-Ups
        </Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Earn by completing lessons & badges
        </Text>

        <View style={styles.powerUpRow}>
          <View
            style={[
              styles.powerUpCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={styles.powerUpEmoji}>🧊</Text>
            <Text style={[styles.powerUpName, { color: colors.foreground }]}>
              Streak Freeze
            </Text>
            <Text style={[styles.powerUpCount, { color: colors.primary }]}>
              ×{state.streakFreezes}
            </Text>
            <Text style={[styles.powerUpHint, { color: colors.mutedForeground }]}>
              {state.streakFreezes > 0
                ? "Auto-applies if you miss a day"
                : `${badgesUntilFreeze} badge${badgesUntilFreeze !== 1 ? "s" : ""} to earn one`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleActivateBoost}
            activeOpacity={0.8}
            style={[
              styles.powerUpCard,
              {
                backgroundColor: boostActive ? "#FFF3D6" : colors.card,
                borderColor: boostActive ? "#F5A54A" : colors.border,
              },
            ]}
          >
            <Text style={styles.powerUpEmoji}>⚡</Text>
            <Text
              style={[
                styles.powerUpName,
                { color: boostActive ? "#D4840A" : colors.foreground },
              ]}
            >
              2x XP Boost
            </Text>
            <Text
              style={[
                styles.powerUpCount,
                { color: boostActive ? "#D4840A" : colors.xpGold },
              ]}
            >
              {boostActive ? "ACTIVE" : `×${state.xpBoosts}`}
            </Text>
            <Text style={[styles.powerUpHint, { color: colors.mutedForeground }]}>
              {boostActive
                ? `Expires in ${boostExpiresIn}h`
                : state.xpBoosts > 0
                ? "Tap to activate for 24h"
                : `${lessonsUntilBoost} lesson${lessonsUntilBoost !== 1 ? "s" : ""} to earn one`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  powerUpSection: { gap: 4 },
  powerUpRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  powerUpCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  powerUpEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  powerUpName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  powerUpCount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  powerUpHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 15,
  },
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
