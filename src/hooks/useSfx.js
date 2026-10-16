import { useCallback, useMemo, useRef } from "react";

/** Efeitos sonoros via Web Audio (curtos, leves, sem arquivos). */
export function useSfx(enabled) {
  const ctxRef = useRef(null);

  const ctx = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const tone = useCallback(
    (freq, start, dur, type, gain = 0.18) => {
      const c = ctx();
      if (!c) return;
      const t = c.currentTime + start;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(c.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    [ctx]
  );

  return useMemo(
    () => ({
      /** Destrava o áudio no primeiro toque (exigência do iOS/Safari). */
      unlock: () => {
        ctx();
      },
      correct: () => {
        if (!enabled) return;
        tone(660, 0, 0.14, "triangle");
        tone(990, 0.1, 0.22, "triangle");
      },
      wrong: () => {
        if (!enabled) return;
        tone(220, 0, 0.18, "sawtooth", 0.08);
        tone(165, 0.12, 0.26, "sawtooth", 0.08);
      },
      fanfare: () => {
        if (!enabled) return;
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.3, "triangle", 0.14));
      },
    }),
    [enabled, tone, ctx]
  );
}
