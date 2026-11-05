const DAY_MS = 24 * 60 * 60 * 1000

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

const isToday = (date: Date, now: Date) => startOfDay(date) === startOfDay(now)

const isThisWeek = (date: Date, now: Date) => startOfDay(now) - startOfDay(date) < 7 * DAY_MS

const isSameYear = (date: Date, now: Date) => date.getFullYear() === now.getFullYear()

const isThisMonth = (date: Date, now: Date) =>
  isSameYear(date, now) && date.getMonth() === now.getMonth()

const monthLabel = (date: Date, now: Date): string => {
  const label = date.toLocaleDateString('fr-FR', {
    month: 'long',
    ...(isSameYear(date, now) ? {} : { year: 'numeric' }),
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

const periodLabel = (date: Date, now: Date): string => {
  if (isToday(date, now)) return "Aujourd'hui"
  if (isThisWeek(date, now)) return 'Cette semaine'
  if (isThisMonth(date, now)) return 'Ce mois-ci'
  return monthLabel(date, now)
}

export type ConversationGroup<T> = { label: string; items: T[] }

/** Des conversations déjà triées, regroupées par période consécutive. */
export const groupByPeriod = <T extends { updatedAt: string }>(
  items: ReadonlyArray<T>,
  now: Date,
): ConversationGroup<T>[] => {
  const groups: ConversationGroup<T>[] = []
  for (const item of items) {
    const label = periodLabel(new Date(item.updatedAt), now)
    const last = groups.at(-1)
    if (last?.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export const matchesSearch = (titre: string, query: string): boolean =>
  normalize(titre).includes(normalize(query.trim()))

export const formatConversationDate = (iso: string, now: Date): string => {
  const date = new Date(iso)
  if (isToday(date, now)) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    ...(isSameYear(date, now) ? {} : { year: 'numeric' }),
  })
}
