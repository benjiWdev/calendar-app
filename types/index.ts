export type ElementName = 'Magazzino' | 'Colmata' | 'Kuhstall'

export interface CalendarEntry {
  id: number
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  elements: ElementName[]
  created_at: string
}

export interface CreateEntryPayload {
  title: string
  description?: string
  start_date: string
  end_date?: string
  elements?: ElementName[]
}
