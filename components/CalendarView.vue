<template>
  <v-card elevation="2" rounded="lg">
    <!-- Month navigation header -->
    <v-card-title class="d-flex align-center pa-3 bg-surface-variant">
      <v-btn
        variant="text"
        icon="mdi-chevron-left"
        density="comfortable"
        @click="prevMonth"
      />
      <span class="flex-grow-1 text-center text-headline-small font-weight-bold">
        {{ monthLabel }}
      </span>
      <v-btn
        variant="text"
        icon="mdi-chevron-right"
        density="comfortable"
        @click="nextMonth"
      />
    </v-card-title>

    <v-divider />

    <!-- Calendar grid -->
    <div class="calendar-grid">
      <!-- Day-of-week headers -->
      <div
        v-for="name in DAY_NAMES"
        :key="name"
        class="calendar-header-cell text-body-small font-weight-bold text-center text-medium-emphasis py-2"
      >
        {{ name }}
      </div>

      <!-- Day cells -->
      <div
        v-for="day in calendarDays"
        :key="day.toISOString()"
        class="calendar-cell pa-1"
        :class="{
          'other-month': !isCurrentMonth(day),
          'is-today': isToday(day),
        }"
      >
        <!-- Day number badge -->
        <div class="d-flex mb-1">
          <div
            class="day-number text-body-small font-weight-medium"
            :class="isToday(day) ? 'today-badge' : ''"
          >
            {{ day.getDate() }}
          </div>
        </div>

        <!-- Entries for this day -->
        <div class="entries-list">
          <v-tooltip
            v-for="entry in getEntriesForDay(day)"
            :key="entry.id"
            location="top"
          >
            <template #activator="{ props: tooltipProps }">
              <v-chip
                v-bind="tooltipProps"
                size="x-small"
                class="entry-chip mb-1"
                :style="getChipStyle(entry)"
                label
              >
                <span class="entry-chip-text">{{ entry.title }}</span>
              </v-chip>
            </template>
            <div>
              <strong>{{ entry.title }}</strong>
              <div v-if="entry.elements?.length" class="text-body-small">
                {{ entry.elements.join(', ') }}
              </div>
              <div v-if="entry.description" class="text-body-small">
                {{ entry.description }}
              </div>
              <div class="text-body-small">
                {{ formatTime(entry.start_date) }}
                <template v-if="entry.end_date">
                  – {{ formatTime(entry.end_date) }}
                </template>
              </div>
            </div>
          </v-tooltip>

          <!-- Overflow indicator -->
          <div
            v-if="getEntriesForDay(day).length > MAX_VISIBLE_ENTRIES"
            class="text-body-small text-medium-emphasis pl-1"
          >
            +{{ getEntriesForDay(day).length - MAX_VISIBLE_ENTRIES }} more
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import type { CalendarEntry, ElementName } from '~/types'

const ELEMENT_COLORS: Record<ElementName, string> = {
  Magazzino: '#5C6BC0',
  Colmata: '#26A69A',
  Kuhstall: '#FFA726',
}

function getChipStyle(entry: CalendarEntry): Record<string, string> {
  const colors = (entry.elements ?? []).map((e) => ELEMENT_COLORS[e]).filter(Boolean)
  if (colors.length === 0) return {}
  if (colors.length === 1) return { backgroundColor: colors[0]!, color: '#fff' }
  const step = 100 / colors.length
  const stops = colors.flatMap((c, i) => [`${c} ${i * step}%`, `${c} ${(i + 1) * step}%`])
  return { background: `linear-gradient(90deg, ${stops.join(', ')})`, color: '#fff' }
}

const props = defineProps<{
  entries: CalendarEntry[]
}>()

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MAX_VISIBLE_ENTRIES = 3

const currentDate = ref(new Date())

const monthLabel = computed(() =>
  currentDate.value.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  }),
)

/** All days displayed in the grid, padded to full weeks on both sides. */
const calendarDays = computed((): Date[] => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()

  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  // Walk back to the Sunday that starts the first visible week
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())

  const days: Date[] = []
  const cursor = new Date(gridStart)

  while (cursor <= lastOfMonth || days.length % 7 !== 0) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
    if (days.length >= 42) break // cap at 6 rows
  }

  return days
})

function isCurrentMonth(day: Date): boolean {
  return (
    day.getMonth() === currentDate.value.getMonth() &&
    day.getFullYear() === currentDate.value.getFullYear()
  )
}

function isToday(day: Date): boolean {
  const now = new Date()
  return (
    day.getDate() === now.getDate() &&
    day.getMonth() === now.getMonth() &&
    day.getFullYear() === now.getFullYear()
  )
}

function getEntriesForDay(day: Date): CalendarEntry[] {
  return props.entries
    .filter((entry) => {
      const d = new Date(entry.start_date)
      return (
        d.getDate() === day.getDate() &&
        d.getMonth() === day.getMonth() &&
        d.getFullYear() === day.getFullYear()
      )
    })
    .slice(0, MAX_VISIBLE_ENTRIES + 1) // fetch one extra to show overflow count
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function prevMonth(): void {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() - 1)
  currentDate.value = d
}

function nextMonth(): void {
  const d = new Date(currentDate.value)
  d.setMonth(d.getMonth() + 1)
  currentDate.value = d
}
</script>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

/* Header cells */
.calendar-header-cell {
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.calendar-header-cell:last-child {
  border-right: none;
}

/* Day cells */
.calendar-cell {
  min-height: 110px;
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}
/* Remove right border on every 7th cell */
.calendar-cell:nth-child(7n) {
  border-right: none;
}
/* Remove bottom border on last row */
.calendar-cell:nth-last-child(-n + 7) {
  border-bottom: none;
}

.calendar-cell.other-month {
  background-color: rgba(var(--v-theme-surface-variant), 0.4);
}
.calendar-cell.is-today {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

/* Day number */
.day-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}
.today-badge {
  background-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
}

/* Entry chips */
.entries-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.entry-chip {
  width: 100%;
  cursor: pointer;
}
.entry-chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}
</style>
