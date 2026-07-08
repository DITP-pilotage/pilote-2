/** Formate une date ISO en `JJ/MM/AAAA` (locale fr-FR). `null` → tiret cadratin. */
export const formatDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—'
