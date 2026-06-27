import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
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
import { StreakFreezeToast } from "@/components/StreakFreezeToast";
import { StreakMilestoneOverlay } from "@/components/StreakMilestoneOverlay";
import { XPBar } from "@/components/XPBar";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import {
  getGardenLevel,
  POWER_UP_MILESTONES,
  XP_SHOP,
  PowerUpEvent,
} from "@/data/content";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function eventLabel(type: PowerUpEvent["type"]): { emoji: string; text: string } {
  switch (type) {
    case "earned-freeze": return { emoji: "🎁", text: "Earned Streak Freeze" };
    case "earned-boost":  return { emoji: "🎁", text: "Earned XP Boost" };
    case "used-freeze":   return { emoji: "🧊", text: "Streak Freeze used" };
    case "used-boost":    return { emoji: "⚡", text: "2x XP Boost activated" };
    case "bought-freeze": return { emoji: "🛒", text: "Bought Streak Freeze" };
    case "bought-boost":  return { emoji: "🛒", text: "Bought XP Boost" };
  }
}

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
    streakFreezeTrigger,
    buyStreakFreeze,
    buyXPBoost,
  } = useGame();
  const { muted, toggleMute } = useAmbientSound();

  const gardenLevel = getGardenLevel(state.xp);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [badgeTrigger, setBadgeTrigger] = useState(0);
  const [badgeId, setBadgeId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const gardenRef = useRef<View>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  const gardenNames = [
    "Bare Pond", "Awakening", "First Life", "Blooming",
    "Lantern Lit", "Twin Koi", "Full Garden",
  ];
  const gardenName = gardenNames[Math.min(gardenLevel - 1, gardenNames.length - 1)];

  const boostActive = isXPBoostActive();
  const boostExpiresIn = (() => {
    if (!boostActive || state.xpBoostExpiresAt === null) return null;
    return Math.ceil((state.xpBoostExpiresAt - Date.now()) / (1000 * 60 * 60));
  })();

  const nextFreezeAt = POWER_UP_MILESTONES.badgesPerStreakFreeze;
  const badgesUntilFreeze = nextFreezeAt - (state.earnedBadges.length % nextFreezeAt);
  const nextBoostAt = POWER_UP_MILESTONES.lessonsPerXPBoost;
  const lessonsUntilBoost = nextBoostAt - (state.completedLessons.length % nextBoostAt);

  const canBuyFreeze = state.xp >= XP_SHOP.streakFreezePrice;
  const canBuyBoost = state.xp >= XP_SHOP.xpBoostPrice;

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
      Alert.alert("Boost Already Active", `Expires in ${boostExpiresIn}h.`);
      return;
    }
    if (state.xpBoosts <= 0) {
      Alert.alert("No XP Boosters", `Complete ${lessonsUntilBoost} more lessons to earn one.`);
      return;
    }
    Alert.alert("Activate 2x XP Boost?", "Doubles XP earned for the next 24 hours.", [
      { text: "Cancel", style: "cancel" },
      { text: "Activate!", onPress: async () => { await activateXPBoost(); } },
    ]);
  }, [boostActive, boostExpiresIn, state.xpBoosts, lessonsUntilBoost, activateXPBoost]);

  const handleBuyFreeze = useCallback(async () => {
    if (!canBuyFreeze) {
      Alert.alert("Not Enough XP", `You need ${XP_SHOP.streakFreezePrice} XP to buy a Streak Freeze.`);
      return;
    }
    Alert.alert(
      "Buy Streak Freeze?",
      `Spend ${XP_SHOP.streakFreezePrice} XP for 1 Streak Freeze.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Buy", onPress: async () => { await buyStreakFreeze(); } },
      ]
    );
  }, [canBuyFreeze, buyStreakFreeze]);

  const handleBuyBoost = useCallback(async () => {
    if (!canBuyBoost) {
      Alert.alert("Not Enough XP", `You need ${XP_SHOP.xpBoostPrice} XP to buy a 2x XP Boost.`);
      return;
    }
    Alert.alert(
      "Buy 2x XP Boost?",
      `Spend ${XP_SHOP.xpBoostPrice} XP for 1 XP Boost (24h).`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Buy", onPress: async () => { await buyXPBoost(); } },
      ]
    );
  }, [canBuyBoost, buyXPBoost]);

  const handleShare = useCallback(async () => {
    if (Platform.OS === "web") {
      Alert.alert("Sharing not available", "Sharing is only supported on iOS and Android.");
      return;
    }
    if (!gardenRef.current) return;
    try {
      setSharing(true);
      const uri = await captureRef(gardenRef, { format: "png", quality: 1 });
      const day = state.streak > 0 ? state.streak : 1;
      const caption = `Day ${day} of my job search garden 🌸 #CareerGarden`;
      if (Platform.OS === "ios") {
        await Share.share({ message: caption, url: uri }, { subject: "My Career Garden" });
      } else {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, { dialogTitle: caption, mimeType: "image/png" });
        }
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
      <StreakFreezeToast trigger={streakFreezeTrigger} />
      <StreakMilestoneOverlay trigger={streakMilestoneTrigger} milestone={streakMilestoneValue} />

      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.appName, { color: colors.primary }]}>Career Garden</Text>
            <Text style={[styles.gardenState, { color: colors.mutedForeground }]}>{gardenName}</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={toggleMute} style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={muted ? "volume-mute" : "volume-medium"} size={18} color={colors.mutedForeground} />
            </Pressable>
            <TouchableOpacity
              onPress={handleShare}
              disabled={sharing}
              style={[styles.shareButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: sharing ? 0.5 : 1 }]}
              activeOpacity={0.75}
            >
              <Text style={[styles.shareButtonText, { color: colors.primary }]}>
                {sharing ? "Sharing…" : "Share 🌸"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* XP Bar */}
        <XPBar xp={state.xp} streak={state.streak} compact />

        {/* Garden */}
        <GardenScene
          ref={gardenRef}
          gardenLevel={gardenLevel}
          height={220}
          burstTrigger={burstTrigger}
          showBlossoms={state.level >= 10}
        />
        <View style={styles.gardenHint}>
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            {gardenLevel < 7 ? "Complete lessons to grow your garden" : "Your garden is in full bloom"}
          </Text>
        </View>

        {/* Today's Ritual */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today's Ritual</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Small actions, tended daily</Text>
          {todayActions.map((action) => (
            <DailyActionItem
              key={action.id}
              action={action}
              isCompleted={state.dailyActionsCompleted.includes(action.id)}
              onComplete={handleDailyAction}
            />
          ))}
        </View>

        {/* Stats */}
        {state.completedLessons.length > 0 && (
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>{state.completedLessons.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Lessons</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.accent }]}>{state.earnedBadges.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Badges</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statNumber, { color: colors.xpGold }]}>{state.xp}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>XP</Text>
            </View>
          </View>
        )}

        {/* Power-Ups */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Power-Ups</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Earn by completing lessons & badges</Text>
          <View style={styles.powerUpRow}>
            {/* Streak Freeze card */}
            <View style={[styles.powerUpCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={styles.powerUpEmoji}>🧊</Text>
              <Text style={[styles.powerUpName, { color: colors.foreground }]}>Streak Freeze</Text>
              <Text style={[styles.powerUpCount, { color: colors.primary }]}>×{state.streakFreezes}</Text>
              <Text style={[styles.powerUpHint, { color: colors.mutedForeground }]}>
                {state.streakFreezes > 0
                  ? "Auto-applies if you miss a day"
                  : `${badgesUntilFreeze} badge${badgesUntilFreeze !== 1 ? "s" : ""} to earn one`}
              </Text>
            </View>
            {/* XP Boost card */}
            <TouchableOpacity
              onPress={handleActivateBoost}
              activeOpacity={0.8}
              style={[styles.powerUpCard, {
                backgroundColor: boostActive ? "#FFF3D6" : colors.card,
                borderColor: boostActive ? "#F5A54A" : colors.border,
              }]}
            >
              <Text style={styles.powerUpEmoji}>⚡</Text>
              <Text style={[styles.powerUpName, { color: boostActive ? "#D4840A" : colors.foreground }]}>2x XP Boost</Text>
              <Text style={[styles.powerUpCount, { color: boostActive ? "#D4840A" : colors.xpGold }]}>
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

        {/* XP Shop */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>XP Shop</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Spend XP to stock up · Balance: {state.xp} XP
          </Text>
          <View style={styles.shopRow}>
            <Pressable
              onPress={handleBuyFreeze}
              style={[
                styles.shopCard,
                { backgroundColor: colors.card, borderColor: canBuyFreeze ? colors.primary + "66" : colors.border },
              ]}
            >
              <Text style={styles.shopEmoji}>🧊</Text>
              <Text style={[styles.shopItemName, { color: colors.foreground }]}>Streak Freeze</Text>
              <View style={[styles.shopPricePill, { backgroundColor: canBuyFreeze ? colors.primary + "22" : colors.muted }]}>
                <Text style={[styles.shopPrice, { color: canBuyFreeze ? colors.primary : colors.mutedForeground }]}>
                  {XP_SHOP.streakFreezePrice} XP
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={handleBuyBoost}
              style={[
                styles.shopCard,
                { backgroundColor: colors.card, borderColor: canBuyBoost ? "#F5A54A66" : colors.border },
              ]}
            >
              <Text style={styles.shopEmoji}>⚡</Text>
              <Text style={[styles.shopItemName, { color: colors.foreground }]}>2x XP Boost</Text>
              <View style={[styles.shopPricePill, { backgroundColor: canBuyBoost ? "#F5A54A22" : colors.muted }]}>
                <Text style={[styles.shopPrice, { color: canBuyBoost ? "#D4840A" : colors.mutedForeground }]}>
                  {XP_SHOP.xpBoostPrice} XP
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Power-Up History */}
        {state.powerUpLog.length > 0 && (
          <View style={styles.section}>
            <Pressable
              onPress={() => setShowHistory((v) => !v)}
              style={styles.historyHeader}
            >
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Power-Up History</Text>
              <Ionicons
                name={showHistory ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
            {showHistory && (
              <View style={[styles.historyList, { borderColor: colors.border }]}>
                {state.powerUpLog.slice(0, 10).map((event, i) => {
                  const { emoji, text } = eventLabel(event.type);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.historyRow,
                        { borderBottomColor: colors.border },
                        i === Math.min(state.powerUpLog.length, 10) - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <Text style={styles.historyEmoji}>{emoji}</Text>
                      <Text style={[styles.historyText, { color: colors.foreground }]}>{text}</Text>
                      <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>
                        {formatTime(event.timestamp)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  appName: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  gardenState: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 2 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  shareButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  shareButtonText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  gardenHint: { alignItems: "center" },
  hintText: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  section: { gap: 4 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 2 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  statNumber: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  powerUpRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  powerUpCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  powerUpEmoji: { fontSize: 28, marginBottom: 2 },
  powerUpName: { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  powerUpCount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  powerUpHint: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 15 },
  shopRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  shopCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  shopEmoji: { fontSize: 30 },
  shopItemName: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  shopPricePill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shopPrice: { fontSize: 13, fontFamily: "Inter_700Bold" },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  historyList: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 6,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  historyEmoji: { fontSize: 18, width: 26 },
  historyText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  historyDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
