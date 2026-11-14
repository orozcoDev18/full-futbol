import type { Metadata } from "next";
import Link from "next/link";
import { BallFlame, Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Guía — Full Fútbol",
  description:
    "Para qué sirve Full Fútbol y cómo usarlo: web pública, panel del organizador y el paso a paso de un torneo.",
};

const PUBLIC_PAGES = [
  {
    icon: "🏠",
    name: "Portada",
    what: "Lista de torneos y las últimas noticias publicadas.",
  },
  {
    icon: "📋",
    name: "Torneo",
    what: "Cinco pestañas: Posiciones, Goleadores, Partidos, Eliminatorias y Noticias. Arriba, el banner del campeón cuando el torneo termina.",
  },
  {
    icon: "🥅",
    name: "Penales",
    what: "Mini juego de tanda de penales para entretener mientras empieza el partido.",
  },
];

const PANEL_OPTIONS = [
  {
    icon: "👕",
    name: "Equipos",
    what: "Inscribir equipos y cargar su plantilla con dorsal y documento.",
  },
  {
    icon: "🎲",
    name: "Sorteo",
    what: "Sortear con animación de bombo: la eliminatoria previa o el reparto en grupos con su calendario.",
  },
  {
    icon: "📝",
    name: "Actas",
    what: "Cargar el partido desde el celular: un toque por gol o tarjeta sobre el jugador.",
  },
  {
    icon: "📊",
    name: "Posiciones",
    what: "Tabla con PJ, PG, PE, PP, GF, GC, DG y puntos, separada por grupo.",
  },
  {
    icon: "✅",
    name: "Resultados",
    what: "Los partidos ya jugados, ordenados por jornada.",
  },
  {
    icon: "📅",
    name: "Próximos",
    what: "Lo que falta por jugar.",
  },
  {
    icon: "🥇",
    name: "Goleadores",
    what: "Ranking de artilleros del torneo.",
  },
  {
    icon: "🏆",
    name: "Fase final",
    what: "Generar la llave sembrada con la tabla y seguir los cruces hasta el campeón.",
  },
  {
    icon: "📰",
    name: "Noticias",
    what: "Publicar textos que salen en la web pública.",
  },
];

const STEPS = [
  {
    title: "Crear el torneo",
    what: "Nombre y temporada. Queda con su enlace público propio.",
  },
  {
    title: "Inscribir equipos",
    what: "Cada equipo con su nombre y, si quieres, el escudo por URL. Dentro, los jugadores con dorsal y documento.",
  },
  {
    title: "Sortear",
    what: "Si se apuntaron más equipos de los que caben, primero la eliminatoria previa: un partido por pareja y el impar pasa sin jugar. Después el sorteo de grupos, que solo reparte a los clasificados.",
  },
  {
    title: "Cargar las actas",
    what: "Jornada a jornada. Al guardar, la tabla, los goleadores y la web pública quedan actualizados.",
  },
  {
    title: "Generar la llave",
    what: "De 2, 4 u 8 equipos. Se siembra con la tabla: los primeros de cada grupo arriba, para que no se crucen antes de tiempo.",
  },
  {
    title: "Jugar la fase final",
    what: "Cargas cada cruce y el ganador sube solo a la ronda siguiente. Quien gane la final queda marcado campeón.",
  },
  {
    title: "Compartir",
    what: "Manda el enlace del torneo por WhatsApp. Quien lo abra ve todo sin registrarse.",
  },
];

