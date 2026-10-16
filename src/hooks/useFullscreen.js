import { useCallback, useEffect, useState } from "react";

const fsElement = () =>
  typeof document === "undefined" ? null : (document.fullscreenElement ?? document.webkitFullscreenElement ?? null);

/** Já roda como app instalado (PWA na tela inicial)? Aí a tela cheia é nativa. */
const isInstalled = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches ||
    window.navigator.standalone === true);

/** Tela cheia via Fullscreen API (Android/desktop). No iPhone só funciona instalado como PWA. */
export function useFullscreen() {
  const [active, setActive] = useState(() => !!fsElement() || isInstalled());
  const el = typeof document === "undefined" ? null : document.documentElement;
  const supported = !!(el?.requestFullscreen ?? el?.webkitRequestFullscreen) && !isInstalled();

  useEffect(() => {
    const sync = () => setActive(!!fsElement() || isInstalled());
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  /** Precisa ser chamado dentro de um toque/clique do usuário. */
  const enter = useCallback(async () => {
    if (!supported || fsElement()) return;
    try {
      await (el.requestFullscreen?.({ navigationUI: "hide" }) ?? el.webkitRequestFullscreen?.());
      await screen.orientation?.lock?.("portrait").catch(() => {});
    } catch {
      // Navegador recusou (ex.: sem gesto do usuário); segue sem tela cheia
    }
  }, [el, supported]);

  const exit = useCallback(async () => {
    if (!fsElement()) return;
    try {
      await (document.exitFullscreen?.() ?? document.webkitExitFullscreen?.());
    } catch {
      // ignora
    }
  }, []);

  const toggle = useCallback(() => (fsElement() ? exit() : enter()), [enter, exit]);

  return { active, supported, enter, exit, toggle };
}
