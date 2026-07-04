import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

function WaterRipple({
  x,
  y,
  size,
  delay,
  color,
  staticMode = false,
  staticScale = 0.5,
  staticOpacity = 0.28,
}: {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
  staticMode?: boolean;
  staticScale?: number;
  staticOpacity?: number;
}) {
  const scale = useSharedValue(staticMode ? staticScale : 0.2);
  const opacity = useSharedValue(staticMode ? staticOpacity : 0.5);

  useEffect(() => {
    if (staticMode) return;
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 3500, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(0, { duration: 3500 }), -1, false)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.ripple,
        {
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
        style,
      ]}
    />
  );
}

function BurstRipple({ trigger }: { trigger: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    scale.value = 0.1;
    opacity.value = 0.9;
    scale.value = withTiming(1.8, { duration: 900, easing: Easing.out(Easing.ease) });
    opacity.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(0, { duration: 800 })
    );
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.burst,
        style,
      ]}
    />
  );
}

function KoiFish({
  x,
  y,
  color,
  delay,
  width = 44,
  height = 18,
  staticMode = false,
}: {
  x: number;
  y: number;
  color: string;
  delay: number;
  width?: number;
  height?: number;
  staticMode?: boolean;
}) {
  const tx = useSharedValue(staticMode ? 12 : 0);
  const ty = useSharedValue(staticMode ? 6 : 0);
  const flipX = useSharedValue(1);

  useEffect(() => {
    if (staticMode) return;
    tx.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(35, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
          withTiming(-35, { duration: 4200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(18, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
          withTiming(-18, { duration: 2800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    flipX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 4200 }),
          withTiming(-1, { duration: 100 }),
          withTiming(-1, { duration: 4200 }),
          withTiming(1, { duration: 100 })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scaleX: flipX.value },
    ],
  }));

  return (
    <Animated.View style={[{ position: "absolute", left: x, top: y }, style]}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: 0,
            height: 0,
            borderTopWidth: height / 2 - 2,
            borderBottomWidth: height / 2 - 2,
            borderRightWidth: 10,
            borderTopColor: "transparent",
            borderBottomColor: "transparent",
            borderRightColor: color + "BB",
          }}
        />
        <View
          style={{
            width,
            height,
            borderRadius: height / 2,
            backgroundColor: color,
          }}
        />
      </View>
    </Animated.View>
  );
}

function LilyPad({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <View
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.85,
      }}
    />
  );
}

function LotusFlower({ x, y, staticMode = false }: { x: number; y: number; staticMode?: boolean }) {
  const pulse = useSharedValue(staticMode ? 1.03 : 1);

  useEffect(() => {
    if (staticMode) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.97, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const petalAngles = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <Animated.View style={[{ position: "absolute", left: x - 18, top: y - 18 }, style]}>
      <View style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}>
        {petalAngles.map((angle, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              width: 14,
              height: 18,
              borderRadius: 7,
              backgroundColor: "#E87B9E",
              opacity: 0.85,
              transform: [{ rotate: `${angle}deg` }, { translateY: -10 }],
            }}
          />
        ))}
        <View
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor: "#F5D06E",
            zIndex: 1,
          }}
        />
      </View>
    </Animated.View>
  );
}

