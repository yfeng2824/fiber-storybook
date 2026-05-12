"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type CueId =
  | "ui.pop"
  | "ui.tap-ding"
  | "scene.heart-pop"
  | "scene.hmmmm"
  | "scene.phone-vibrate"
  | "scene.rooster-wakeup"
  | "pod.door-open"
  | "pod.door-close"
  | "system.channel-active"
  | "system.disconnect"
  | "system.shutdown"
  | "system.summary-chime";

type SoundscapeMode = "airport" | "sleep" | "quiet";

type SoundContextValue = {
  enabled: boolean;
  ready: boolean;
  blocked: boolean;
  soundscape: SoundscapeMode;
  toggle: () => void;
  playCue: (cue: CueId) => void;
  suppressSceneCues: (durationMs?: number) => void;
  setSoundscape: (mode: SoundscapeMode) => void;
};

const SoundContext = createContext<SoundContextValue | null>(null);

const STORAGE_KEY = "fiber-storybook-sound-enabled";
const INTERACTIVE_CLICK_SELECTOR = [
  "button",
  "a[href]",
  "[role='button']",
  "summary",
  "select",
  "input",
  "textarea",
  "label",
].join(",");

type RunningNodes = {
  backgroundAudio?: HTMLAudioElement;
  sleepAudio?: HTMLAudioElement;
};

function createNoiseBuffer(context: AudioContext, duration: number) {
  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, frameCount, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let index = 0; index < frameCount; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * 0.6;
  }

  return buffer;
}

function playAudioCue(src: string, volume: number) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  audio.crossOrigin = "anonymous";
  void audio.play().catch(() => {
    // Ignore one-shot cue failures. The ambient fallback and visible motion still communicate the event.
  });
}

function playLoopAudio(src: string, volume: number) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = volume;
  audio.crossOrigin = "anonymous";
  audio.loop = true;
  void audio.play().catch(() => {
    // Ignore loop start failures. The user may still need to interact once to unlock audio.
  });
  return audio;
}

