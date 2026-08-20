# AGENTS.md — Career Garden

Cross-agent context file (read by Claude Code, Codex, OpenCode, and any coding agent). Read this at session start before touching code.

## What this is

Career Garden (formerly "USA Job Guide"): a gamified job-search companion app. Expo SDK 54 / React Native, pnpm workspace monorepo.

- Workspace root: /home/justina/Desktop/Claude-Code-Workshop/career-garden
- GitHub: JustinaRevolution/career-garden (private)
- Dev server: port 8081 (expo start --lan). Docker sandbox: port 8082. Phone test: exp://192.168.1.68:8081 (UFW allows 192.168.1.0/24:8081).
- Real-device validated by Clayton 2026-08-20 — all works except push notifications (Expo Go limitation; needs a dev build).
- Replit is CANCELLED — do not reference replit.md workflows; local dev is canonical.

## House doctrine (applies to everything you write here)

1. Version control everything. Small, single-purpose commits; messages say what and why. Never commit secrets.
2. Small slices, ship often. One vertical slice at a time.
3. Tests prove it works. "Done" means proven. Regression test for every bug fix. Red build = nothing ships.
4. Keep it simple. YAGNI, KISS, DRY, orthogonality. Working over perfect.
5. Fail loudly, fail safely. Never swallow exceptions. Logs say something. The app runs on phones — handle offline/empty states gracefully, don't crash.
6. Security by default. No secrets in repo. Validate input. Least privilege.
7. Reproducible builds. pnpm-lock.yaml is the contract — use pnpm, never npm/yarn (the preinstall script enforces this).
8. Data is sacred. User progress matters — don't break migrations or local state.
9. Review before it ships. Read your own diff. Small changes.
10. Debt is tracked, not hidden. Log hacks with a plan. Fix forward.

## Commands

```bash
# Install (pnpm only — npm/yarn are blocked by preinstall)
pnpm install

# Typecheck
pnpm run typecheck

# Dev server (Expo, port 8081)
pnpm --filter <app> start   # or expo start --lan from the app package
# Browser: http://localhost:8081   Phone: exp://192.168.1.68:8081

# Build / test within packages — check each package's package.json scripts
```

## Structure

```
artifacts/     # app packages (Expo apps and libs)
lib/           # shared libraries
scripts/       # workspace scripts
compose.yaml   # Docker sandbox (port 8082)
Dockerfile     # sandbox image
PROJECT-NOTES.md  # current project state — READ THIS FIRST
```

## Known constraints (learned the hard way)

- Audio: audio volume 0.75; expo-av pinned at 16.0.8 for SDK 54.
- Web confirmations: use confirmAsync (expo-ask) — Alert.alert buttons are silent no-ops on react-native-web.
- Native slider: GestureHandlerRootView must wrap the Modal for the slider to work on native.
- Notifications need a dev build; Expo Go cannot deliver them. Don't burn time on it in Expo Go.

## Standards

- TypeScript strict. Follow existing patterns in the package you're editing.
- pnpm workspaces: run scripts from the right package, not the root, unless root is correct.
- Keep the phone test path working: 192.168.1.0/24:8081 must stay open in UFW.

## Pre-ship gate

Before any commit that touches behavior:
- [ ] pnpm run typecheck passes
- [ ] No secrets in the diff
- [ ] No swallowed exceptions added
- [ ] Works on web (react-native-web) AND native — test both paths when the change touches UI
- [ ] PROJECT-NOTES.md updated if the change matters
- [ ] Diff read top to bottom
