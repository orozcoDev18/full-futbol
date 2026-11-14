import { Ball } from "./Logo";

/** Balones rodando de lado a lado, detrás de todo. Decorativo. */
const BALLS = [
  { top: "12%", size: "3.2rem", duration: "26s", delay: "0s" },
  { top: "34%", size: "2rem", duration: "19s", delay: "-6s" },
  { top: "58%", size: "4rem", duration: "33s", delay: "-14s" },
  { top: "76%", size: "2.6rem", duration: "22s", delay: "-3s" },
  { top: "92%", size: "1.6rem", duration: "16s", delay: "-9s" },
];

export function PitchBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {BALLS.map((ball, index) => (
        <div
          key={index}
          className="ff-roll absolute"
          style={{
            top: ball.top,
            width: ball.size,
            height: ball.size,
            animationDuration: ball.duration,
            animationDelay: ball.delay,
          }}
        >
          <Ball className="h-full w-full opacity-[0.07]" />
        </div>
      ))}
    </div>
  );
}
