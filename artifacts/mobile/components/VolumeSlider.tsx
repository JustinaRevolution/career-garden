import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

interface VolumeSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  trackColor: string;
  fillColor: string;
  thumbColor: string;
}

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 22;

export function VolumeSlider({
  value,
  onValueChange,
  trackColor,
  fillColor,
  thumbColor,
}: VolumeSliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const updateFromX = useCallback(
    (x: number) => {
      const w = widthRef.current;
      if (w <= 0) return;
      const ratio = Math.min(1, Math.max(0, x / w));
      onValueChange(Math.round(ratio * 100) / 100);
    },
    [onValueChange]
  );

  const gesture = Gesture.Pan()
    .onBegin((e) => {
      runOnJS(updateFromX)(e.x);
    })
    .onUpdate((e) => {
      runOnJS(updateFromX)(e.x);
    })
    .minDistance(0);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.wrapper}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        hitSlop={{ top: 12, bottom: 12 }}
      >
        <View style={[styles.track, { backgroundColor: trackColor }]} />
        <View
          style={[
            styles.fill,
            { backgroundColor: fillColor, width: `${value * 100}%` },
          ]}
        />
        <View
          style={[
            styles.thumb,
            {
              backgroundColor: thumbColor,
              left: Math.max(0, width * value - THUMB_SIZE / 2),
            },
          ]}
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
