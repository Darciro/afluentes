/** Faixa geométrica lateral (SVG inline como data URI). */
const BORDER_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="48" viewBox="0 0 32 48"><rect width="32" height="48" fill="#FFFDE8"/><path d="M2 2 L28 24 L2 46 Z" fill="#E4223F"/><path d="M6 11 L18 24 L6 37 Z" fill="#FFFDE8"/><path d="M8 18 L13 24 L8 30 Z" fill="#E4223F"/><rect x="26" y="0" width="6" height="6" fill="#E4223F"/><rect x="26" y="42" width="6" height="6" fill="#E4223F"/><rect x="29" y="6" width="3" height="5" fill="#E4223F"/><rect x="29" y="37" width="3" height="5" fill="#E4223F"/></svg>`
);

const STYLE = { backgroundImage: `url("data:image/svg+xml,${BORDER_SVG}")` };

export default function SideBorder({ flip = false }) {
  return (
    <div
      className={`w-4 flex-[0_0_16px] bg-size-[16px_24px] bg-repeat-y ${flip ? "-scale-x-100" : ""}`}
      style={STYLE}
      aria-hidden="true"
    />
  );
}
