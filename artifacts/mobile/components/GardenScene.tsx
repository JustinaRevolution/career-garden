import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useId, useState } from "react";
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
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { timeOfDay } from "../constants/pondPalette";

function clamp(n: number) {
  return Math.max(0, Math.min(255, n));
}
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function toHex({ r, g, b }: { r: number; g: number; b: number }) {
  return (
    "#" +
    [r, g, b]
      .map((v) => clamp(Math.round(v)).toString(16).padStart(2, "0"))
      .join("")
  );
}
function lighten(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  return toHex({
    r: r + (255 - r) * amt,
    g: g + (255 - g) * amt,
    b: b + (255 - b) * amt,
  });
}
function darken(hex: string, amt: number) {
  const { r, g, b } = hexToRgb(hex);
  return toHex({ r: r * (1 - amt), g: g * (1 - amt), b: b * (1 - amt) });
}
function cleanId(id: string) {
  return id.replace(/[^a-zA-Z0-9]/g, "");
}

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

  return <Animated.View style={[styles.burst, style]} />;
}

function KoiShape({ w, h, color }: { w: number; h: number; color: string }) {
  const id = cleanId(useId());
  const bodyLight = lighten(color, 0.4);
  const bodyDark = darken(color, 0.18);
  const finColor = lighten(color, 0.15);
  return (
    <Svg width={w} height={h} viewBox="0 0 122 54">
      <Defs>
        <SvgLinearGradient id={`koi${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={bodyLight} />
          <Stop offset="0.55" stopColor={color} />
          <Stop offset="1" stopColor={bodyDark} />
        </SvgLinearGradient>
        <RadialGradient id={`sh${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#03100D" stopOpacity={0.4} />
          <Stop offset="0.7" stopColor="#03100D" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#03100D" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {/* soft shadow so the fish reads as floating over the pond floor */}
      <Ellipse cx="74" cy="50" rx="42" ry="4" fill={`url(#sh${id})`} />
      {/* caudal (tail) fin */}
      <Path
        d="M48 27 Q16 5 6 3 Q22 27 6 51 Q16 49 48 27 Z"
        fill={finColor}
        fillOpacity={0.7}
      />
      {/* dorsal fin */}
      <Path d="M66 13 Q78 2 90 11 Q82 18 70 17 Z" fill={finColor} fillOpacity={0.55} />
      {/* pelvic fin */}
      <Path d="M74 36 Q70 53 90 46 Q90 39 82 35 Z" fill={finColor} fillOpacity={0.55} />
      {/* body */}
      <Ellipse cx="74" cy="27" rx="46" ry="17" fill={`url(#koi${id})`} />
      {/* koi patches */}
      <Ellipse cx="94" cy="22" rx="12" ry="8.5" fill="#F7F2E9" fillOpacity={0.92} />
      <Ellipse cx="62" cy="31" rx="8.5" ry="6" fill="#F7F2E9" fillOpacity={0.7} />
      {/* body sheen */}
      <Ellipse cx="72" cy="20" rx="30" ry="5" fill="#FFFFFF" fillOpacity={0.14} />
      {/* eye */}
      <Circle cx="110" cy="25" r="2.8" fill="#1B2A26" />
      <Circle cx="111.2" cy="23.8" r="0.9" fill="#EAF3EE" />
    </Svg>
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

  // viewBox is 122x54 with the koi body spanning ~92x34; scale each axis so
  // the caller's width/height map to the body's bounding box (honoring both).
  const svgW = width * (122 / 92);
  const svgH = height * (54 / 34);

  return (
    <Animated.View style={[{ position: "absolute", left: x, top: y }, style]}>
      <KoiShape w={svgW} h={svgH} color={color} />
    </Animated.View>
  );
}

function LilyPad({
  x,
  y,
  size,
}: {
  x: number;
  y: number;
  size: number;
  color?: string;
}) {
  const id = cleanId(useId());
  const veins = [18, 62, 106, 150, 210, 254, 298, 342];
  return (
    <View style={{ position: "absolute", left: x, top: y, width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <Defs>
          <RadialGradient id={`lp${id}`} cx="40%" cy="32%" r="75%">
            <Stop offset="0" stopColor="#43825A" />
            <Stop offset="0.65" stopColor="#296044" />
            <Stop offset="1" stopColor="#173C2A" />
          </RadialGradient>
        </Defs>
        <Circle cx="20" cy="20" r="18.5" fill={`url(#lp${id})`} />
        {veins.map((a, i) => {
          const r = (a * Math.PI) / 180;
          return (
            <Line
              key={i}
              x1="20"
              y1="20"
              x2={20 + 16 * Math.cos(r)}
              y2={20 + 16 * Math.sin(r)}
              stroke="#173C2A"
              strokeWidth="0.7"
              strokeOpacity={0.6}
            />
          );
        })}
        <Circle
          cx="20"
          cy="20"
          r="18.5"
          fill="none"
          stroke="#123020"
          strokeWidth="1"
          strokeOpacity={0.55}
        />
        <Ellipse cx="15" cy="13" rx="7" ry="4" fill="#FFFFFF" fillOpacity={0.08} />
      </Svg>
    </View>
  );
}

function LotusFlower({ x, y, staticMode = false }: { x: number; y: number; staticMode?: boolean }) {
  const id = cleanId(useId());
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

  const outer = [0, 45, 90, 135, 180, 225, 270, 315];
  const inner = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  const stamen = [0, 60, 120, 180, 240, 300];

  return (
    <Animated.View style={[{ position: "absolute", left: x - 28, top: y - 28 }, style]}>
      <Svg width={56} height={56} viewBox="0 0 56 56">
        <Defs>
          <SvgLinearGradient id={`po${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F7BBD3" />
            <Stop offset="1" stopColor="#D96A93" />
          </SvgLinearGradient>
          <SvgLinearGradient id={`pi${id}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FCD5E3" />
            <Stop offset="1" stopColor="#EE93B4" />
          </SvgLinearGradient>
          <RadialGradient id={`lc${id}`} cx="50%" cy="45%" r="55%">
            <Stop offset="0" stopColor="#FFF3C0" />
            <Stop offset="1" stopColor="#F2C24E" />
          </RadialGradient>
        </Defs>
        {outer.map((a, i) => (
          <Path
            key={`o${i}`}
            d="M28 28 Q21 12 28 3 Q35 12 28 28 Z"
            fill={`url(#po${id})`}
            fillOpacity={0.92}
            transform={`rotate(${a} 28 28)`}
          />
        ))}
        {inner.map((a, i) => (
          <Path
            key={`i${i}`}
            d="M28 28 Q24 17 28 10 Q32 17 28 28 Z"
            fill={`url(#pi${id})`}
            transform={`rotate(${a} 28 28)`}
          />
        ))}
        <Circle cx="28" cy="28" r="6.5" fill={`url(#lc${id})`} />
        {stamen.map((a, i) => {
          const r = (a * Math.PI) / 180;
          return (
            <Circle
              key={`s${i}`}
              cx={28 + 3.6 * Math.cos(r)}
              cy={28 + 3.6 * Math.sin(r)}
              r="0.9"
              fill="#C9962E"
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
}

function StoneLantern({ x, y, staticMode = false }: { x: number; y: number; staticMode?: boolean }) {
  const id = cleanId(useId());
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
    <View style={{ position: "absolute", left: x, top: y, width: 26, alignItems: "center" }}>
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", top: 8, left: -14, width: 54, height: 54 }, glowStyle]}
      >
        <Svg width={54} height={54} viewBox="0 0 54 54">
          <Defs>
            <RadialGradient id={`gh${id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor="#FFCB7A" stopOpacity={0.9} />
              <Stop offset="0.55" stopColor="#F5A54A" stopOpacity={0.35} />
              <Stop offset="1" stopColor="#F5A54A" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="27" cy="27" r="27" fill={`url(#gh${id})`} />
        </Svg>
      </Animated.View>
      <View style={{ width: 18, height: 6, backgroundColor: "#6A6157", borderRadius: 2 }} />
      <View
        style={{
          width: 15,
          height: 20,
          backgroundColor: "#544C43",
          borderRadius: 3,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={[
            { width: 8, height: 12, backgroundColor: "#FFD07A", borderRadius: 4 },
            glowStyle,
          ]}
        />
      </View>
      <View style={{ width: 22, height: 5, backgroundColor: "#6A6157", borderRadius: 2 }} />
      <View style={{ width: 10, height: 8, backgroundColor: "#544C43", borderRadius: 1 }} />
    </View>
  );
}

function BlossomPetal() {
  return (
    <Svg width={12} height={11} viewBox="0 0 12 11">
      <Path
        d="M6 0 C9 2.5 9.5 7 6 11 C2.5 7 3 2.5 6 0 Z"
        fill="#F7BDD4"
        fillOpacity={0.95}
      />
      <Path
        d="M6 1.5 C7.4 4 7.4 7.5 6 10"
        stroke="#E58FB2"
        strokeWidth="0.5"
        fill="none"
      />
    </Svg>
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
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.82, { duration: 500 }),
          withTiming(0.82, { duration: duration - 900 }),
          withTiming(0, { duration: 400 })
        ),
        -1,
        false
      )
    );
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
      style={[{ position: "absolute", top: 0, left: startX, width: 12, height: 11 }, style]}
    >
      <BlossomPetal />
    </Animated.View>
  );
}

function BambooStalk({ x, height, color }: { x: number; height: number; color: string }) {
  const segmentCount = Math.floor(height / 16);
  const light = lighten(color, 0.18);
  return (
    <View style={{ position: "absolute", left: x, top: 0 }}>
      {Array.from({ length: segmentCount }).map((_, i) => (
        <View key={i}>
          <View
            style={{
              width: 8,
              height: 14,
              backgroundColor: color,
              borderRadius: 1,
              borderLeftWidth: 2,
              borderLeftColor: light,
            }}
          />
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

function WaterDepth({ poolColor, poolMid }: { poolColor: string; poolMid: string }) {
  const id = cleanId(useId());
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <RadialGradient id={`pool${id}`} cx="50%" cy="26%" r="72%">
          <Stop offset="0" stopColor={poolColor} stopOpacity={0.6} />
          <Stop offset="0.6" stopColor={poolMid} stopOpacity={0.25} />
          <Stop offset="1" stopColor={poolColor} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`vig${id}`} cx="50%" cy="52%" r="78%">
          <Stop offset="0.58" stopColor="#000000" stopOpacity={0} />
          <Stop offset="1" stopColor="#020A09" stopOpacity={0.4} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#pool${id})`} />
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#vig${id})`} />
    </Svg>
  );
}

function Caustic({
  x,
  y,
  w,
  h,
  dx,
  dy,
  delay,
  color,
  staticMode = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  delay: number;
  color: string;
  staticMode?: boolean;
}) {
  const id = cleanId(useId());
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const op = useSharedValue(staticMode ? 0.09 : 0.05);

  useEffect(() => {
    if (staticMode) return;
    tx.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(dx, { duration: 6500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 6500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(dy, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    op.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.16, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.04, { duration: 3500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    opacity: op.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: "absolute", left: x, top: y }, style]}
    >
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id={`ca${id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={0.9} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} fill={`url(#ca${id})`} />
      </Svg>
    </Animated.View>
  );
}

function Caustics({
  color,
  scale = 1,
  staticMode = false,
}: {
  color: string;
  scale?: number;
  staticMode?: boolean;
}) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Caustic x={30 * scale} y={30} w={150 * scale} h={72} dx={26} dy={16} delay={0} color={color} staticMode={staticMode} />
      <Caustic x={175 * scale} y={110} w={170 * scale} h={82} dx={-30} dy={-18} delay={1500} color={color} staticMode={staticMode} />
      <Caustic x={85 * scale} y={150} w={130 * scale} h={62} dx={22} dy={-14} delay={3000} color={color} staticMode={staticMode} />
    </View>
  );
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

// Horizontal coordinate space the scene positions are authored against. The
// pond stretches to fill its container width, so we scale x-positions by the
// measured width / this baseline to keep koi and decor spread across the whole
// pond instead of clustering into a left-hand rectangle on wider screens.
const DESIGN_W = 330;

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
    const pal = timeOfDay(gardenLevel);
    const [measuredW, setMeasuredW] = useState(0);
    const scale = measuredW > 0 ? measuredW / DESIGN_W : 1;
    const sx = (v: number) => v * scale;
    return (
      <View
        ref={ref}
        style={[styles.container, { height }]}
        onLayout={(e) => setMeasuredW(e.nativeEvent.layout.width)}
      >
        <LinearGradient
          colors={pal.grad}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        <WaterDepth poolColor={pal.poolInner} poolMid={pal.poolMid} />

        <Caustics color={pal.caustic} scale={scale} staticMode={staticMode} />

        <View style={StyleSheet.absoluteFill}>
          <WaterRipple x={sx(90)} y={120} size={80} delay={0} color={pal.ripple} staticMode={staticMode} staticScale={0.95} staticOpacity={0.6} />
          <WaterRipple x={sx(230)} y={80} size={70} delay={1200} color={pal.ripple} staticMode={staticMode} staticScale={0.6} staticOpacity={0.68} />
          <WaterRipple x={sx(160)} y={170} size={90} delay={2400} color={pal.ripple} staticMode={staticMode} staticScale={0.4} staticOpacity={0.72} />
        </View>

        {!staticMode && (
          <View style={[StyleSheet.absoluteFill, styles.burstCenter]}>
            <BurstRipple trigger={burstTrigger} />
          </View>
        )}

        <FadeInView visible={gardenLevel >= 2} delay={200} staticMode={staticMode}>
          <LilyPad x={sx(50)} y={55} size={32} />
          <LilyPad x={sx(250)} y={45} size={28} />
          <LilyPad x={sx(75)} y={155} size={30} />
          <LilyPad x={sx(280)} y={165} size={26} />
        </FadeInView>

        <FadeInView visible={gardenLevel >= 2} delay={600} staticMode={staticMode}>
          <KoiFish x={sx(80)} y={90} color={koiColor} delay={300} width={46} height={18} staticMode={staticMode} />
        </FadeInView>

        <FadeInView visible={gardenLevel >= 3} delay={400} staticMode={staticMode}>
          <LotusFlower x={sx(195)} y={95} staticMode={staticMode} />
        </FadeInView>

        <FadeInView visible={gardenLevel >= 4} delay={200} staticMode={staticMode}>
          <StoneLantern x={sx(170)} y={26} staticMode={staticMode} />
        </FadeInView>

        <FadeInView visible={gardenLevel >= 5} delay={800} staticMode={staticMode}>
          <KoiFish x={sx(190)} y={145} color="#E0D8CC" delay={1500} width={36} height={14} staticMode={staticMode} />
        </FadeInView>

        <FadeInView visible={gardenLevel >= 6} delay={0} staticMode={staticMode}>
          <LilyPad x={sx(130)} y={40} size={24} />
          <LilyPad x={sx(200)} y={170} size={30} />
        </FadeInView>

        <FadeInView visible={gardenLevel >= 7} delay={300} staticMode={staticMode}>
          <BambooStalk x={sx(10)} height={height} color="#3A6A2A" />
          <BambooStalk x={sx(24)} height={height * 0.75} color="#2E5820" />
          <BambooStalk x={sx(300)} height={height} color="#3A6A2A" />
          <BambooStalk x={sx(316)} height={height * 0.6} color="#2E5820" />
        </FadeInView>

        {bonusCount > 0 && (
          <FadeInView visible={true} delay={400} staticMode={staticMode}>
            {BONUS_KOI_SPOTS.slice(0, bonusCount).map((spot, i) => (
              <KoiFish
                key={`bonus-${i}`}
                x={sx(spot.x)}
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
          <CherryBlossomPetal startX={sx(35)} delay={0} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[0]} />
          <CherryBlossomPetal startX={sx(90)} delay={900} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[1]} />
          <CherryBlossomPetal startX={sx(150)} delay={1800} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[2]} />
          <CherryBlossomPetal startX={sx(210)} delay={500} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[3]} />
          <CherryBlossomPetal startX={sx(265)} delay={1400} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[4]} />
          <CherryBlossomPetal startX={sx(310)} delay={2200} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[5]} />
          <CherryBlossomPetal startX={sx(65)} delay={2700} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[6]} />
          <CherryBlossomPetal startX={sx(185)} delay={3200} gardenHeight={height} staticMode={staticMode} staticFraction={BLOSSOM_FRACTIONS[7]} />
        </FadeInView>

        <View pointerEvents="none" style={styles.rim} />
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
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
});
