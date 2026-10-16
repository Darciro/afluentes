/* Ícones (SVG em traço, herdam a cor do texto). */

function Svg({ size = 20, strokeWidth = 2, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const SoundIcon = ({ on }) => (
  <Svg>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    {on ? (
      <>
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    ) : (
      <>
        <path d="m16 9 6 6" />
        <path d="m22 9-6 6" />
      </>
    )}
  </Svg>
);

export const CheckIcon = () => (
  <Svg strokeWidth={3}>
    <path d="M5 12.5 10 17.5 19 7" />
  </Svg>
);

export const XIcon = () => (
  <Svg size={18} strokeWidth={3}>
    <path d="M6 6 18 18" />
    <path d="M18 6 6 18" />
  </Svg>
);

export const ArrowIcon = () => (
  <Svg size={18} strokeWidth={2.5}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </Svg>
);

export const ReplayIcon = () => (
  <Svg size={22} strokeWidth={2.5}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
  </Svg>
);
