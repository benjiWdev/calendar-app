import type { ElementName } from '~/types'

export function useEntryForm() {
  const loading = ref(false)
  const errorMsg = ref<string | null>(null)

  const form = reactive<{
    title: string
    description: string
    start_date: Date | null
    end_date: Date | null
    elements: ElementName[]
  }>({
    title: '',
    description: '',
    start_date: null,
    end_date: null,
    elements: [],
  })

  function resetForm(): void {
    form.title = ''
    form.description = ''
    form.start_date = null
    form.end_date = null
    form.elements = []
    errorMsg.value = null
  }

  function toISODate(date: Date): string {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-')
  }

  function extractErrorMessage(err: unknown, fallback: string): string {
    const data = (err as { data?: { message?: string; statusMessage?: string } })?.data
    if (data?.message) return data.message
    if (data?.statusMessage) return data.statusMessage
    if (err instanceof Error) return err.message
    return fallback
  }

  return { form, loading, errorMsg, resetForm, toISODate, extractErrorMessage }
}
