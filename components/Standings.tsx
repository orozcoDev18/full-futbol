import type { StandingRow } from "@/lib/tournament-engine";

export function StandingsTable({
  rows,
  title,
}: {
  rows: StandingRow[];
  title?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div>
      {title && (
        <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-pitch-light">
          {title}
        </h3>
      )}
      <div className="overflow-x-auto rounded-2xl border border-neutral-800">
        <table className="w-full min-w-[22rem] text-sm">
          <thead className="bg-neutral-900 text-xs uppercase text-neutral-400">
            <tr>
              <th className="px-2 py-2 text-left">#</th>
              <th className="px-2 py-2 text-left">Equipo</th>
              <th className="px-1.5 py-2">PJ</th>
              <th className="px-1.5 py-2">PG</th>
              <th className="px-1.5 py-2">PE</th>
              <th className="px-1.5 py-2">PP</th>
              <th className="px-1.5 py-2">GF</th>
              <th className="px-1.5 py-2">GC</th>
              <th className="px-1.5 py-2">DG</th>
              <th className="px-2 py-2">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rows.map((row) => (
              <tr key={row.teamId} className="text-center tabular-nums">
                <td className="px-2 py-2 text-left text-neutral-500">
                  {row.position}
                </td>
                <td className="max-w-[9rem] truncate px-2 py-2 text-left font-semibold">
                  {row.teamName}
                </td>
                <td className="px-1.5 py-2">{row.pj}</td>
                <td className="px-1.5 py-2">{row.pg}</td>
                <td className="px-1.5 py-2">{row.pe}</td>
                <td className="px-1.5 py-2">{row.pp}</td>
                <td className="px-1.5 py-2">{row.gf}</td>
                <td className="px-1.5 py-2">{row.gc}</td>
                <td className="px-1.5 py-2">{row.dg}</td>
                <td className="px-2 py-2 font-bold text-pitch-light">
                  {row.pts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
