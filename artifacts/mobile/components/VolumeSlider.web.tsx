import React from "react";

interface VolumeSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  trackColor: string;
  fillColor: string;
  thumbColor: string;
}

export function VolumeSlider({
  value,
  onValueChange,
  trackColor,
  fillColor,
  thumbColor,
}: VolumeSliderProps) {
  return (
    <input
      type="range"
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={(e) => onValueChange(parseFloat(e.target.value))}
      onInput={(e) => onValueChange(parseFloat((e.target as HTMLInputElement).value))}
      style={{
        width: "100%",
        height: 22,
        accentColor: fillColor,
        cursor: "pointer",
      }}
      aria-label="Ambient sound volume"
    />
  );
}
