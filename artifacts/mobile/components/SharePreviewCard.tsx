import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { GardenScene } from "@/components/GardenScene";

interface SharePreviewCardProps {
  gardenLevel: number;
  streak: number;
  xp: number;
  badges: number;
  caption: string;
  showBlossoms?: boolean;
}

export const SharePreviewCard = React.forwardRef<View, SharePreviewCardProps>(
  function SharePreviewCard(
    { gardenLevel, streak, xp, badges, caption, showBlossoms = false },
    ref
  ) {
    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <GardenScene
          gardenLevel={gardenLevel}
          height={180}
          showBlossoms={showBlossoms}
        />

        <LinearGradient
          colors={["#0D2B28", "#122820"]}
          style={styles.bottomSection}
        >
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{streak > 0 ? streak : 0}</Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>✨</Text>
              <Text style={styles.statValue}>{xp}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>🏅</Text>
              <Text style={styles.statValue}>{badges}</Text>
              <Text style={styles.statLabel}>badges</Text>
            </View>
          </View>

          {caption.trim().length > 0 && (
            <Text style={styles.caption} numberOfLines={3}>
              {caption.trim()}
            </Text>
          )}

          <Text style={styles.brand}>Career Garden 🌸</Text>
        </LinearGradient>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0D2B28",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statEmoji: {
    fontSize: 20,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#F0EDE5",
    lineHeight: 24,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#8BA99A",
    letterSpacing: 0.2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: "#2A4040",
    marginHorizontal: 4,
  },
  caption: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#D0E8D8",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 2,
  },
  brand: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#5A8A78",
    textAlign: "center",
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
