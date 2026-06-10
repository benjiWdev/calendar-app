import type { CalendarEntry, ElementName } from '~/types'
import { ELEMENT_OPTIONS } from '~/constants/elements'

/** A month to summarise, identified by year and 0-based month index. */
export interface MonthRef {
  year: number
  /** 0-based month index (0 = January), matching `Date.getMonth()`. */
  month: number
}

/** A contiguous run of booked days within a month (1-based, inclusive). */
export interface DayRange {
  start: number
  end: number
}

/** Booking summary for a single month: booked timeframes per element. */
export interface MonthBookingSummary {
  year: number
  month: number
  daysInMonth: number
  /** Contiguous booked day-of-month ranges per element (ascending, non-overlapping). */
  perElement: Record<ElementName, DayRange[]>
}

/**
 * Normalise an ISO date string to local-timezone midnight.
 *
 * Mirrors `CalendarView.vue` exactly: `pg` DATE columns serialise to UTC-midnight
 * ISO strings, so we rebuild the date from its LOCAL parts to keep day-of-month
 * comparisons aligned with the calendar grid (no month-boundary off-by-one).
 */
function toMidnight(isoStr: string): Date {
  const d = new Date(isoStr)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** Group a set of booked day-of-month numbers into contiguous ascending ranges. */
function toRanges(days: Set<number>): DayRange[] {
  const sorted = [...days].sort((a, b) => a - b)
  const ranges: DayRange[] = []
  for (const day of sorted) {
    const last = ranges[ranges.length - 1]
    if (last && day === last.end + 1) {
      last.end = day
    } else {
      ranges.push({ start: day, end: day })
    }
  }
  return ranges
}

/**
 * Pure, stateless helper to summarise how many days of each month are booked by
 * each element. Reactivity comes from the caller passing reactive arguments.
 *
 * A day counts as booked for element X if it falls within any entry's inclusive
 * [start_date, end_date] range that includes X. Overlapping entries count a given
 * day only once (per-element `Set` of day-of-month numbers).
 */
export function useMonthBookingSummary() {
  function summarize(
    entries: CalendarEntry[],
    months: MonthRef[],
  ): MonthBookingSummary[] {
    return months.map(({ year, month }) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month, daysInMonth)

      // One Set of day-of-month numbers per element — guarantees distinct days.
      const dayBuckets = ELEMENT_OPTIONS.reduce((acc, el) => {
        acc[el] = new Set<number>()
        return acc
      }, {} as Record<ElementName, Set<number>>)

      for (const entry of entries) {
        if (!entry.start_date || !entry.end_date || !entry.elements?.length) continue

        const start = toMidnight(entry.start_date)
        const end = toMidnight(entry.end_date)
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue

        // Clamp the entry's range to the current month (inclusive on both ends).
        const from = start > monthStart ? start : monthStart
        const to = end < monthEnd ? end : monthEnd
        if (from > to) continue

        // Ignore any unknown/legacy element values not in ELEMENT_OPTIONS.
        const elements = entry.elements.filter(
          (el): el is ElementName => el in dayBuckets,
        )
        if (elements.length === 0) continue

        const cursor = new Date(from)
        while (cursor <= to) {
          const dayNum = cursor.getDate()
          for (const el of elements) dayBuckets[el].add(dayNum)
          cursor.setDate(cursor.getDate() + 1)
        }
      }

      const perElement = ELEMENT_OPTIONS.reduce((acc, el) => {
        acc[el] = toRanges(dayBuckets[el])
        return acc
      }, {} as Record<ElementName, DayRange[]>)

      return { year, month, daysInMonth, perElement }
    })
  }

  return { summarize }
}