function stopLoopAudio(audio: HTMLAudioElement | undefined, reset = true) {
  if (!audio) {
    return;
  }

  audio.pause();

  if (reset) {
    audio.currentTime = 0;
  }
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const contextRef = useRef<AudioContext | null>(null);
  const runningRef = useRef<RunningNodes>({});
  const suppressSceneCuesUntilRef = useRef(0);
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [soundscape, setSoundscapeState] = useState<SoundscapeMode>("airport");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "false") {
      setEnabled(false);
    }
  }, []);

  const stopAll = useCallback(() => {
    stopLoopAudio(runningRef.current.backgroundAudio);
    stopLoopAudio(runningRef.current.sleepAudio);
    runningRef.current.backgroundAudio = undefined;
    runningRef.current.sleepAudio = undefined;
  }, []);

  const applySoundscape = useCallback(
    async (mode: SoundscapeMode) => {
      const context = contextRef.current;
      if (!context || context.state !== "running" || !enabled) {
        return;
      }

      if (mode === "airport") {
        stopLoopAudio(runningRef.current.sleepAudio);
        runningRef.current.sleepAudio = undefined;

        if (!runningRef.current.backgroundAudio) {
          runningRef.current.backgroundAudio = playLoopAudio("/sound/bg.mp3", 0.18);
        } else {
          runningRef.current.backgroundAudio.volume = 0.18;
          void runningRef.current.backgroundAudio.play().catch(() => {
            // Ignore resume failures. A later user gesture can unlock audio again.
          });
        }
        return;
      }

      stopLoopAudio(runningRef.current.backgroundAudio, false);

      if (mode === "sleep") {
        if (!runningRef.current.sleepAudio) {
          runningRef.current.sleepAudio = playLoopAudio("/sound/snoring.mp3", 0.34);
        }
        return;
      }

      stopLoopAudio(runningRef.current.sleepAudio);
      runningRef.current.sleepAudio = undefined;
    },
    [enabled],
  );

  const ensureAudio = useCallback(async () => {
    if (!enabled) {
      stopAll();
      setReady(false);
      return false;
    }

    if (typeof window === "undefined") {
      return false;
    }

    if (!contextRef.current) {
      const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        return false;
      }
      contextRef.current = new AudioContextCtor();
    }

    try {
      await contextRef.current.resume();
      if (contextRef.current.state === "running") {
        await applySoundscape(soundscape);
        setReady(true);
        setBlocked(false);
        return true;
      }

      setReady(false);
      setBlocked(true);
    } catch {
      setBlocked(true);
    }

    return false;
  }, [applySoundscape, enabled, soundscape, stopAll]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  useEffect(() => {
    void ensureAudio();
  }, [ensureAudio]);

  useEffect(() => {
    if (!enabled || ready) {
      return undefined;
    }

    const unlock = () => {
      void ensureAudio();
    };

    const events: (keyof WindowEventMap)[] = ["pointerdown", "touchstart", "keydown", "wheel"];
    events.forEach((eventName) => window.addEventListener(eventName, unlock, { passive: true }));

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, unlock));
    };
  }, [enabled, ensureAudio, ready]);

  useEffect(() => {
    if (ready) {
      void applySoundscape(soundscape);
    }
  }, [applySoundscape, ready, soundscape]);

  useEffect(() => {
    const playInteractiveClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const target = event.target.closest(INTERACTIVE_CLICK_SELECTOR);

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const isSoundToggle = target.dataset.soundToggle === "true";

      if (!enabled && !isSoundToggle) {
        return;
      }

      const isDisabled =
        target.getAttribute("aria-disabled") === "true" ||
        ("disabled" in target && Boolean(target.disabled));

      if (isDisabled) {
        return;
      }

      playAudioCue("/sound/button-click.mp3", 0.42);
    };

    document.addEventListener("click", playInteractiveClick, { capture: true });

    return () => {
      document.removeEventListener("click", playInteractiveClick, { capture: true });
    };
  }, [enabled]);

  useEffect(() => () => stopAll(), [stopAll]);

  const setSoundscape = useCallback((mode: SoundscapeMode) => {
    setSoundscapeState(mode);
  }, []);

  const playCue = useCallback(
    (cue: CueId) => {
      const context = contextRef.current;
      if (!enabled || !context || context.state !== "running") {
        return;
      }

      if (!cue.startsWith("ui.") && performance.now() < suppressSceneCuesUntilRef.current) {
        return;
      }

      if (cue === "scene.heart-pop") {
        playAudioCue("/sound/heart.mp3", 0.42);
        return;
      }

      if (cue === "ui.pop") {
        playAudioCue("/sound/pop-sound-effect.mp3", 0.38);
        return;
      }

      if (cue === "scene.hmmmm") {
        playAudioCue("/sound/hmmmm.mp3", 0.46);
        return;
      }

      if (cue === "scene.phone-vibrate") {
        playAudioCue("/sound/phone-vibrate.mp3", 0.54);
        return;
      }

      if (cue === "scene.rooster-wakeup") {
        playAudioCue("/sound/rooster-wakeup.mp3", 0.5);
        return;
      }

      if (cue === "system.channel-active") {
        playAudioCue("/sound/success.mp3", 0.46);
        return;
      }

      if (cue === "system.disconnect") {
        playAudioCue("/sound/disconnect.mp3", 0.5);
        return;
      }

      if (cue === "system.shutdown") {
        playAudioCue("/sound/shut-down.mp3", 0.5);
        return;
      }

      const now = context.currentTime;
      const gain = context.createGain();
      gain.connect(context.destination);

      if (cue === "ui.tap-ding" || cue === "system.summary-chime") {
        const oscillator = context.createOscillator();
        oscillator.type = cue === "ui.tap-ding" ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(cue === "ui.tap-ding" ? 740 : 460, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
        oscillator.connect(gain);
        oscillator.start(now);
        oscillator.stop(now + 0.62);
        return;
      }

      const noiseBuffer = createNoiseBuffer(context, 0.6);
      const source = context.createBufferSource();
      source.buffer = noiseBuffer;

      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = cue === "pod.door-open" ? 480 : 260;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      source.connect(filter);
      filter.connect(gain);
      source.start(now);
      source.stop(now + 0.52);
    },
    [enabled],
  );

  const suppressSceneCues = useCallback((durationMs = 1400) => {
    suppressSceneCuesUntilRef.current = Math.max(suppressSceneCuesUntilRef.current, performance.now() + durationMs);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((previous) => {
      const next = !previous;
      if (!next) {
        stopAll();
        if (contextRef.current) {
          void contextRef.current.suspend();
        }
        setReady(false);
        setBlocked(false);
      } else {
        window.requestAnimationFrame(() => {
          void ensureAudio();
        });
      }
      return next;
    });
  }, [ensureAudio, stopAll]);

  const value = useMemo<SoundContextValue>(
    () => ({
      enabled,
      ready,
      blocked,
      soundscape,
      toggle,
      playCue,
      suppressSceneCues,
      setSoundscape,
    }),
    [blocked, enabled, playCue, ready, setSoundscape, soundscape, suppressSceneCues, toggle],
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const context = useContext(SoundContext);

  if (!context) {
    throw new Error("useSound must be used within a SoundProvider.");
  }

  return context;
}
