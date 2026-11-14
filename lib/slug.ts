export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Slug público del torneo: legible y único sin consultar la base. */
export function tournamentSlug(name: string): string {
  const base = slugify(name) || "torneo";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}
