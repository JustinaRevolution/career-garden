import * as Haptics from "expo-haptics";

export const ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = Haptics.NotificationFeedbackType;

let enabled = true;

export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

export function impact(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
) {
  if (!enabled) return;
  Haptics.impactAsync(style).catch(() => {});
}

export function notify(type: Haptics.NotificationFeedbackType) {
  if (!enabled) return;
  Haptics.notificationAsync(type).catch(() => {});
}
