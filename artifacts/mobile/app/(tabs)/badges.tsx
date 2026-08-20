import React from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BadgeItem } from "@/components/BadgeItem";
import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { BADGES } from "@/data/content";

export default function BadgesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isBadgeEarned, state } = useGame();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const earnedCount = state.earnedBadges.length;

  const pairs: (typeof BADGES[number] | null)[][] = [];
  for (let i = 0; i < BADGES.length; i += 2) {
    pairs.push([BADGES[i], BADGES[i + 1] ?? null]);
  }

  return (
    <FlatList
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
      ]}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Badges</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {earnedCount} of {BADGES.length} earned
          </Text>
        </View>
      }
      data={pairs}
      keyExtractor={(_, i) => `pair-${i}`}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <BadgeItem badge={item[0]!} earned={isBadgeEarned(item[0]!.id)} />
          {item[1] ? (
            <BadgeItem badge={item[1]} earned={isBadgeEarned(item[1].id)} />
          ) : (
            <View style={{ flex: 1, margin: 5 }} />
          )}
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 15, gap: 0 },
  header: { paddingHorizontal: 5, marginBottom: 16, gap: 4 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
  },
});
