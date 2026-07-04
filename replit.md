# Career Garden

A gamified Expo mobile app that teaches effective US job searching in 2026. Inspired by Zen Koi — users grow an animated koi pond garden as they complete learning modules, earn XP/badges, and check off daily ritual actions.

## Run & Operate

```bash
pnpm --filter @workspace/mobile dev   # Start Expo dev server
```

No backend — all state via AsyncStorage. No env vars required for the mobile app.

## Stack

- Expo SDK ~54, expo-router ~6.0 (file-based routing)
- React Native 0.81.5, react-native-reanimated ~4.1.1
- react-native-svg 15.12.1 (ProgressRing)
- expo-linear-gradient ~15.0.8 (GardenScene background)
- @react-native-async-storage/async-storage 2.2.0
- expo-haptics, @expo/vector-icons (Ionicons)
- Inter font via @expo-google-fonts/inter

## Where things live

```
artifacts/mobile/
  app/(tabs)/index.tsx       Garden screen (home + daily ritual, XP shop, share, weekly recap, goal countdown)
  app/(tabs)/learn.tsx       Module list
  app/(tabs)/tracker.tsx     Job application tracker (add/edit/delete, status pills)
  app/(tabs)/badges.tsx      Badges grid
  app/module/[id].tsx        Module detail + lesson list
  app/lesson.tsx             Lesson reader (paged FlatList)
  app/_layout.tsx            Root layout with all providers + CelebrationHost
  context/GameContext.tsx    All game state (AsyncStorage-backed) + celebration queue
  data/content.ts            8 modules × 4 lessons, badges, daily actions
  components/GardenScene.tsx Animated koi pond (Reanimated + LinearGradient), staticMode for share card
  components/CelebrationHost.tsx  Serializes level-up / streak / badge / freeze overlays via a queue
  components/SharePreviewCard.tsx Responsive shareable garden card (captured via react-native-view-shot)
  components/VolumeSlider.tsx / .web.tsx  Ambient volume slider (native gesture / web <input range>)
  components/ProgressRing.tsx SVG circular progress ring
  components/ModuleCard.tsx, BadgeItem.tsx, DailyActionItem.tsx, XPBar.tsx
  hooks/useAmbientSound.ts   Ambient audio (mute, volume, level-based crossfade + preload)
  hooks/useNotifications.ts  Local daily-reminder scheduling
  constants/colors.ts        Zen garden dark/light palette
```

## Architecture decisions

- **No backend**: Pure frontend with AsyncStorage for all persistence. Main game state under `@career_garden_state_v3` (shallow-merged with defaults on load for forward migration); ambient sound prefs under `@career_garden/ambient_muted` and `@career_garden/ambient_volume`
- **Tab routing**: NativeTabs (liquid glass) on iOS 26+, ClassicTabs with BlurView on other platforms
- **Lesson navigation**: `/module/:id` → `/lesson?moduleId=X&lessonId=Y` (flat params, not nested dynamic)
- **Garden levels 1-7**: Computed from XP; each level adds animated garden elements (koi, lotus, lantern, bamboo)
- **Deterministic daily actions**: 3 actions seeded by `new Date().toDateString()` — consistent per day

## Product

- 8 job search modules (Resume, LinkedIn, Networking, Search, AI, Interview, Negotiation, Resilience)
- 4 lessons per module (32 total), each with 3-4 content pages + key takeaway + actionable tip
- Collectible badges (module completion + streak + milestones)
- Daily ritual: 3 random daily actions (seeded deterministically by date)
- Job application tracker (log applications, statuses, earn XP)
- Animated koi pond garden that grows from bare water → full zen garden as XP is earned
- XP progression with garden levels 1-7 driving new garden elements
- Streak system with milestone celebrations (3/7/30 days) and streak-freeze power-ups
- XP shop: spend XP on streak freezes and XP boosters; power-up history log
- Social sharing: capture + preview a polished garden card with optional caption
- Ambient soundscape that scales with garden level, with mute + volume control
- Onboarding goal + countdown, weekly recap with "vs last week" comparison
- Local daily reminder notification (requires a development build to test — Expo Go dropped notifications)

## User preferences

- Zen dark aesthetic: deep teal backgrounds (#0F1E1B), warm amber accents (#F5A54A), jade green primary (#7BC4A0)
- Game-feel UI inspired by Zen Koi app
- No backend — AsyncStorage only

## Gotchas

- Don't restart the expo workflow for code changes (HMR handles it); only restart for dependency/Metro changes
- Tab layout tries `isLiquidGlassAvailable()` first, falls back to ClassicTabs with BlurView
- `lesson.tsx` is at root (not inside a directory) to avoid nested dynamic route naming issues in Stack.Screen
- XP levels array is 0-indexed (index = level - 1)

## Pointers

- Expo skill: `.local/skills/expo/SKILL.md`
- Tabs reference: `.local/skills/expo/references/tabs.md` (NativeTabs + ClassicTabs patterns)
- react-native-svg docs: https://github.com/software-mansion/react-native-svg
