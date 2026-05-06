import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { Badge } from "@/data/content";

interface Props {
  badge: Badge;
  earned: boolean;
}

export function BadgeItem({ badge, earned }: Props) {
  const colors = useColors();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: earned ? colors.card : colors.muted,
          borderColor: earned ? badge.color + "44" : colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: earned ? badge.color + "22" : colors.muted,
          },
        ]}
      >
        <Ionicons
          name={badge.icon as any}
          size={28}
          color={earned ? badge.color : colors.mutedForeground}
        />
        {!earned && (
          <View style={[styles.lockOverlay, { backgroundColor: colors.muted + "CC" }]}>
            <Ionicons name="lock-closed" size={14} color={colors.mutedForeground} />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.name,
          { color: earned ? colors.foreground : colors.mutedForeground },
        ]}
        numberOfLines={1}
      >
        {badge.title}
      </Text>
      <Text
        style={[styles.desc, { color: colors.mutedForeground }]}
        numberOfLines={2}
      >
        {badge.description}
      </Text>
      {earned && (
        <View style={[styles.xpBadge, { backgroundColor: badge.color + "22" }]}>
          <Text style={[styles.xpText, { color: badge.color }]}>+{badge.xpReward} XP</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 5,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    minHeight: 150,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lockOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  desc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 2,
  },
  xpText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
