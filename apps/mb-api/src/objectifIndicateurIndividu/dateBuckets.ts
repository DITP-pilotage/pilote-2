import { type DateTrunc } from '@pilote/mb-shared/valeurAvancement'

export const truncateDate = (dateStr: string, dateTrunc: DateTrunc): string => {
  const parts = dateStr.split('-')
  const year = parts[0]!
  const month = parseInt(parts[1]!)
  switch (dateTrunc) {
    case 'day':
      return dateStr
    case 'month':
      return `${year}-${String(month).padStart(2, '0')}-01`
    case 'quarter': {
      const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1
      return `${year}-${String(quarterStartMonth).padStart(2, '0')}-01`
    }
    case 'year':
      return `${year}-01-01`
    case 'week': {
      const day = parseInt(parts[2]!)
      const y = parseInt(year)
      const dow = isoWeekday(y, month, day) // 1=Mon ... 7=Sun
      const daysToMonday = 1 - dow
      return epochDaysToDateStr(dateToEpochDays(y, month, day) + daysToMonday)
    }
  }
}

// ISO weekday: 1=Monday ... 7=Sunday (Sakamoto's algorithm, adapted)
const isoWeekday = (y: number, m: number, d: number): number => {
  const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4]
  const yr = m < 3 ? y - 1 : y
  const dow0 =
    (yr + Math.floor(yr / 4) - Math.floor(yr / 100) + Math.floor(yr / 400) + t[m - 1]! + d) % 7
  // Sakamoto returns 0=Sun; convert to ISO 1=Mon...7=Sun
  return dow0 === 0 ? 7 : dow0
}

// Days since the proleptic Gregorian epoch (0001-01-01 = day 1)
const dateToEpochDays = (y: number, m: number, d: number): number => {
  const a = Math.floor((14 - m) / 12)
  const yr = y + 4800 - a
  const mo = m + 12 * a - 3
  return (
    d +
    Math.floor((153 * mo + 2) / 5) +
    365 * yr +
    Math.floor(yr / 4) -
    Math.floor(yr / 100) +
    Math.floor(yr / 400) -
    32045
  )
}

const epochDaysToDateStr = (n: number): string => {
  const a = n + 32044
  const b = Math.floor((4 * a + 3) / 146097)
  const c = a - Math.floor((146097 * b) / 4)
  const d = Math.floor((4 * c + 3) / 1461)
  const e = c - Math.floor((1461 * d) / 4)
  const mo = Math.floor((5 * e + 2) / 153)
  const day = e - Math.floor((153 * mo + 2) / 5) + 1
  const month = mo + 3 - 12 * Math.floor(mo / 10)
  const year = 100 * b + d - 4800 + Math.floor(mo / 10)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
