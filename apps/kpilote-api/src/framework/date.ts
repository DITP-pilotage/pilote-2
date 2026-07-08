import { Temporal } from '@js-temporal/polyfill'

/** Horloge centralisée : lit l'heure courante hors des chemins model/commands/queries. */
export const now = (): Temporal.Instant => Temporal.Now.instant()

/** Parse une chaîne ISO 8601 en `Temporal.Instant`. Lève si le format est invalide. */
export const parseIsoInstant = (iso: string): Temporal.Instant => Temporal.Instant.from(iso)

/** `Temporal.Instant` depuis une `Date` JS — frontière Prisma / API tierces. */
export const fromDate = (date: Date): Temporal.Instant =>
  Temporal.Instant.fromEpochMilliseconds(date.getTime())

/** `Date` JS depuis un `Temporal.Instant` — frontière Prisma / API tierces. */
export const toDate = (instant: Temporal.Instant): Date => new Date(instant.epochMilliseconds)
