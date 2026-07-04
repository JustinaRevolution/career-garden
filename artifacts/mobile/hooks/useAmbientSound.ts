import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

const MUTE_KEY = "@career_garden/ambient_muted";
const VOLUME_KEY = "@career_garden/ambient_volume";
const DEFAULT_VOLUME = 0.25;
const CROSSFADE_MS = 1800;
const CROSSFADE_STEPS = 18;

const AMBIENT_TRACKS = {
  sparse: require("../assets/sounds/ambient-sparse.mp3"),
  mid: require("../assets/sounds/ambient-mid.mp3"),
  full: require("../assets/sounds/ambient-full.mp3"),
} as const;

type TrackKey = keyof typeof AMBIENT_TRACKS;

function trackForLevel(gardenLevel: number): TrackKey {
  if (gardenLevel >= 6) return "full";
  if (gardenLevel >= 3) return "mid";
  return "sparse";
}

function clampVolume(v: number): number {
  if (Number.isNaN(v)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, v));
}

export function useAmbientSound(gardenLevel: number = 1) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentTrackRef = useRef<TrackKey | null>(null);
  const crossfadeTokenRef = useRef(0);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const volumePersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const [storedMuted, storedVolume] = await Promise.all([
          AsyncStorage.getItem(MUTE_KEY),
          AsyncStorage.getItem(VOLUME_KEY),
        ]);
        const savedMuted = storedMuted === "true";
        const savedVolume =
          storedVolume !== null ? clampVolume(parseFloat(storedVolume)) : DEFAULT_VOLUME;

        if (mounted) {
          setMuted(savedMuted);
          mutedRef.current = savedMuted;
          setVolumeState(savedVolume);
          volumeRef.current = savedVolume;
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const initialTrack = trackForLevel(gardenLevel);
        const { sound } = await Audio.Sound.createAsync(
          AMBIENT_TRACKS[initialTrack],
          {
            isLooping: true,
            volume: savedMuted ? 0 : savedVolume,
            shouldPlay: !savedMuted,
          }
        );

        if (!mounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
        currentTrackRef.current = initialTrack;
        readyRef.current = true;
        setIsReady(true);
      } catch {
        // Graceful degradation: ambient sound is optional
      }
    }

    init();

    return () => {
      mounted = false;
      readyRef.current = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
      currentTrackRef.current = null;
    };
    // Intentionally run once: track swaps for level changes are handled by the
    // crossfade effect below rather than re-initializing the sound object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Crossfade to the appropriate track whenever the garden level moves into a
  // new band, so the soundscape grows richer without an abrupt cut. Also
  // reconciles the case where `gardenLevel` was already past the initial band
  // before audio finished loading (e.g. state hydrated from storage at a high
  // XP total on cold launch) — `isReady` re-runs this effect once init
  // completes so the correct track loads immediately instead of staying on
  // the initial-band track until the next level change.
  useEffect(() => {
    const nextTrack = trackForLevel(gardenLevel);

    if (!isReady || !readyRef.current || currentTrackRef.current === null) return;
    if (currentTrackRef.current === nextTrack) return;

    const myToken = ++crossfadeTokenRef.current;
    let cancelled = false;

    async function crossfade() {
      const oldSound = soundRef.current;

      try {
        const targetVolume = mutedRef.current ? 0 : volumeRef.current;

        const { sound: newSound } = await Audio.Sound.createAsync(
          AMBIENT_TRACKS[nextTrack],
          {
            isLooping: true,
            volume: 0,
            shouldPlay: !mutedRef.current,
          }
        );

        if (cancelled || myToken !== crossfadeTokenRef.current) {
          await newSound.unloadAsync();
          return;
        }

        soundRef.current = newSound;
        currentTrackRef.current = nextTrack;

        const stepMs = CROSSFADE_MS / CROSSFADE_STEPS;
        for (let i = 1; i <= CROSSFADE_STEPS; i++) {
          if (cancelled || myToken !== crossfadeTokenRef.current) break;
          const ratio = i / CROSSFADE_STEPS;
          await Promise.all([
            newSound.setVolumeAsync(targetVolume * ratio).catch(() => {}),
            oldSound?.setVolumeAsync(targetVolume * (1 - ratio)).catch(() => {}),
          ]);
          await new Promise((resolve) => setTimeout(resolve, stepMs));
        }

        if (myToken === crossfadeTokenRef.current) {
          await oldSound?.unloadAsync();
        } else {
          await newSound.unloadAsync();
        }
      } catch {
        // ignore crossfade errors; leave whichever sound is currently playing
      }
    }

    crossfade();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gardenLevel, isReady]);

  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      const sound = soundRef.current;
      if (!sound) return;
      try {
        if (nextState === "active") {
          if (!mutedRef.current) {
            await sound.playAsync();
          }
        } else {
          await sound.pauseAsync();
        }
      } catch {
        // ignore
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);

  const toggleMute = useCallback(async () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);

    try {
      await AsyncStorage.setItem(MUTE_KEY, String(next));
    } catch {
      // ignore storage errors
    }

    const sound = soundRef.current;
    if (!sound) return;
    try {
      if (next) {
        await sound.setVolumeAsync(0);
        await sound.pauseAsync();
      } else {
        await sound.setVolumeAsync(volumeRef.current);
        await sound.playAsync();
      }
    } catch {
      // ignore
    }
  }, []);

  const setVolume = useCallback((next: number) => {
    const clamped = clampVolume(next);
    volumeRef.current = clamped;
    setVolumeState(clamped);

    const wasMuted = mutedRef.current;
    if (wasMuted) {
      mutedRef.current = false;
      setMuted(false);
    }

    const sound = soundRef.current;
    if (sound) {
      sound.setVolumeAsync(clamped).catch(() => {
        // ignore
      });
      if (wasMuted) {
        sound.playAsync().catch(() => {
          // ignore
        });
      }
    }

    if (volumePersistTimer.current !== null) {
      clearTimeout(volumePersistTimer.current);
    }
    volumePersistTimer.current = setTimeout(() => {
      volumePersistTimer.current = null;
      AsyncStorage.setItem(VOLUME_KEY, String(volumeRef.current)).catch(() => {
        // ignore storage errors
      });
      // Persist the *current* mute state (not a stale per-call snapshot) so
      // that any unmute that happened during a rapid drag is always saved.
      AsyncStorage.setItem(MUTE_KEY, String(mutedRef.current)).catch(() => {
        // ignore storage errors
      });
    }, 200);
  }, []);

  useEffect(() => {
    return () => {
      if (volumePersistTimer.current !== null) {
        clearTimeout(volumePersistTimer.current);
      }
    };
  }, []);

  return { muted, toggleMute, volume, setVolume };
}
