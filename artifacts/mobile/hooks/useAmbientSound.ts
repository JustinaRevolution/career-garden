import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

const AMBIENT_URI =
  "https://ia800502.us.archive.org/8/items/zenGarden_201409/zen_garden.mp3";

export function useAmbientSound() {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: AMBIENT_URI },
          { isLooping: true, volume: mutedRef.current ? 0 : 0.25, shouldPlay: !mutedRef.current }
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

    load();

    return () => {
      mounted = false;
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  const toggleMute = useCallback(async () => {
    const next = !mutedRef.current;
    setMuted(next);
    if (!soundRef.current) return;
    try {
      if (next) {
        await soundRef.current.setVolumeAsync(0);
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.setVolumeAsync(0.25);
        await soundRef.current.playAsync();
      }
    } catch {
      // ignore
    }
  }, []);

  return { muted, toggleMute };
}
