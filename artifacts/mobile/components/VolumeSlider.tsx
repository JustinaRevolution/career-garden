import React, { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

interface VolumeSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  trackColor: string;
  fillColor: string;
  thumbColor: string;
}

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 22;
const HAPTIC_STEPS = 20;

function triggerTick() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function VolumeSlider({
  value,
  onValueChange,
  trackColor,
  fillColor,
  thumbColor,
}: VolumeSliderProps) {
  const width = useSharedValue(0);
  const progress = useSharedValue(value);
  const dragging = useSharedValue(false);
  const lastHapticStep = useSharedValue(Math.round(value * HAPTIC_STEPS));

  useEffect(() => {
    if (!dragging.value) {
      progress.value = value;
      lastHapticStep.value = Math.round(value * HAPTIC_STEPS);
    }
  }, [value, dragging, progress, lastHapticStep]);

  const emit = useCallback(
    (v: number) => {
      onValueChange(Math.round(v * 100) / 100);
    },
    [onValueChange]
  );

  const updateFromX = (x: number) => {
    "worklet";
    const w = width.value;
    if (w <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / w));
    progress.value = ratio;
    const step = Math.round(ratio * HAPTIC_STEPS);
    if (step !== lastHapticStep.value) {
      lastHapticStep.value = step;
      runOnJS(triggerTick)();
    }
    runOnJS(emit)(ratio);
  };

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      dragging.value = true;
      updateFromX(e.x);
    })
    .onUpdate((e) => {
      updateFromX(e.x);
    })
    .onFinalize(() => {
      dragging.value = false;
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: Math.max(0, width.value * progress.value - THUMB_SIZE / 2),
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.wrapper}
        onLayout={(e) => {
          width.value = e.nativeEvent.layout.width;
        }}
        hitSlop={{ top: 12, bottom: 12 }}
      >
        <View style={[styles.track, { backgroundColor: trackColor }]} />
        <Animated.View
          style={[styles.fill, { backgroundColor: fillColor }, fillStyle]}
        />
        <Animated.View
          style={[styles.thumb, { backgroundColor: thumbColor }, thumbStyle]}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: THUMB_SIZE + 8,
    justifyContent: "center",
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    width: "100%",
  },
  fill: {
    position: "absolute",
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
