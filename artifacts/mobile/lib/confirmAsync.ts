import { Alert, Platform } from "react-native";

/**
 * Cross-platform confirm dialog.
 *
 * React Native's `Alert.alert` with action buttons is NOT implemented on
 * react-native-web — on web, calling it with a button array silently does
 * nothing, so any purchase/confirmation flow built on it appears dead.
 * This helper uses `window.confirm` on web (native browser dialog, works
 * everywhere) and the native Alert on iOS/Android.
 *
 * Returns a Promise<boolean>: true when the user confirmed, false otherwise.
 */
export function confirmAsync(
  title: string,
  message?: string,
  confirmLabel = "OK",
  cancelLabel = "Cancel"
): Promise<boolean> {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    // window.confirm only supports a single message string; fold title in.
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(window.confirm(text));
  }
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
        {
          text: confirmLabel,
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    );
  });
}
