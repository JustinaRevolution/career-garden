import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { GardenScene } from "@/components/GardenScene";

export type CardVariant = "garden" | "streak" | "xp";

export const CARD_VARIANTS: { key: CardVariant; label: string }[] = [
  { key: "garden", label: "Garden" },
  { key: "streak", label: "Streak" },
  { key: "xp", label: "XP" },
];

interface VariantStyle {
  gradient: [string, string];
  accent: string;
  brand: string;
}

const VARIANT_STYLES: Record<CardVariant, VariantStyle> = {
  garden: { gradient: ["#0D2B28", "#122820"], accent: "#F0EDE5", brand: "#5A8A78" },
  streak: { gradient: ["#2B1810", "#241009"], accent: "#F5A54A", brand: "#C67B3E" },
  xp: { gradient: ["#1A1526", "#231A2E"], accent: "#E8C766", brand: "#9A7BC4" },
};

interface SharePreviewCardProps {
  gardenLevel: number;
  streak: number;
  xp: number;
  badges: number;
  caption: string;
  showBlossoms?: boolean;
  bonusKoi?: number;
  variant?: CardVariant;
}

const BASE_WIDTH = 375;
const BASE_GARDEN_HEIGHT = 180;
const MIN_GARDEN_HEIGHT = 130;
const MAX_GARDEN_HEIGHT = 240;

export const SharePreviewCard = React.forwardRef<View, SharePreviewCardProps>(
  function SharePreviewCard(
    {
      gardenLevel,
      streak,
      xp,
      badges,
      caption,
      showBlossoms = false,
      bonusKoi = 0,
      variant = "garden",
    },
    ref
  ) {
    const { width: screenWidth } = useWindowDimensions();

    const cardWidth = Math.min(screenWidth - 32, 480);
    const scale = cardWidth / BASE_WIDTH;
    const gardenHeight = Math.round(
      Math.min(MAX_GARDEN_HEIGHT, Math.max(MIN_GARDEN_HEIGHT, BASE_GARDEN_HEIGHT * scale))
    );

    const scaledFontSize = (base: number) =>
      Math.round(Math.min(base * 1.15, Math.max(base * 0.85, base * scale)));

    const vs = VARIANT_STYLES[variant];
    const streakValue = streak > 0 ? streak : 0;

    const streakChip = (
      <View style={styles.statChip} key="streak">
        <Text style={[styles.statEmoji, { fontSize: scaledFontSize(20) }]}>🔥</Text>
        <Text style={[styles.statValue, { fontSize: scaledFontSize(20) }]}>{streakValue}</Text>
        <Text style={[styles.statLabel, { fontSize: scaledFontSize(11) }]}>day streak</Text>
      </View>
    );

    const xpChip = (
      <View style={styles.statChip} key="xp">
        <Text style={[styles.statEmoji, { fontSize: scaledFontSize(20) }]}>✨</Text>
        <Text
          style={[styles.statValue, { fontSize: scaledFontSize(20) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {xp}
        </Text>
        <Text style={[styles.statLabel, { fontSize: scaledFontSize(11) }]}>XP</Text>
      </View>
    );

    const badgesChip = (
      <View style={styles.statChip} key="badges">
        <Text style={[styles.statEmoji, { fontSize: scaledFontSize(20) }]}>🏅</Text>
        <Text style={[styles.statValue, { fontSize: scaledFontSize(20) }]}>{badges}</Text>
        <Text style={[styles.statLabel, { fontSize: scaledFontSize(11) }]}>badges</Text>
      </View>
    );

    const divider = (k: string) => <View style={styles.divider} key={`div-${k}`} />;

    const renderStatsRow = (chips: React.ReactNode[]) => {
      const withDividers: React.ReactNode[] = [];
      chips.forEach((chip, i) => {
        if (i > 0) withDividers.push(divider(String(i)));
        withDividers.push(chip);
      });
      return <View style={styles.statsRow}>{withDividers}</View>;
    };

    const renderHero = (
      emoji: string,
      value: string | number,
      label: string,
      secondary: React.ReactNode[]
    ) => (
      <>
        <View style={styles.hero}>
          <Text style={[styles.heroEmoji, { fontSize: scaledFontSize(40) }]}>{emoji}</Text>
          <Text
            style={[styles.heroValue, { color: vs.accent, fontSize: scaledFontSize(52) }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            {value}
          </Text>
          <Text style={[styles.heroLabel, { fontSize: scaledFontSize(13) }]}>{label}</Text>
        </View>
        {renderStatsRow(secondary)}
      </>
    );

    return (
      <View ref={ref} style={styles.card} collapsable={false}>
        <GardenScene
          gardenLevel={gardenLevel}
          height={gardenHeight}
          showBlossoms={showBlossoms}
          bonusKoi={bonusKoi}
          staticMode
        />

        <LinearGradient colors={vs.gradient} style={styles.bottomSection}>
          {variant === "garden" && renderStatsRow([streakChip, xpChip, badgesChip])}
          {variant === "streak" &&
            renderHero("🔥", streakValue, "day streak", [xpChip, badgesChip])}
          {variant === "xp" && renderHero("✨", xp, "total XP", [streakChip, badgesChip])}

          {caption.trim().length > 0 && (
            <Text
              style={[styles.caption, { fontSize: scaledFontSize(14) }]}
              numberOfLines={3}
            >
              {caption.trim()}
            </Text>
          )}

          <Text style={[styles.brand, { color: vs.brand, fontSize: scaledFontSize(12) }]}>
            Career Garden 🌸
          </Text>
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
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    minWidth: 0,
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
    textAlign: "center",
    flexShrink: 1,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: "#2A4040",
    marginHorizontal: 4,
    flexShrink: 0,
  },
  hero: {
    alignItems: "center",
    gap: 0,
    marginBottom: 4,
  },
  heroEmoji: {
    fontSize: 40,
  },
  heroValue: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    lineHeight: 58,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8BA99A",
    letterSpacing: 0.5,
    textTransform: "uppercase",
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
