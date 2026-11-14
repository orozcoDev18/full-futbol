/** Balón de fútbol a secas (fondo, decoración). */
export function Ball({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#f8fafc" />
      <g fill="#0f172a">
        <polygon points="16,8 21.6,12.1 19.4,18.7 12.6,18.7 10.4,12.1" />
        <path d="M15 1.2h2v5.2h-2z" />
        <path d="M15 1.2h2v5.2h-2z" transform="rotate(72 16 16)" />
        <path d="M15 1.2h2v5.2h-2z" transform="rotate(144 16 16)" />
        <path d="M15 1.2h2v5.2h-2z" transform="rotate(216 16 16)" />
        <path d="M15 1.2h2v5.2h-2z" transform="rotate(288 16 16)" />
      </g>
      <circle cx="16" cy="16" r="15" fill="none" stroke="#0f172a" strokeWidth="1.6" />
    </svg>
  );
}

/** Balón de fútbol envuelto en llamas. Ocupa el lugar de la "O" en FÚTBOL. */
export function BallFlame({
  className = "",
  idSuffix = "",
}: {
  className?: string;
  idSuffix?: string;
}) {
  const flameId = `flame${idSuffix}`;
  const ballId = `ball${idSuffix}`;

  return (
    <svg
      viewBox="0 0 44 52"
      className={className}
      role="img"
      aria-label="balón en llamas"
    >
      <defs>
        <linearGradient id={flameId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="45%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fde047" />
        </linearGradient>
        <radialGradient id={ballId} cx="35%" cy="28%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </radialGradient>
      </defs>

      {/* Llamas: una lengua grande y dos chispas, con parpadeo suave. */}
      <g className="ff-flame" fill={`url(#${flameId})`}>
        <path d="M22 0c5 7 2 10 5 13 2-2 2-4 2-6 4 5 7 10 7 16 0 4-1 7-3 10-1-9-5-13-8-15 1 5-1 8-4 10-2-2-3-5-2-8-3 2-5 6-5 10-3-4-4-8-4-12 0-8 6-13 12-18Z" />
        <path
          d="M7 18c2 2 3 5 3 8-3-1-5-4-5-8Z"
          className="ff-flame-spark"
          opacity="0.85"
        />
        <path
          d="M37 20c-2 2-3 5-3 8 3-1 5-4 5-8Z"
          className="ff-flame-spark"
          opacity="0.85"
        />
      </g>

      {/* Balón */}
      <circle cx="22" cy="35" r="14" fill={`url(#${ballId})`} />
      <g fill="#0f172a">
        <polygon points="22,28 27.2,31.8 25.2,37.9 18.8,37.9 16.8,31.8" />
        <path d="M21 21.3h2v5.2h-2z" transform="rotate(0 22 24)" />
        <path d="M21 21.3h2v5.2h-2z" transform="rotate(72 22 35)" />
        <path d="M21 21.3h2v5.2h-2z" transform="rotate(144 22 35)" />
        <path d="M21 21.3h2v5.2h-2z" transform="rotate(216 22 35)" />
        <path d="M21 21.3h2v5.2h-2z" transform="rotate(288 22 35)" />
      </g>
      <circle
        cx="22"
        cy="35"
        r="14"
        fill="none"
        stroke="#0f172a"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Logo({
  className = "",
  ballClassName = "h-[1.15em] w-[0.97em]",
}: {
  className?: string;
  ballClassName?: string;
}) {
  return (
    <span
      className={`ff-wordmark inline-flex items-center gap-[0.08em] leading-none ${className}`}
    >
      <span>FULL</span>
      <span className="inline-flex items-center">
        <span>FÚTB</span>
        <BallFlame className={`${ballClassName} -mb-[0.1em]`} />
        <span>L</span>
      </span>
    </span>
  );
}
