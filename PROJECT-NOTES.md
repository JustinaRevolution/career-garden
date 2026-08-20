# Career Garden — Known Issues & Test Notes

*Living note for the Career Garden project. Add findings from device tests, notes on platform limitations, and decisions.*

## Notifications (2026-08-20)
- **Status: NOT a code bug — Expo Go platform limitation.**
- Clayton tested on Android Expo Go: notifications don't work.
- Verified: expo-notifications ~0.32.17 is the CORRECT version for SDK 54 (matches bundledNativeModules.json). It was NOT removed in SDK 53 — that report was a misunderstanding.
- Real cause: expo-notifications has limited support in the Expo Go client (especially remote push; local scheduling can also be restricted). Notifications need a **development build** (expo prebuild + native build) or a **production build** to fully work.
- Fix path: resolved when we do the EAS/dev-build step (part of the release path). The code itself is correct (useNotifications.ts handles permission request + daily scheduling).
- Justina explained this to Clayton. No code change needed.

## Clayton's Real-Device Test (2026-08-20) — COMPLETE
- ✅ Onboarding, lessons, quizzes, daily rituals, XP, streaks, badges, power-ups, shop (non-Koi), garden, share, layout on his phone
- ✅ Volume slider drag (after GestureHandlerRootView fix)
- ❌ Notifications — Expo Go limitation (see above), needs dev build; explained to Clayton

## Fixed (2026-08-20, all in main)
- Audio inaudible → DEFAULT_VOLUME 0.25→0.75 (ac97c69)
- expo-av 15.0.2 crash on device → ~16.0.8 (c10188c)
- Web Koi purchase dead → confirmAsync web-safe dialog (c10188c)
- Lesson pagination on web → onScroll fix
- Responsive layout → useWindowDimensions (e8c790e)
- Native volume slider dead on Android → GestureHandlerRootView nested inside the Modal (aad144e) — CONFIRMED WORKING by Clayton
- UFW firewall blocking LAN dev-server access → allow rule (dev infra, not app)
- pnpm store-dir mismatch → .npmrc fix (ERR_PNPM_UNEXPECTED_STORE)

## Testing Notes
- Clayton tests on Android via Expo Go: exp://192.168.1.68:8081 (LAN, same WiFi, UFW rule added for 192.168.1.0/24 port 8081)
- Web dev: localhost:8081 (host) / 8082 (Docker sandbox)
- Expo Go cannot fully test: notifications (needs dev build), and native-module behavior in general
