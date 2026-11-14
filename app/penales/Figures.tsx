/**
 * Figuras del juego de penales: siluetas vectoriales con sombreado,
 * sin trazos de palotes.
 */

export function Keeper({
  className = "",
  dive,
  idSuffix = "",
}: {
  className?: string;
  /** -1 se lanza a su izquierda, 1 a su derecha, 0 se queda de pie. */
  dive: -1 | 0 | 1;
  idSuffix?: string;
}) {
  const kitId = `keeperKit${idSuffix}`;
  const skinId = `skin${idSuffix}`;
  const flying = dive !== 0;

  return (
    <svg viewBox="0 0 70 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={kitId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={skinId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3c99b" />
          <stop offset="100%" stopColor="#d7a273" />
        </linearGradient>
      </defs>

      {flying ? (
        <>
          {/* cuerpo estirado en el aire */}
          <path
            d="M14 54c6-13 18-21 32-21 7 0 12 3 12 9s-5 10-12 12c-9 3-15 7-19 14-3 5-8 7-12 4s-4-11-1-18Z"
            fill={`url(#${kitId})`}
          />
          {/* brazos extendidos */}
          <path
            d="M52 40c6-5 12-9 17-10l3 7c-5 2-10 5-14 9Z"
            fill={`url(#${kitId})`}
          />
          <path d="M20 62c-5 2-9 6-11 10l6 4c2-4 5-7 9-9Z" fill="#b45309" />
          {/* piernas */}
          <path
            d="M18 70c-5 4-9 9-11 15l8 5c2-5 6-9 10-12Z"
            fill="#1e293b"
          />
          <path d="M28 76c-3 5-5 9-5 14h9c0-4 2-8 4-11Z" fill="#0f172a" />
          {/* guantes */}
          <ellipse cx="68" cy="33" rx="7" ry="6" fill="#f8fafc" />
          <ellipse cx="64" cy="38" rx="6" ry="5" fill="#e2e8f0" />
          {/* cabeza */}
          <circle cx="44" cy="30" r="9" fill={`url(#${skinId})`} />
          <path d="M35 27a9 9 0 0 1 18-2l-3 2Z" fill="#422006" />
        </>
      ) : (
        <>
          {/* piernas */}
          <path d="M28 64h7l-2 30h-8Z" fill="#1e293b" />
          <path d="M37 64h7l3 30h-8Z" fill="#0f172a" />
          {/* botas */}
          <path d="M23 92h11v5H22Z" fill="#f8fafc" />
          <path d="M39 92h11v5H38Z" fill="#e2e8f0" />
          {/* torso */}
          <path
            d="M26 34c0-5 4-8 10-8s10 3 10 8l3 22c0 5-4 8-13 8s-13-3-13-8Z"
            fill={`url(#${kitId})`}
          />
          {/* brazos arriba */}
          <path d="M26 36 13 16l7-5 12 20Z" fill={`url(#${kitId})`} />
          <path d="M46 36 59 16l-7-5-12 20Z" fill={`url(#${kitId})`} />
          {/* guantes */}
          <ellipse cx="14" cy="12" rx="7" ry="8" fill="#f8fafc" />
          <ellipse cx="58" cy="12" rx="7" ry="8" fill="#e2e8f0" />
          {/* cabeza */}
          <circle cx="36" cy="18" r="9.5" fill={`url(#${skinId})`} />
          <path d="M26.5 16a9.5 9.5 0 0 1 19 0c-3-3-6-4-9.5-4s-6.5 1-9.5 4Z" fill="#422006" />
        </>
      )}
    </svg>
  );
}

export function Striker({
  className = "",
  color = "#12a05a",
  dark = "#065f36",
  kicking,
  idSuffix = "",
}: {
  className?: string;
  color?: string;
  dark?: string;
  kicking: boolean;
  idSuffix?: string;
}) {
  const kitId = `strikerKit${idSuffix}`;
  const skinId = `strikerSkin${idSuffix}`;

  return (
    <svg viewBox="0 0 70 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={kitId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
        <linearGradient id={skinId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3c99b" />
          <stop offset="100%" stopColor="#c98f5f" />
        </linearGradient>
      </defs>

      {kicking ? (
        <>
          {/* pierna de apoyo */}
          <path d="M30 62h8l-3 30h-8Z" fill="#1e293b" />
          <path d="M24 90h12v5H23Z" fill="#f8fafc" />
          {/* pierna que golpea, hacia adelante */}
          <path d="M38 64c7 0 16 4 22 10l-6 6c-5-5-11-7-17-7Z" fill="#0f172a" />
          <path d="M57 73h10v6H56Z" fill="#fbbf24" />
          {/* torso inclinado */}
          <path
            d="M26 36c1-6 5-9 11-9s11 4 11 10l2 20c0 5-4 8-12 8s-13-3-13-8Z"
            fill={`url(#${kitId})`}
          />
          {/* brazos en equilibrio */}
          <path d="M26 38 10 30l-3 7 18 9Z" fill={`url(#${kitId})`} />
          <path d="M48 38 64 30l3 7-18 9Z" fill={`url(#${kitId})`} />
          {/* cabeza */}
          <circle cx="37" cy="19" r="9.5" fill={`url(#${skinId})`} />
          <path d="M27.5 17a9.5 9.5 0 0 1 19 0c-3-3-6-4.5-9.5-4.5S30.5 14 27.5 17Z" fill="#1f2937" />
        </>
      ) : (
        <>
          {/* piernas */}
          <path d="M29 62h7l-2 30h-8Z" fill="#1e293b" />
          <path d="M38 62h7l3 30h-8Z" fill="#0f172a" />
          <path d="M24 90h11v5H23Z" fill="#f8fafc" />
          <path d="M40 90h11v5H39Z" fill="#e2e8f0" />
          {/* torso */}
          <path
            d="M27 34c0-5 4-8 10-8s10 3 10 8l3 22c0 5-4 8-13 8s-13-3-13-8Z"
            fill={`url(#${kitId})`}
          />
          {/* brazos relajados */}
          <path d="M27 36 18 56l6 3 7-18Z" fill={`url(#${kitId})`} />
          <path d="M47 36 56 56l-6 3-7-18Z" fill={`url(#${kitId})`} />
          {/* cabeza */}
          <circle cx="37" cy="19" r="9.5" fill={`url(#${skinId})`} />
          <path d="M27.5 17a9.5 9.5 0 0 1 19 0c-3-3-6-4.5-9.5-4.5S30.5 14 27.5 17Z" fill="#1f2937" />
        </>
      )}
    </svg>
  );
}

/** Sombra elíptica bajo una figura. */
export function Shadow({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[50%] bg-black/45 blur-[2px] ${className}`}
    />
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
export function Confetti({ pieces = 70 }: { pieces?: number }) {
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
        const size = 5 + (i % 4) * 2;
        return (
          <span
            key={i}
            className="ff-confetti absolute top-0 block rounded-[1px]"
            style={{
              left: `${left}%`,
              width: `${size}px`,
              height: `${size * 1.7}px`,
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
