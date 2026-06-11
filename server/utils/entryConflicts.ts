import type { Pool } from 'pg'
import type { ElementName } from '~/types'

/**
 * A subset of an existing calendar entry that overlaps a candidate booking.
 * Date fields are typed `string | Date` because the `pg` driver parses
 * PostgreSQL `DATE` columns into JS `Date` objects, while the request payload
 * supplies plain ISO `YYYY-MM-DD` strings.
 */
export interface BookingConflict {
  title: string
  start_date: string | Date
  end_date: string | Date
  elements: ElementName[]
}

export interface ConflictQuery {
  /** Candidate start date as an ISO `YYYY-MM-DD` string. */
  startDate: string
  /** Candidate end date as an ISO `YYYY-MM-DD` string. */
  endDate: string
  /** Elements the candidate booking wants to occupy. */
  elements: ElementName[]
  /** Entry id to ignore — used on update so an entry never conflicts with itself. */
  excludeId?: number
}

/**
 * Find the first existing entry whose date range overlaps the candidate range
 * AND shares at least one element. A booking may start on the day another one
 * ends, so touching ranges do not conflict — the comparison is strict:
 * `existing.start_date < candidate.end_date AND existing.end_date > candidate.start_date`.
 * The `&&` array-overlap operator tests for a shared element.
 *
 * Returns the conflicting entry, or `null` when the booking is free.
 */
export async function findConflictingEntry(
  pool: Pool,
  { startDate, endDate, elements, excludeId }: ConflictQuery,
): Promise<BookingConflict | null> {
  const params: Array<string | number | ElementName[]> = [startDate, endDate, elements]

  let excludeClause = ''
  if (excludeId !== undefined) {
    params.push(excludeId)
    excludeClause = ` AND id <> $${params.length}`
  }

  const result = await pool.query(
    `SELECT title, start_date, end_date, elements
     FROM calendar_entries
     WHERE start_date < $2
       AND end_date > $1
       AND elements && $3::text[]${excludeClause}
     ORDER BY start_date
     LIMIT 1`,
    params,
  )

  const conflict = (result.rows[0] ?? null) as BookingConflict | null

  if (import.meta.dev) {
    console.debug('[entries] conflict check', {
      startDate,
      endDate,
      elements,
      excludeId,
      conflict: conflict?.title ?? null,
    })
  }

  return conflict
}

/** Format a `DATE` value (from `pg`) or ISO string as German `DD.MM.YYYY`. */
function formatGermanDate(value: string | Date): string {
  if (typeof value === 'string') {
    const [year, month, day] = value.slice(0, 10).split('-')
    return `${day}.${month}.${year}`
  }
  const day = String(value.getDate()).padStart(2, '0')
  const month = String(value.getMonth() + 1).padStart(2, '0')
  return `${day}.${month}.${value.getFullYear()}`
}

/**
 * Build the German error message for a booking conflict, naming the first
 * element shared with the candidate and the existing booking's date range.
 * Example: `Kuhstall ist vom 12.06.2026 bis 14.06.2026 bereits gebucht.`
 */
export function buildConflictMessage(
  conflict: BookingConflict,
  candidateElements: ElementName[],
): string {
  const sharedElement =
    conflict.elements.find((element) => candidateElements.includes(element)) ?? conflict.elements[0]
  const from = formatGermanDate(conflict.start_date)
  const to = formatGermanDate(conflict.end_date)
  return `${sharedElement} ist vom ${from} bis ${to} bereits gebucht.`
}
