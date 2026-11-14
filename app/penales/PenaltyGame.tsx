"use client";

import { useEffect, useState } from "react";
import { Ball } from "@/components/Logo";
import { Confetti, Keeper, Striker } from "./Figures";

/** Seis zonas de la portería: arriba y abajo por izquierda, centro y derecha. */
const ZONES = [
  { key: "TL", label: "Arriba izquierda", x: 18, y: 30, dive: -1 },
  { key: "TC", label: "Arriba centro", x: 50, y: 24, dive: 0 },
  { key: "TR", label: "Arriba derecha", x: 82, y: 30, dive: 1 },
  { key: "BL", label: "Abajo izquierda", x: 18, y: 62, dive: -1 },
  { key: "BC", label: "Abajo centro", x: 50, y: 64, dive: 0 },
  { key: "BR", label: "Abajo derecha", x: 82, y: 62, dive: 1 },
] as const;

type ZoneKey = (typeof ZONES)[number]["key"];

const ROUNDS = 5;
const RESOLVE_MS = 2100;

type Phase = "shoot" | "save" | "over";

interface Shot {
  ball: ZoneKey;
  keeper: ZoneKey;
  scored: boolean;
  /** Quién pateó: tú o el rival. */
  mine: boolean;
}

const zoneOf = (key: ZoneKey) => ZONES.find((zone) => zone.key === key)!;

function randomZone(): ZoneKey {
  return ZONES[Math.floor(Math.random() * ZONES.length)].key;
}

/**
 * El portero tapa si cubre la misma zona, pero los tiros a la escuadra
 * se le escapan a veces: patear arriba es más arriesgado y más vistoso.
 */
function isSaved(ball: ZoneKey, keeper: ZoneKey): boolean {
  if (ball !== keeper) return false;
  const tough = ball === "TL" || ball === "TR";
  return tough ? Math.random() > 0.35 : true;
}

