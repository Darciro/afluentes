import { useFocusOnChange } from "../hooks/useFocusOnChange";
import { CTA, GROW, SCREEN, STACK } from "../styles/classes";

export default function StartScreen({ videoSrc, posterSrc, logoSrc, onStart, soundToggle }) {
  const headingRef = useFocusOnChange();

  return (
    <section className={`${SCREEN} bg-gq-night text-white`} aria-labelledby="gq-start-title">
      <video
        className="absolute inset-0 size-full object-cover"
        src={videoSrc}
        poster={posterSrc}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,14,10,.55)_0%,rgba(20,14,10,0)_28%,rgba(20,14,10,0)_45%,rgba(20,14,10,.92)_78%)]"
        aria-hidden="true"
      />
      <div className={STACK}>
        <div className="flex w-full items-center justify-end">{soundToggle}</div>
        <img className="mt-5 h-auto w-[min(280px,72%)]" src={logoSrc} alt="Afluentes" fetchPriority="high" />
        <div className={GROW} />
        <h1
          id="gq-start-title"
          ref={headingRef}
          tabIndex={-1}
          className="m-0 font-display text-[clamp(44px,13vw,60px)] leading-[.95] font-normal tracking-[.01em] text-balance focus:outline-none"
        >
          Venha ser um Guardião da Amazônia
        </h1>
        <p className="mt-3.5 mb-0 max-w-[300px] text-lg leading-[1.35]">Responda o quiz e veja se está preparado.</p>
        <button type="button" className={`${CTA} mt-8 text-[34px]`} onClick={onStart}>
          Jogar
        </button>
      </div>
    </section>
  );
}