function StoneLantern({ x, y, staticMode = false }: { x: number; y: number; staticMode?: boolean }) {
  const glow = useSharedValue(staticMode ? 0.85 : 0.6);

  useEffect(() => {
    if (staticMode) return;
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  return (
    <View style={{ position: "absolute", left: x, top: y, alignItems: "center" }}>
      <View style={{ width: 18, height: 6, backgroundColor: "#5A5A5A", borderRadius: 2 }} />
      <View
        style={{
          width: 14,
          height: 20,
          backgroundColor: "#4A4A4A",
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={[
            { width: 8, height: 12, backgroundColor: "#F5A54A", borderRadius: 4, opacity: 0.9 },
            glowStyle,
          ]}
        />
      </View>
      <View style={{ width: 22, height: 5, backgroundColor: "#5A5A5A", borderRadius: 2 }} />
      <View style={{ width: 10, height: 8, backgroundColor: "#4A4A4A", borderRadius: 1 }} />
    </View>
  );
}

function CherryBlossomPetal({
  startX,
  delay,
  gardenHeight,
  staticMode = false,
  staticFraction = 0.4,
}: {
  startX: number;
  delay: number;
  gardenHeight: number;
  staticMode?: boolean;
  staticFraction?: number;
}) {
  const staticTy = gardenHeight * staticFraction;
  const ty = useSharedValue(staticMode ? staticTy : -16);
  const swayX = useSharedValue(staticMode ? 6 : 0);
  const rotate = useSharedValue(staticMode ? 45 : 0);
  const opacity = useSharedValue(staticMode ? 0.82 : 0);

  useEffect(() => {
    if (staticMode) return;
    const duration = 4800 + (delay % 1800);
    ty.value = withDelay(
      delay,
      withRepeat(
        withTiming(gardenHeight + 20, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    swayX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(14, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
          withTiming(-14, { duration: 1600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 3600 }), -1, false)
    );
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0.82, { duration: 500 }),
        withTiming(0.82, { duration: duration - 900 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      false
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: swayX.value },
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
          top: 0,
          left: startX,
          width: 10,
          height: 8,
          borderRadius: 5,
          backgroundColor: "#F2B0CC",
        },
        style,
      ]}
    />
  );
}

function BambooStalk({ x, height, color }: { x: number; height: number; color: string }) {
  const segmentCount = Math.floor(height / 16);
  return (
    <View style={{ position: "absolute", left: x, top: 0 }}>
      {Array.from({ length: segmentCount }).map((_, i) => (
        <View key={i}>
          <View style={{ width: 8, height: 14, backgroundColor: color, borderRadius: 1 }} />
          <View style={{ width: 8, height: 2, backgroundColor: "#2A5020", borderRadius: 1 }} />
        </View>
      ))}
      <View
        style={{
          position: "absolute",
          top: 20,
          left: 8,
          width: 16,
          height: 6,
          backgroundColor: color,
          borderRadius: 3,
          opacity: 0.7,
          transform: [{ rotate: "-30deg" }],
        }}
      />
    </View>
  );
}

function FadeInView({
  visible,
  children,
  delay = 0,
  staticMode = false,
}: {
  visible: boolean;
  children: React.ReactNode;
  delay?: number;
  staticMode?: boolean;
}) {
  const opacity = useSharedValue(staticMode ? (visible ? 1 : 0) : visible ? 1 : 0);

  useEffect(() => {
    if (staticMode) return;
    if (visible) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 1000 }));
    }
  }, [visible]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (staticMode) {
    if (!visible) return null;
    return <View style={StyleSheet.absoluteFill}>{children}</View>;
  }

  return <Animated.View style={[StyleSheet.absoluteFill, style]}>{children}</Animated.View>;
}

const BONUS_KOI_SPOTS = [
  { x: 120, y: 70, delay: 600, width: 30, height: 12 },
  { x: 250, y: 120, delay: 1100, width: 32, height: 13 },
  { x: 60, y: 130, delay: 1700, width: 28, height: 11 },
  { x: 215, y: 60, delay: 2200, width: 30, height: 12 },
  { x: 150, y: 160, delay: 2700, width: 34, height: 13 },
  { x: 95, y: 50, delay: 3100, width: 26, height: 11 },
];

const BLOSSOM_FRACTIONS = [0.55, 0.35, 0.7, 0.25, 0.45, 0.6, 0.3, 0.5];

interface Props {
  gardenLevel: number;
  height?: number;
  burstTrigger?: number;
  showBlossoms?: boolean;
  koiColor?: string;
  bonusKoi?: number;
  staticMode?: boolean;
}

export const GardenScene = React.forwardRef<View, Props>(
  function GardenScene(
    {
      gardenLevel,
      height = 220,
      burstTrigger = 0,
      showBlossoms = false,
      koiColor = "#F5A54A",
      bonusKoi = 0,
      staticMode = false,
    },
    ref
  ) {
  const bonusKoiColors = ["#E0D8CC", "#7BC4A0", "#E8896E", "#A77BC4", "#7BAAC4", "#F5D06E"];
  const bonusCount = Math.min(bonusKoi, BONUS_KOI_SPOTS.length);
  return (
    <View ref={ref} style={[styles.container, { height }]}>
      <LinearGradient
        colors={["#0D2B28", "#0A1E1C", "#0D3535"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={StyleSheet.absoluteFill}>
        <WaterRipple x={90} y={120} size={80} delay={0} color="#2A6060" staticMode={staticMode} staticScale={0.95} staticOpacity={0.6} />
        <WaterRipple x={230} y={80} size={70} delay={1200} color="#2A6060" staticMode={staticMode} staticScale={0.6} staticOpacity={0.68} />
        <WaterRipple x={160} y={170} size={90} delay={2400} color="#2A6060" staticMode={staticMode} staticScale={0.4} staticOpacity={0.72} />
      </View>

      {!staticMode && (
        <View style={[StyleSheet.absoluteFill, styles.burstCenter]}>
          <BurstRipple trigger={burstTrigger} />
        </View>
      )}

      <FadeInView visible={gardenLevel >= 2} delay={200} staticMode={staticMode}>
        <LilyPad x={50} y={55} size={32} color="#2A5A3A" />
        <LilyPad x={250} y={45} size={28} color="#2A5A3A" />
        <LilyPad x={75} y={155} size={30} color="#264D34" />
        <LilyPad x={280} y={165} size={26} color="#2A5A3A" />
      </FadeInView>

      <FadeInView visible={gardenLevel >= 2} delay={600} staticMode={staticMode}>
        <KoiFish x={80} y={90} color={koiColor} delay={300} width={46} height={18} staticMode={staticMode} />
      </FadeInView>

      <FadeInView visible={gardenLevel >= 3} delay={400} staticMode={staticMode}>
        <LotusFlower x={195} y={95} staticMode={staticMode} />
      </FadeInView>

      <FadeInView visible={gardenLevel >= 4} delay={200} staticMode={staticMode}>
        <StoneLantern x={170} y={30} staticMode={staticMode} />
      </FadeInView>

      <FadeInView visible={gardenLevel >= 5} delay={800} staticMode={staticMode}>
        <KoiFish x={190} y={145} color="#E0D8CC" delay={1500} width={36} height={14} staticMode={staticMode} />
      </FadeInView>

      <FadeInView visible={gardenLevel >= 6} delay={0} staticMode={staticMode}>
        <LilyPad x={130} y={40} size={24} color="#2A5A3A" />
        <LilyPad x={200} y={170} size={30} color="#264D34" />
      </FadeInView>

      <FadeInView visible={gardenLevel >= 7} delay={300} staticMode={staticMode}>
        <BambooStalk x={10} height={height} color="#3A6A2A" />
        <BambooStalk x={24} height={height * 0.75} color="#2E5820" />
        <BambooStalk x={300} height={height} color="#3A6A2A" />
        <BambooStalk x={316} height={height * 0.6} color="#2E5820" />
      </FadeInView>

      {bonusCount > 0 && (
        <FadeInView visible={true} delay={400} staticMode={staticMode}>
          {BONUS_KOI_SPOTS.slice(0, bonusCount).map((spot, i) => (
            <KoiFish
              key={`bonus-${i}`}
              x={spot.x}
              y={spot.y}
              color={bonusKoiColors[i % bonusKoiColors.length]}
              delay={spot.delay}
              width={spot.width}
              height={spot.height}
              staticMode={staticMode}
            />
          ))}
        </FadeInView>
      )}

      <FadeInView visible={showBlossoms} delay={0} staticMode={staticMode}>
        <CherryBlossomPetal startX={35} delay={0} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[0]} />
        <CherryBlossomPetal startX={90} delay={900} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[1]} />
        <CherryBlossomPetal startX={150} delay={1800} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[2]} />
        <CherryBlossomPetal startX={210} delay={500} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[3]} />
        <CherryBlossomPetal startX={265} delay={1400} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[4]} />
        <CherryBlossomPetal startX={310} delay={2200} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[5]} />
        <CherryBlossomPetal startX={65} delay={2700} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[6]} />
        <CherryBlossomPetal startX={185} delay={3200} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[7]} />
      </FadeInView>
    </View>
  );
}
);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
    borderRadius: 20,
  },
  ripple: {
    position: "absolute",
    borderWidth: 1.5,
  },
  burstCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  burst: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#7BC4A0",
  },
});
