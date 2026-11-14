/** Muñequitos del juego de penales: dibujados a mano, sin librerías. */

export function Keeper({
  className = "",
  dive,
}: {
  className?: string;
  /** -1 se lanza a su izquierda, 1 a su derecha, 0 se queda. */
  dive: -1 | 0 | 1;
}) {
  const armsUp = dive === 0;
  return (
    <svg viewBox="0 0 60 80" className={className} aria-hidden="true">
      {/* guantes */}
      <circle cx={armsUp ? 10 : 6} cy={armsUp ? 16 : 26} r="7" fill="#fbbf24" />
      <circle cx={armsUp ? 50 : 54} cy={armsUp ? 16 : 26} r="7" fill="#fbbf24" />
      {/* brazos */}
      <path
        d={
          armsUp
            ? "M20 34 L10 18 M40 34 L50 18"
            : "M20 34 L6 26 M40 34 L54 26"
        }
        stroke="#f59e0b"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* cuerpo */}
      <rect x="18" y="26" width="24" height="30" rx="7" fill="#f59e0b" />
      <rect x="18" y="40" width="24" height="5" fill="#b45309" />
      {/* piernas */}
      <path
        d="M24 56 L22 76 M36 56 L38 76"
        stroke="#1f2937"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* cabeza */}
      <circle cx="30" cy="16" r="10" fill="#fcd34d" />
      <path d="M21 12a9 9 0 0 1 18 0z" fill="#78350f" />
    </svg>
  );
}

export function Striker({
  className = "",
  color = "#12a05a",
  kicking,
}: {
  className?: string;
  color?: string;
  kicking: boolean;
}) {
  return (
    <svg viewBox="0 0 60 80" className={className} aria-hidden="true">
      {/* brazos */}
      <path
        d={kicking ? "M20 36 L4 28 M40 36 L54 30" : "M20 36 L10 50 M40 36 L50 50"}
        stroke="#fcd34d"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* camiseta */}
      <rect x="18" y="28" width="24" height="28" rx="7" fill={color} />
      {/* piernas: la derecha golpea */}
      <path
        d={kicking ? "M26 56 L18 74" : "M26 56 L24 76"}
        stroke="#1f2937"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d={kicking ? "M34 56 L54 62" : "M34 56 L36 76"}
        stroke="#1f2937"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* cabeza */}
      <circle cx="30" cy="18" r="10" fill="#fcd34d" />
      <path d="M21 14a9 9 0 0 1 18 0z" fill="#1f2937" />
    </svg>
  );
}

const CONFETTI_COLORS = [
  "#12a05a",
  "#fbbf24",
  "#f97316",
  "#38bdf8",
  "#e11d48",
  "#ffffff",
];

/** Lluvia de papelitos cuando ganas la tanda. */
export function Confetti({ pieces = 60 }: { pieces?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {Array.from({ length: pieces }, (_, i) => {
        // Valores derivados del índice: el mismo confeti en cada render.
        const left = (i * 37) % 100;
        const delay = ((i * 13) % 20) / 10;
        const duration = 1.8 + ((i * 7) % 12) / 10;
        const size = 6 + (i % 4) * 2;
        return (
          <span
            key={i}
            className="ff-confetti absolute top-0 block rounded-[1px]"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 1.6}px`,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
