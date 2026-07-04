import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

const MUTE_KEY = "@career_garden/ambient_muted";
const VOLUME_KEY = "@career_garden/ambient_volume";
const DEFAULT_VOLUME = 0.25;
const AMBIENT_SOUND = require("../assets/sounds/ambient.mp3");

function clampVolume(v: number): number {
  if (Number.isNaN(v)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, v));
}

export function useAmbientSound() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const volumeRef = useRef(DEFAULT_VOLUME);
  const volumePersistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        const { sound } = await Audio.Sound.createAsync(
          AMBIENT_SOUND,
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
      } catch {
        // Graceful degradation: ambient sound is optional
      }
    }

    init();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

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
