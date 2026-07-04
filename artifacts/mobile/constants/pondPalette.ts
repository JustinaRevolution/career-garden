export interface Palette {
  grad: [string, string, string];
  poolInner: string;
  poolMid: string;
  ripple: string;
  caustic: string;
}

// The pond eases from a misty dawn through bright day to a violet dusk as the
// garden matures with the user's level.
export function timeOfDay(level: number): Palette {
  if (level <= 2) {
    // dawn — soft, warm, misty
    return {
      grad: ["#16403C", "#0D2A28", "#243838"],
      poolInner: "#5FA9A6",
      poolMid: "#2E6E66",
      ripple: "#54A79E",
      caustic: "#F0DAB4",
    };
  }
  if (level <= 5) {
    // day — bright teal
    return {
      grad: ["#0E3733", "#0A211F", "#093A38"],
      poolInner: "#1E5450",
      poolMid: "#0F3330",
      ripple: "#3A8A84",
      caustic: "#CFEFE8",
    };
  }
  // dusk — deep indigo/violet
  return {
    grad: ["#183044", "#0C1826", "#2A2242"],
    poolInner: "#3C4E82",
    poolMid: "#1C2440",
    ripple: "#5A6AA6",
    caustic: "#C6C8F0",
  };
}
