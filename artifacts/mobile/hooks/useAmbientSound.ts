import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

const MUTE_KEY = "@career_garden/ambient_muted";
const AMBIENT_SOUND = require("../assets/sounds/ambient.mp3");

export function useAmbientSound() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const stored = await AsyncStorage.getItem(MUTE_KEY);
        const savedMuted = stored === "true";
        if (mounted) {
          setMuted(savedMuted);
          mutedRef.current = savedMuted;
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          AMBIENT_SOUND,
          {
            isLooping: true,
            volume: savedMuted ? 0 : 0.25,
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
        await sound.setVolumeAsync(0.25);
        await sound.playAsync();
      }
    } catch {
      // ignore
    }
  }, []);

  return { muted, toggleMute };
}
