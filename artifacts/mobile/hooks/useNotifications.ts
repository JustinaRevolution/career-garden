import { useCallback } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const REMINDER_HOUR = 18;
const REMINDER_MINUTE = 0;
const REMINDER_IDENTIFIER = "career-garden-daily-reminder";

export function useNotifications() {
  const isSupported = Platform.OS !== "web";

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    const request = await Notifications.requestPermissionsAsync();
    return request.granted;
  }, [isSupported]);

  const scheduleDailyReminder = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    const granted = await requestPermission();
    if (!granted) return false;

    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: "Your garden is waiting 🌸",
        body: "Tend to your career garden — complete a lesson or daily ritual to keep your streak alive.",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: REMINDER_MINUTE,
      },
    });
    return true;
  }, [isSupported, requestPermission]);

  const cancelDailyReminder = useCallback(async (): Promise<void> => {
    if (!isSupported) return;
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
  }, [isSupported]);

  return { isSupported, requestPermission, scheduleDailyReminder, cancelDailyReminder };
}
