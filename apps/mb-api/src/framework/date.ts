/** Parse an ISO 8601 string to a Date object. */
export const parseIsoDate = (isoString: string): Date => new Date(isoString)

/** Horloge centralisée : lit l'heure courante hors des chemins model/commands/queries. */
export const now = (): Date => new Date()
