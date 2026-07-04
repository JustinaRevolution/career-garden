import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

import { BadgeEarnedOverlay } from "@/components/BadgeEarnedOverlay";
import { GardenScene } from "@/components/GardenScene";
import { DailyActionItem } from "@/components/DailyActionItem";
import { Onboarding } from "@/components/Onboarding";
import { SharePreviewCard } from "@/components/SharePreviewCard";
import { StreakFreezeToast } from "@/components/StreakFreezeToast";
import { StreakMilestoneOverlay } from "@/components/StreakMilestoneOverlay";
import { VolumeSlider } from "@/components/VolumeSlider";
import { XPBar } from "@/components/XPBar";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { useNotifications } from "@/hooks/useNotifications";
import {
  COSMETICS,
  DEFAULT_KOI_COLOR,
  getGardenLevel,
  getWeekStats,
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
    clearGoal,
    setNotificationsEnabled,
    buyCosmetic,
    equipCosmetic,
    getEquippedKoiColor,
  } = useGame();
  const gardenLevel = getGardenLevel(state.xp);
  const { muted, toggleMute, volume, setVolume } = useAmbientSound(gardenLevel);
  const [volumeModalVisible, setVolumeModalVisible] = useState(false);
  const longPressTriggeredRef = useRef(false);
  const { isSupported: notifSupported, requestPermission, scheduleDailyReminder, cancelDailyReminder } =
    useNotifications();
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareCaption, setShareCaption] = useState("");
  const [badgeTrigger, setBadgeTrigger] = useState(0);
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const shareCardRef = useRef<View>(null);

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
        setBadgeIds(newBadgeIds);
        setTimeout(() => setBadgeTrigger((t) => t + 1), 1000);
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

  const weekStats = getWeekStats(state.dailyLog);
  const prevWeekStats = getWeekStats(state.dailyLog, 7);
  const xpDelta = weekStats.xp - prevWeekStats.xp;
  const koiColor = getEquippedKoiColor();
  const bonusKoi = state.applications.length;

  const goalDaysLeft = (() => {
    if (!state.goal) return null;
    return Math.ceil((state.goal.targetDate - Date.now()) / 86400000);
  })();
  const goalOverdue = goalDaysLeft !== null && goalDaysLeft <= 0;

  const handleToggleReminder = useCallback(
    async (value: boolean) => {
      if (value) {
        const granted = await requestPermission();
        if (!granted) {
          Alert.alert(
            "Notifications Off",
            "Enable notifications in your device settings to get daily reminders."
          );
          return;
        }
        const ok = await scheduleDailyReminder();
        if (ok) await setNotificationsEnabled(true);
      } else {
        await cancelDailyReminder();
        await setNotificationsEnabled(false);
      }
    },
    [requestPermission, scheduleDailyReminder, cancelDailyReminder, setNotificationsEnabled]
  );

  const handleClearGoal = useCallback(() => {
    Alert.alert("Clear Goal?", "This removes your countdown. You can set a new goal later.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: async () => { await clearGoal(); } },
    ]);
  }, [clearGoal]);

  const handleBuyCosmetic = useCallback(
    async (cosmeticId: string, name: string, price: number) => {
      if (state.ownedCosmetics.includes(cosmeticId)) {
        await equipCosmetic(cosmeticId);
        return;
      }
      if (state.xp < price) {
        Alert.alert("Not Enough XP", `You need ${price} XP to unlock ${name}.`);
        return;
      }
      Alert.alert("Unlock " + name + "?", `Spend ${price} XP to unlock and equip this koi.`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unlock",
          onPress: async () => {
            const ok = await buyCosmetic(cosmeticId);
            if (ok) await equipCosmetic(cosmeticId);
          },
        },
      ]);
    },
    [state.ownedCosmetics, state.xp, buyCosmetic, equipCosmetic]
  );

  const handleShare = useCallback(() => {
    const day = state.streak > 0 ? state.streak : 1;
    const defaultCaption = `Day ${day} of my job search garden 🌸 #CareerGarden`;
    setShareCaption(defaultCaption);
    setShareModalVisible(true);
  }, [state.streak]);

  const handleConfirmShare = useCallback(async () => {
    if (Platform.OS === "web") {
      setShareModalVisible(false);
      Alert.alert("Sharing not available", "Sharing is only supported on iOS and Android.");
      return;
    }

    if (!shareCardRef.current) return;

    try {
      setSharing(true);
      const uri = await captureRef(shareCardRef, { format: "png", quality: 1 });
      setShareModalVisible(false);

      const caption = shareCaption.trim() || `Day ${state.streak > 0 ? state.streak : 1} of my job search garden 🌸 #CareerGarden`;

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
  }, [shareCaption, state.streak, shareCardRef]);

  if (!state.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <View style={styles.rootContainer}>
      <BadgeEarnedOverlay trigger={badgeTrigger} badgeIds={badgeIds} />
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
            <Pressable
              onPress={() => {
                if (longPressTriggeredRef.current) {
                  longPressTriggeredRef.current = false;
                  return;
                }
                toggleMute();
              }}
              onLongPress={() => {
                longPressTriggeredRef.current = true;
                setVolumeModalVisible(true);
              }}
              delayLongPress={350}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
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
          gardenLevel={gardenLevel}
          height={220}
          burstTrigger={burstTrigger}
          showBlossoms={state.level >= 10}
          koiColor={koiColor}
          bonusKoi={bonusKoi}
        />
        <View style={styles.gardenHint}>
          <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
            {gardenLevel < 7 ? "Complete lessons to grow your garden" : "Your garden is in full bloom"}
          </Text>
        </View>

        {/* Goal Countdown */}
        {state.goal && goalDaysLeft !== null && (
          <View
            style={[
              styles.goalCard,
              goalOverdue
                ? { backgroundColor: colors.accent + "14", borderColor: colors.accent + "44" }
                : { backgroundColor: colors.primary + "12", borderColor: colors.primary + "33" },
            ]}
          >
            <View style={styles.goalLeft}>
              <Text style={[styles.goalLabel, { color: goalOverdue ? colors.accent : colors.primary }]}>
                {goalOverdue ? "GOAL DATE PASSED" : "MY GOAL"}
              </Text>
              <Text style={[styles.goalRole, { color: colors.foreground }]} numberOfLines={1}>
                {state.goal.role}
              </Text>
              {goalOverdue && (
                <Text style={[styles.goalOverdueHint, { color: colors.mutedForeground }]}>
                  Keep tending, or set a fresh goal
                </Text>
              )}
            </View>
            <View style={styles.goalRight}>
              {goalOverdue ? (
                <Text style={[styles.goalDays, { color: colors.accent, fontSize: 22 }]}>🌱</Text>
              ) : (
                <Text style={[styles.goalDays, { color: colors.primary }]}>{goalDaysLeft}</Text>
              )}
              <Text style={[styles.goalDaysLabel, { color: colors.mutedForeground }]}>
                {goalOverdue
                  ? goalDaysLeft === 0
                    ? "due today"
                    : `${Math.abs(goalDaysLeft)}d ago`
                  : goalDaysLeft === 1
                  ? "day left"
                  : "days left"}
              </Text>
            </View>
            <Pressable
              onPress={handleClearGoal}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear goal"
              style={styles.goalClear}
            >
              <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}

        {/* Weekly Recap */}
        {weekStats.activeDays > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>This Week</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Active {weekStats.activeDays} of the last 7 days
            </Text>
            <View style={[styles.recapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.recapItem}>
                <Text style={[styles.recapNumber, { color: colors.xpGold }]}>{weekStats.xp}</Text>
                <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>XP</Text>
                {prevWeekStats.xp > 0 && xpDelta !== 0 && (
                  <Text
                    style={[
                      styles.recapDelta,
                      { color: xpDelta > 0 ? colors.success : colors.mutedForeground },
                    ]}
                  >
                    {xpDelta > 0 ? "▲" : "▼"} {Math.abs(xpDelta)}
                  </Text>
                )}
              </View>
              <View style={[styles.recapDivider, { backgroundColor: colors.border }]} />
              <View style={styles.recapItem}>
                <Text style={[styles.recapNumber, { color: colors.primary }]}>{weekStats.lessons}</Text>
                <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Lessons</Text>
              </View>
              <View style={[styles.recapDivider, { backgroundColor: colors.border }]} />
              <View style={styles.recapItem}>
                <Text style={[styles.recapNumber, { color: colors.accent }]}>{weekStats.actions}</Text>
                <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Rituals</Text>
              </View>
              <View style={[styles.recapDivider, { backgroundColor: colors.border }]} />
              <View style={styles.recapItem}>
                <Text style={[styles.recapNumber, { color: colors.success }]}>{weekStats.applications}</Text>
                <Text style={[styles.recapLabel, { color: colors.mutedForeground }]}>Applied</Text>
              </View>
            </View>
          </View>
        )}

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
            <TouchableOpacity
              onPress={handleActivateBoost}
              activeOpacity={0.8}
              style={[styles.powerUpCard, {
                backgroundColor: boostActive ? colors.accent + "22" : colors.card,
                borderColor: boostActive ? colors.accent : colors.border,
              }]}
            >
              <Text style={styles.powerUpEmoji}>⚡</Text>
              <Text style={[styles.powerUpName, { color: boostActive ? colors.accent : colors.foreground }]}>2x XP Boost</Text>
              <Text style={[styles.powerUpCount, { color: boostActive ? colors.accent : colors.xpGold }]}>
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

        {/* Garden Cosmetics */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Koi Colors</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Unlock with XP, then tap to equip
          </Text>
          <View style={styles.cosmeticGrid}>
            {/* Default koi */}
            <Pressable
              onPress={() => equipCosmetic(null)}
              style={[
                styles.cosmeticCard,
                {
                  backgroundColor: colors.card,
                  borderColor: state.equippedCosmetic === null ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.cosmeticSwatch, { backgroundColor: DEFAULT_KOI_COLOR }]} />
              <Text style={[styles.cosmeticName, { color: colors.foreground }]} numberOfLines={1}>
                Classic
              </Text>
              <Text style={[styles.cosmeticStatus, { color: colors.mutedForeground }]}>
                {state.equippedCosmetic === null ? "Equipped" : "Free"}
              </Text>
            </Pressable>
            {COSMETICS.map((c) => {
              const owned = state.ownedCosmetics.includes(c.id);
              const equipped = state.equippedCosmetic === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => handleBuyCosmetic(c.id, c.name, c.price)}
                  style={[
                    styles.cosmeticCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: equipped ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <View style={[styles.cosmeticSwatch, { backgroundColor: c.value }]} />
                  <Text style={[styles.cosmeticName, { color: colors.foreground }]} numberOfLines={1}>
                    {c.name.replace(" Koi", "")}
                  </Text>
                  {equipped ? (
                    <Text style={[styles.cosmeticStatus, { color: colors.primary }]}>Equipped</Text>
                  ) : owned ? (
                    <Text style={[styles.cosmeticStatus, { color: colors.mutedForeground }]}>Tap to equip</Text>
                  ) : (
                    <View style={[styles.cosmeticPricePill, { backgroundColor: state.xp >= c.price ? colors.xpGold + "22" : colors.muted }]}>
                      <Text style={[styles.cosmeticPrice, { color: state.xp >= c.price ? "#D4840A" : colors.mutedForeground }]}>
                        {c.price} XP
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Daily Reminder */}
        {notifSupported && (
          <View style={styles.section}>
            <View style={[styles.reminderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.reminderText}>
                <Text style={[styles.reminderTitle, { color: colors.foreground }]}>Daily Reminder</Text>
                <Text style={[styles.reminderSub, { color: colors.mutedForeground }]}>
                  A gentle nudge at 6:00 PM to tend your garden
                </Text>
              </View>
              <Switch
                value={state.notificationsEnabled}
                onValueChange={handleToggleReminder}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>
        )}

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
                      <View style={styles.historyBody}>
                        <Text style={[styles.historyText, { color: colors.foreground }]}>{text}</Text>
                        {event.detail ? (
                          <Text style={[styles.historyDetail, { color: colors.mutedForeground }]}>
                            {event.detail}
                          </Text>
                        ) : null}
                      </View>
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

      {/* Share Preview Bottom Sheet */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShareModalVisible(false)}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Share Your Garden</Text>

            <SharePreviewCard
              ref={shareCardRef}
              gardenLevel={gardenLevel}
              streak={state.streak}
              xp={state.xp}
              badges={state.earnedBadges.length}
              caption={shareCaption}
              showBlossoms={state.level >= 10}
            />

            <View style={styles.captionRow}>
              <TextInput
                style={[
                  styles.captionInput,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                value={shareCaption}
                onChangeText={setShareCaption}
                multiline
                maxLength={280}
                placeholder="Add a caption…"
                placeholderTextColor={colors.mutedForeground}
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                {shareCaption.length}/280
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setShareModalVisible(false)}
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmShare}
                disabled={sharing}
                style={[
                  styles.modalBtn,
                  styles.confirmBtn,
                  { backgroundColor: colors.primary, opacity: sharing ? 0.6 : 1 },
                ]}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  {sharing ? "Capturing…" : "Share 🌸"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ambient Volume Sheet */}
      <Modal
        visible={volumeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setVolumeModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setVolumeModalVisible(false)}
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Ambient Sound</Text>

            <View style={styles.volumeRow}>
              <Ionicons
                name={muted ? "volume-mute" : "volume-medium"}
                size={20}
                color={colors.mutedForeground}
              />
              <View style={styles.volumeSliderWrap}>
                <VolumeSlider
                  value={muted ? 0 : volume}
                  onValueChange={setVolume}
                  trackColor={colors.border}
                  fillColor={colors.primary}
                  thumbColor={colors.primary}
                />
              </View>
              <Text style={[styles.volumePercent, { color: colors.mutedForeground }]}>
                {Math.round((muted ? 0 : volume) * 100)}%
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={toggleMute}
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                activeOpacity={0.75}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>
                  {muted ? "Unmute" : "Mute"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setVolumeModalVisible(false)}
                style={[styles.modalBtn, styles.confirmBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  volumeSliderWrap: { flex: 1 },
  volumePercent: { fontSize: 13, fontFamily: "Inter_600SemiBold", width: 38, textAlign: "right" },
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
  goalCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  goalLeft: { flex: 1, gap: 2 },
  goalLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  goalRole: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  goalRight: { alignItems: "center" },
  goalDays: { fontSize: 28, fontFamily: "Inter_700Bold", lineHeight: 32 },
  goalDaysLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  goalOverdueHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  goalClear: { marginLeft: 4 },
  recapCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  recapItem: { flex: 1, alignItems: "center", gap: 2 },
  recapNumber: { fontSize: 22, fontFamily: "Inter_700Bold" },
  recapLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  recapDelta: { fontSize: 10, fontFamily: "Inter_700Bold", marginTop: 1 },
  recapDivider: { width: 1, height: 32 },
  cosmeticGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  cosmeticCard: {
    width: "31%",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 6,
  },
  cosmeticSwatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  cosmeticName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cosmeticStatus: { fontSize: 11, fontFamily: "Inter_500Medium" },
  cosmeticPricePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cosmeticPrice: { fontSize: 12, fontFamily: "Inter_700Bold" },
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  reminderText: { flex: 1, gap: 2 },
  reminderTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reminderSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
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
  historyBody: { flex: 1, gap: 1 },
  historyText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  historyDetail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  historyDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  captionRow: {
    gap: 4,
  },
  captionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 64,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelBtn: {
    borderWidth: 1,
  },
  confirmBtn: {},
  modalBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
