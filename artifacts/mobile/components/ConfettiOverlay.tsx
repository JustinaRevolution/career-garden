import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const COLORS = [
  "#F5A54A",
  "#7BC4A0",
  "#E87B9E",
  "#6ECFF6",
  "#F5D06E",
  "#B07CE8",
  "#FF6B6B",
  "#4AD1C8",
];

const PARTICLE_COUNT = 20;

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const slice = (Math.PI * 2) / PARTICLE_COUNT;
  const angle = slice * i - Math.PI / 2;
  const spread = 65 + (i % 5) * 22;
  return {
    destX: Math.cos(angle) * spread,
    destY: Math.sin(angle) * spread * 0.6 - 30,
    fallY: 200 + (i % 4) * 40,
    color: COLORS[i % COLORS.length],
    isCircle: i % 3 === 0,
    delay: (i % 5) * 25,
    rotations: 180 + (i % 4) * 90,
    size: 7 + (i % 3) * 3,
  };
});

function Particle({
  data,
  trigger,
}: {
  data: (typeof PARTICLES)[0];
  trigger: number;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    tx.value = 0;
    ty.value = 0;
    opacity.value = 0;
    rotate.value = 0;

    opacity.value = withDelay(
      data.delay,
      withSequence(
        withTiming(1, { duration: 60 }),
        withDelay(650, withTiming(0, { duration: 380 }))
      )
    );
    tx.value = withDelay(
      data.delay,
      withTiming(data.destX, {
        duration: 950,
        easing: Easing.out(Easing.quad),
      })
    );
    ty.value = withDelay(
      data.delay,
      withSequence(
        withTiming(data.destY, {
          duration: 480,
          easing: Easing.out(Easing.cubic),
        }),
        withTiming(data.destY + data.fallY, {
          duration: 620,
          easing: Easing.in(Easing.quad),
        })
      )
    );
    rotate.value = withDelay(
      data.delay,
      withTiming(data.rotations, { duration: 1100 })
    );
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: data.size,
          height: data.isCircle ? data.size : data.size * 0.6,
          borderRadius: data.isCircle ? data.size / 2 : 2,
          backgroundColor: data.color,
        },
        style,
      ]}
    />
  );
}

interface Props {
  trigger: number;
}

export function ConfettiOverlay({ trigger }: Props) {
  return (
    <View style={styles.container} pointerEvents="none">
      {PARTICLES.map((data, i) => (
        <Particle key={i} data={data} trigger={trigger} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99,
  },
});
