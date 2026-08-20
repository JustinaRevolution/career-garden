# VolumeSlider web/native split — investigation notes (2026-08-20)

Checked why web might be rendering the gesture-based `VolumeSlider.tsx`
instead of `VolumeSlider.web.tsx`.

Import site: `app/(tabs)/index.tsx:29`
```
import { VolumeSlider } from "@/components/VolumeSlider";
```
This is the correct pattern (extensionless import) for Metro's platform
extension resolution to pick `.web.tsx` on web builds.

Checked and ruled out:
- `metro.config.js` — stock `getDefaultConfig(__dirname)`, no custom
  resolver/platform overrides.
- `babel.config.js` — no `module-resolver` plugin; nothing pre-resolves the
  `@/` alias to a literal `.tsx` path before Metro sees it.
- `tsconfig.json` — `@/*` path mapping is TS-only, doesn't affect bundling.
- `scripts/build.js` (the actual production build/deploy pipeline) only
  fetches `ios` and `android` bundles from Metro (`downloadBundle("ios", ...)`
  / `downloadBundle("android", ...)`) for an Expo Go static deployment. It
  never builds or serves a `web` platform bundle at all.

Conclusion: no misconfiguration found in the import/bundler/build-script
chain that would explain web resolving to the gesture-handler slider. The
only place "web" is actually exercised is `expo start --web` in dev, which
needs to be checked live (visually, in a browser) rather than via static
analysis — Metro's default resolver behavior for `.web.tsx` looks correct on
paper.

Needs deeper investigation: run `pnpm exec expo start --web` and inspect the
actual rendered DOM / bundled output to see whether `.web.tsx` is really
being skipped, or whether the original report was about a different platform
target (e.g. gesture-handler slider showing up inside an Expo Go webview
embed, not a true `--web` bundle).