export default function GuiaPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-6">
      <header className="relative mb-8 overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-pitch-dark/60 to-neutral-950 px-5 py-8 text-center">
        <BallFlame
          className="pointer-events-none absolute -right-6 -top-4 h-40 w-32 opacity-10"
          idSuffix="guia"
        />
        <Link href="/">
          <Logo className="justify-center text-3xl" />
        </Link>
        <h1 className="ff-wordmark mt-4 text-4xl leading-none">Guía rápida</h1>
        <p className="mx-auto mt-3 max-w-md text-balance text-sm text-neutral-300">
          Para qué sirve y cómo se usa, en una pantalla.
        </p>
      </header>

      <section className="card mb-8">
        <h2 className="ff-wordmark text-2xl text-pitch-light">Qué es</h2>
        <p className="mt-2 text-neutral-200">
          Full Fútbol organiza torneos de fútbol amateur. El organizador carga
          los equipos, sortea el calendario y anota los goles desde el celular;
          cualquiera sigue la tabla y los resultados por un enlace, sin
          registrarse.
        </p>
        <p className="mt-3 text-neutral-200">
          Son dos caras de lo mismo: una{" "}
          <strong className="text-white">web pública</strong> que se comparte
          por WhatsApp y un{" "}
          <strong className="text-white">panel privado</strong> al que solo
          entra el organizador con usuario y contraseña.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="ff-wordmark mb-1 text-2xl">La web pública</h2>
        <p className="mb-3 text-sm text-neutral-400">
          Sin login. Se actualiza sola en cuanto se guarda un acta.
        </p>
        <ul className="space-y-2">
          {PUBLIC_PAGES.map((page) => (
            <li key={page.name} className="card flex gap-3">
              <span className="text-2xl">{page.icon}</span>
              <span className="min-w-0">
                <span className="block font-bold uppercase tracking-wide">
                  {page.name}
                </span>
                <span className="text-sm text-neutral-300">{page.what}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="ff-wordmark mb-1 text-2xl">El panel del organizador</h2>
        <p className="mb-3 text-sm text-neutral-400">
          Entras por <code className="text-pitch-light">/login</code>. Eliges un
          torneo (o lo creas) y aparece este menú.
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PANEL_OPTIONS.map((option) => (
            <div key={option.name} className="card">
              <p className="text-2xl">{option.icon}</p>
              <p className="font-bold uppercase tracking-wide">{option.name}</p>
              <p className="text-sm text-neutral-300">{option.what}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-2xl border border-pitch-light/30 bg-pitch-dark/20 px-4 py-3 text-sm text-neutral-200">
          <strong className="text-pitch-light">Lo que hace solo:</strong> al
          guardar el acta de un cruce, el ganador pasa a la ronda siguiente, y
          quien gane la final queda marcado campeón. Si un cruce de eliminación
          termina empatado, la app te pide elegir qué equipo avanza.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="ff-wordmark mb-3 text-2xl">Un torneo de principio a fin</h2>
        <ol className="space-y-2">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pitch-light font-bold text-white">
                {index + 1}
              </span>
              <span className="min-w-0">
                <span className="block font-bold">{step.title}</span>
                <span className="text-sm text-neutral-300">{step.what}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-neutral-200">
          <strong className="text-amber-300">Ojo:</strong> rehacer un sorteo
          borra lo que venía después. El de grupos borra los partidos de grupos
          con sus goles; el de la previa borra además los grupos y la fase
          final.
        </p>
      </section>

      <section className="card mb-8">
        <h2 className="ff-wordmark text-2xl">Preguntas rápidas</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-bold text-white">
              ¿Tienen que registrarse los jugadores?
            </dt>
            <dd className="text-neutral-300">
              No. Solo el organizador tiene usuario. El resto entra por el
              enlace y ve todo.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-white">
              ¿Se puede anotar un gol sin saber quién lo hizo?
            </dt>
            <dd className="text-neutral-300">
              Sí. En el acta, los botones + y − del marcador suman goles sin
              jugador, para los goles en contra o los que nadie reclama.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-white">¿Cuántos grupos admite?</dt>
            <dd className="text-neutral-300">
              Hasta cuatro, o liga única con todos contra todos. Lo eliges en el
              sorteo.
            </dd>
          </div>
          <div>
            <dt className="font-bold text-white">
              ¿Cómo agrego otro organizador?
            </dt>
            <dd className="text-neutral-300">
              Desde la carpeta del proyecto:{" "}
              <code className="text-pitch-light">
                npm run create-admin -- usuario clave ADMIN
              </code>
              .
            </dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href="/" className="btn-ghost flex-1">
          Ver los torneos
        </Link>
        <Link href="/login" className="btn-primary flex-1">
          Entrar al panel
        </Link>
      </div>

      <footer className="mt-10 text-center text-xs text-neutral-600">
        Full Fútbol · gestión de torneos amateur
      </footer>
    </main>
  );
}
