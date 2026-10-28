import { UI } from "../data/strings";
import { useFocusOnChange } from "../hooks/useFocusOnChange";
import { CTA, GROW, SCREEN, STACK } from "../styles/classes";

export default function StartScreen({ videoSrc, posterSrc, logoSrc, onStart, tools }) {
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
        <div className="flex w-full items-center justify-end">{tools}</div>
        <img className="mt-5 h-auto w-[min(280px,72%)]" src={logoSrc} alt="Afluentes" fetchPriority="high" />
        <p className="mt-2 mb-0 text-[10px] tracking-[.18em] uppercase opacity-90">Sideelver – Amazonasfondets veier og historier</p>
        <div className={GROW} />
        <h1
          id="gq-start-title"
          ref={headingRef}
          tabIndex={-1}
          className="m-0 font-display text-[clamp(44px,13vw,60px)] leading-[.95] font-normal tracking-[.01em] text-balance focus:outline-none"
        >
          {UI.startTitle}
        </h1>
        <p className="mt-3.5 mb-0 max-w-[300px] text-lg leading-[1.35]">{UI.startSub}</p>
        <button type="button" className={`${CTA} mt-8 text-[34px]`} onClick={onStart}>
          {UI.play}
        </button>
      </div>
    </section>
  );
}
