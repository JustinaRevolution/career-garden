---
name: RN Web custom slider gestures
description: Custom drag sliders (PanResponder or react-native-gesture-handler) placed inside a Modal misbehave on React Native Web / Playwright automation.
---

When building a draggable slider (e.g. volume control) inside a `Modal` in an Expo React Native app that also runs in web mode:

- Both `PanResponder` and `react-native-gesture-handler`'s `Gesture.Pan()` were tried for a custom slider inside a bottom-sheet `Modal`. In the web build, dragging the slider caused the Modal to close unexpectedly (as if the backdrop's dismiss-on-press-outside handler fired), even though the drag stayed visually within the sheet.
- This reproduced consistently under Playwright-driven testing (`runTest`), not just as a one-off flake.
- Root cause wasn't fully isolated (likely a responder/hit-testing conflict between RN's legacy responder system, RNGH's pointer capture, and the Modal's backdrop `TouchableOpacity`), but switching approach fixed it entirely.

**Fix that worked:** render a real native HTML `<input type="range">` for the web platform via a `ComponentName.web.tsx` file (Expo/Metro auto-resolves `.web.tsx` for web builds), and keep the gesture-based implementation in the plain `ComponentName.tsx` for native iOS/Android. This sidesteps the RN Web gesture/responder interaction entirely and is trivially reliable to test with Playwright.

**How to apply:** any time you need a draggable/slider-like custom gesture control inside a `Modal` in a cross-platform Expo app, prefer a `.web.tsx` platform-split with a native `<input type="range">` for web, rather than trying to make PanResponder/gesture-handler behave identically inside a Modal on web.