export default function PenaltyGame() {
  const [phase, setPhase] = useState<Phase>("shoot");
  const [round, setRound] = useState(1);
  const [you, setYou] = useState(0);
  const [cpu, setCpu] = useState(0);
  const [shot, setShot] = useState<Shot | null>(null);
  const [message, setMessage] = useState("Elige dónde patear");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(() => {
      setShot(null);
      setBusy(false);
      if (phase === "shoot") {
        setPhase("save");
        setMessage("Ahora ataja: elige dónde te lanzas");
        return;
      }
      if (round >= ROUNDS) {
        setPhase("over");
        return;
      }
      setRound((current) => current + 1);
      setPhase("shoot");
      setMessage("Elige dónde patear");
    }, RESOLVE_MS);
    return () => clearTimeout(timer);
  }, [busy, phase, round]);

  function play(zone: ZoneKey) {
    if (busy || phase === "over") return;

    if (phase === "shoot") {
      const keeper = randomZone();
      const saved = isSaved(zone, keeper);
      setShot({ ball: zone, keeper, scored: !saved, mine: true });
      if (!saved) setYou((score) => score + 1);
      setMessage(saved ? "¡Atajadón!" : "¡GOOOL!");
    } else {
      const ball = randomZone();
      const saved = isSaved(ball, zone);
      setShot({ ball, keeper: zone, scored: !saved, mine: false });
      if (!saved) setCpu((score) => score + 1);
      setMessage(saved ? "¡La sacaste!" : "Gol del rival…");
    }
    setBusy(true);
  }

  function restart() {
    setPhase("shoot");
    setRound(1);
    setYou(0);
    setCpu(0);
    setShot(null);
    setBusy(false);
    setMessage("Elige dónde patear");
  }

  const ballZone = shot ? zoneOf(shot.ball) : null;
  const keeperZone = shot ? zoneOf(shot.keeper) : null;
  const won = you > cpu;
  const result = won ? "¡Ganaste la tanda!" : you < cpu ? "Perdiste la tanda" : "Empate";
  const shooterColor = phase === "save" ? "#e11d48" : "#12a05a";

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between gap-3 py-3">
        <Score label="Tú" value={you} highlight />
        <div className="min-w-0 text-center">
          <p
            key={message + round + phase}
            className={`ff-pop truncate text-sm font-bold ${
              shot?.scored === true && shot.mine
                ? "text-pitch-light"
                : shot && !shot.scored
                  ? "text-amber-300"
                  : "text-neutral-200"
            }`}
          >
            {message}
          </p>
          <p className="text-xs text-neutral-500">
            {phase === "over" ? "Tanda terminada" : `Penal ${round} de ${ROUNDS}`}
          </p>
        </div>
        <Score label="Rival" value={cpu} />
      </div>

      {/* Escena: portería, portero, pateador y balón */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-b from-sky-950/60 via-neutral-900 to-pitch-dark/70 sm:aspect-[16/10]">
        {/* césped */}
        <div className="absolute inset-x-0 bottom-0 h-[32%] bg-gradient-to-b from-pitch-dark/80 to-pitch/50" />
        <div className="absolute inset-x-[12%] bottom-[30%] h-[1px] bg-white/25" />

        {/* portería */}
        <div
          className={`absolute left-[8%] right-[8%] top-[10%] h-[58%] rounded-t-md border-x-4 border-t-4 border-neutral-100/90 ${
            shot?.scored ? "ff-net-shake" : ""
          }`}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "8% 14%",
            }}
          />
        </div>

        {/* portero */}
        <div
          className="pointer-events-none absolute h-[28%] w-[18%] transition-all duration-500 ease-out"
          style={{
            left: keeperZone ? `${keeperZone.x}%` : "50%",
            top: keeperZone ? `${keeperZone.y}%` : "44%",
            transform: `translate(-50%, -50%) rotate(${
              keeperZone ? (keeperZone.dive as number) * 55 : 0
            }deg)`,
          }}
        >
          <Keeper className="h-full w-full" dive={keeperZone?.dive ?? 0} />
        </div>

        {/* pateador */}
        <div className="pointer-events-none absolute bottom-[2%] left-[50%] h-[30%] w-[20%] -translate-x-[150%]">
          <Striker
            className={`h-full w-full ${busy ? "ff-kick" : ""}`}
            color={shooterColor}
            kicking={busy}
          />
        </div>

        {/* balón */}
        <div
          className="pointer-events-none absolute h-[11%] w-[8%] transition-all duration-700 ease-out"
          style={{
            left: ballZone ? `${ballZone.x}%` : "42%",
            top: ballZone ? `${ballZone.y}%` : "84%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <Ball className={`h-full w-full ${busy ? "ff-spin" : ""}`} />
        </div>

        {/* zonas para tocar */}
        <div className="absolute left-[8%] right-[8%] top-[10%] grid h-[58%] grid-cols-3 grid-rows-2 gap-1 p-1">
          {ZONES.map((zone) => (
            <button
              key={zone.key}
              type="button"
              onClick={() => play(zone.key)}
              disabled={busy || phase === "over"}
              aria-label={zone.label}
              className="rounded-md border border-white/10 transition hover:bg-white/15 active:bg-white/25 disabled:hover:bg-transparent"
            />
          ))}
        </div>

        {/* cartelón de gol o atajada */}
        {shot && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p
              className={`ff-shout ff-wordmark text-5xl drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] sm:text-7xl ${
                shot.scored
                  ? shot.mine
                    ? "text-pitch-light"
                    : "text-red-400"
                  : "text-amber-300"
              }`}
            >
              {shot.scored ? "¡GOL!" : "¡ATAJÓ!"}
            </p>
          </div>
        )}

        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-neutral-950/85 px-4 text-center">
            {won && <Confetti />}
            <p className="ff-wordmark ff-pop text-4xl sm:text-5xl">{result}</p>
            <p className="text-lg font-bold tabular-nums">
              {you} - {cpu}
            </p>
            <button type="button" onClick={restart} className="btn-primary">
              Otra tanda
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-neutral-500">
        {phase === "save"
          ? "Te toca de portero: toca la zona que vas a cubrir."
          : "Toca una zona de la portería para patear. A la escuadra es más difícil que te la saquen."}
      </p>
    </div>
  );
}

function Score({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-xs uppercase tracking-wide text-neutral-400">{label}</p>
      <p
        key={value}
        className={`ff-pop text-3xl font-extrabold tabular-nums ${
          highlight ? "text-pitch-light" : "text-neutral-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
