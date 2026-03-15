export interface CalendarEntry {
  id: number
  title: string
  description: string | null
  start_date: string
  end_date: string | null
  created_at: string
}

export interface CreateEntryPayload {
  title: string
  description?: string
  start_date: string
  end_date?: string
}
