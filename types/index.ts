export interface CalendarEntry {
  id: number
  title: string
  description: string | null
  start_date: string
  start_time: string | null
  end_date: string | null
  end_time: string | null
  created_at: string
}

export interface CreateEntryPayload {
  title: string
  description?: string
  start_date: string
  start_time?: string
  end_date?: string
  end_time?: string
}
