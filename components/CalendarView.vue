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

    <!-- Day-of-week header row -->
    <div class="calendar-header-row">
      <div
        v-for="name in DAY_NAMES"
        :key="name"
        class="calendar-header-cell text-body-small font-weight-bold text-center text-medium-emphasis py-2"
      >
        {{ name }}
      </div>
    </div>

    <!-- Week rows -->
    <div
      v-for="(week, wi) in calendarWeeks"
      :key="wi"
      class="week-row"
      :class="{ 'week-row-last': wi === calendarWeeks.length - 1 }"
      :style="{ height: weekHeights[wi] + 'px' }"
    >
      <!-- Day cell backgrounds, borders, and day numbers -->
      <div class="day-cells-layer">
        <div
          v-for="day in week"
          :key="day.toISOString()"
          class="calendar-cell"
          :class="{
            'other-month': !isCurrentMonth(day),
            'is-today': isToday(day),
          }"
        >
          <div class="day-number-wrap">
            <div
              class="day-number text-body-small font-weight-medium"
              :class="{ 'today-badge': isToday(day) }"
            >
              {{ day.getDate() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Event bars -->
      <div class="event-bars-layer">
        <v-tooltip
          v-for="bar in weekBarsMap[wi]"
          :key="`${bar.entry.id}-${wi}`"
          location="top"
        >
          <template #activator="{ props: tp }">
            <div
              v-bind="tp"
              class="event-bar"
              :class="{
                'bar-cap-left': bar.isStart,
                'bar-cap-right': bar.isEnd,
              }"
              :style="{
                left: `calc(${(bar.startCol / 7) * 100}% + 2px)`,
                width: `calc(${(bar.span / 7) * 100}% - 4px)`,
                top: `${bar.row * BAR_ROW_HEIGHT}px`,
                ...getBarStyle(bar.entry),
              }"
            >
              <span v-if="bar.isStart || bar.startCol === 0" class="bar-text">
                {{ bar.entry.title }}
              </span>
            </div>
          </template>
          <div>
            <strong>{{ bar.entry.title }}</strong>
            <div v-if="bar.entry.elements?.length" class="text-body-small">
              {{ bar.entry.elements.join(', ') }}
            </div>
            <div v-if="bar.entry.description" class="text-body-small">
              {{ bar.entry.description }}
            </div>
            <div class="text-body-small">
              {{ formatDate(bar.entry.start_date) }}
              <template v-if="bar.entry.end_date">
                – {{ formatDate(bar.entry.end_date) }}
              </template>
            </div>
          </div>
        </v-tooltip>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import type { CalendarEntry, ElementName } from '~/types'

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const ELEMENT_COLORS: Record<ElementName, string> = {
  Magazzino: '#5C6BC0',
  Colmata: '#26A69A',
  Kuhstall: '#FFA726',
}
/** Pixel height of the day-number row at the top of each week row. */
const DAY_NUM_HEIGHT = 32
/** Pixel height allocated per event-bar lane. */
const BAR_ROW_HEIGHT = 22
/** Minimum padding below the last event bar (or below day-number row when empty). */
const WEEK_BOTTOM_PAD = 8

// ── Props ────────────────────────────────────────────────────────────────────

const props = defineProps<{ entries: CalendarEntry[] }>()

// ── State ─────────────────────────────────────────────────────────────────────

const currentDate = ref(new Date())

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Normalise an ISO string to local-timezone midnight so date comparisons are safe. */
function toMidnight(isoStr: string): Date {
  const d = new Date(isoStr)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isSameDayOrAfter(a: Date, b: Date): boolean {
  return a.getTime() >= b.getTime()
}

function isSameDayOrBefore(a: Date, b: Date): boolean {
  return a.getTime() <= b.getTime()
}

// ── Computed: calendar structure ──────────────────────────────────────────────

const monthLabel = computed(() =>
  currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
)

/** All days shown in the grid, padded to full weeks on both sides. */
const calendarDays = computed((): Date[] => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)
  const gridStart = new Date(firstOfMonth)
  gridStart.setDate(gridStart.getDate() - gridStart.getDay())
  const days: Date[] = []
  const cursor = new Date(gridStart)
  while (cursor <= lastOfMonth || days.length % 7 !== 0) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
    if (days.length >= 42) break
  }
  return days
})

/** calendarDays grouped into weeks (arrays of 7). */
const calendarWeeks = computed((): Date[][] => {
  const days = calendarDays.value
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
})

// ── Types ─────────────────────────────────────────────────────────────────────

interface WeekBar {
  entry: CalendarEntry
  /** First column index (0–6) this bar occupies within the week. */
  startCol: number
  /** Number of columns the bar spans (1–7). */
  span: number
  /** Vertical lane index (0+) to prevent bar overlap. */
  row: number
  /** True when the entry actually starts in this week (not a continuation). */
  isStart: boolean
  /** True when the entry actually ends in this week (not cut off). */
  isEnd: boolean
}

// ── Event-bar placement ────────────────────────────────────────────────────────

function computeWeekBars(week: Date[]): WeekBar[] {
  const weekStart = week[0]
  const weekEnd = week[6]

  // Collect entries that overlap this week
  const relevant = props.entries.filter((entry) => {
    const start = toMidnight(entry.start_date)
    const end = entry.end_date ? toMidnight(entry.end_date) : start
    return isSameDayOrBefore(start, weekEnd) && isSameDayOrAfter(end, weekStart)
  })

  // Longer spans first so they get lower lane numbers (visual priority)
  relevant.sort((a, b) => {
    const aStart = toMidnight(a.start_date)
    const aEnd = a.end_date ? toMidnight(a.end_date) : aStart
    const bStart = toMidnight(b.start_date)
    const bEnd = b.end_date ? toMidnight(b.end_date) : bStart
    const aSpan = Math.round((aEnd.getTime() - aStart.getTime()) / 86400000)
    const bSpan = Math.round((bEnd.getTime() - bStart.getTime()) / 86400000)
    if (bSpan !== aSpan) return bSpan - aSpan
    return aStart.getTime() - bStart.getTime()
  })

  const bars: WeekBar[] = []
  // rowOccupancy[lane] = list of [startCol, endCol] (inclusive) already placed
  const rowOccupancy: [number, number][][] = []

  for (const entry of relevant) {
    const entryStart = toMidnight(entry.start_date)
    const entryEnd = entry.end_date ? toMidnight(entry.end_date) : entryStart

    const startCol = Math.max(
      0,
      Math.round((entryStart.getTime() - weekStart.getTime()) / 86400000),
    )
    const endCol = Math.min(
      6,
      Math.round((entryEnd.getTime() - weekStart.getTime()) / 86400000),
    )

    // Greedy lane assignment: find first lane with no column overlap
    let lane = 0
    while (true) {
      if (!rowOccupancy[lane]) {
        rowOccupancy[lane] = []
        break
      }
      const blocked = rowOccupancy[lane].some(([s, e]) => startCol <= e && endCol >= s)
      if (!blocked) break
      lane++
    }
    if (!rowOccupancy[lane]) rowOccupancy[lane] = []
    rowOccupancy[lane].push([startCol, endCol])

    bars.push({
      entry,
      startCol,
      span: endCol - startCol + 1,
      row: lane,
      isStart: isSameDayOrAfter(entryStart, weekStart),
      isEnd: isSameDayOrBefore(entryEnd, weekEnd),
    })
  }

  return bars
}

/** Pre-computed bars for every week (avoids double computation in template). */
const weekBarsMap = computed(() => calendarWeeks.value.map(computeWeekBars))

/** Pre-computed pixel height for each week row. */
const weekHeights = computed(() =>
  weekBarsMap.value.map((bars) => {
    const laneCount = bars.length > 0 ? Math.max(...bars.map((b) => b.row)) + 1 : 0
    return DAY_NUM_HEIGHT + laneCount * BAR_ROW_HEIGHT + WEEK_BOTTOM_PAD
  }),
)

// ── Styling ───────────────────────────────────────────────────────────────────

function getBarStyle(entry: CalendarEntry): Record<string, string> {
  const colors = (entry.elements ?? []).map((e) => ELEMENT_COLORS[e]).filter(Boolean)
  if (colors.length === 0)
    return { backgroundColor: 'rgb(var(--v-theme-primary))', color: '#fff' }
  if (colors.length === 1) return { backgroundColor: colors[0]!, color: '#fff' }
  const step = 100 / colors.length
  const stops = colors.flatMap((c, i) => [`${c} ${i * step}%`, `${c} ${(i + 1) * step}%`])
  return { background: `linear-gradient(140deg, ${stops.join(', ')})`, color: '#fff' }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

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

function formatDate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Navigation ────────────────────────────────────────────────────────────────

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
/* ── Header row ─────────────────────────────────────────────────────────────── */
.calendar-header-row {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.calendar-header-cell {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.calendar-header-cell:last-child {
  border-right: none;
}

/* ── Week rows ───────────────────────────────────────────────────────────────── */
.week-row {
  min-height: 110px;
  position: relative;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.week-row-last {
  border-bottom: none;
}

/* ── Day cells layer ─────────────────────────────────────────────────────────── */
.day-cells-layer {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.calendar-cell {
  border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}
.calendar-cell:last-child {
  border-right: none;
}

.calendar-cell.other-month {
  background-color: rgba(var(--v-theme-surface-variant), 0.4);
}
.calendar-cell.is-today {
  background-color: rgba(var(--v-theme-primary), 0.06);
}

.day-number-wrap {
  height: 32px; /* = DAY_NUM_HEIGHT */
  display: flex;
  align-items: center;
  padding: 4px 6px;
}

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

/* ── Event bars layer ────────────────────────────────────────────────────────── */
.event-bars-layer {
  position: absolute;
  top: 32px; /* = DAY_NUM_HEIGHT */
  left: 0;
  right: 0;
}

.event-bar {
  position: absolute;
  height: 18px;
  border-radius: 0;
  display: flex;
  align-items: center;
  padding: 0 5px;
  cursor: pointer;
  overflow: hidden;
  font-size: 11px;
  font-weight: 500;
}

.bar-cap-left {
  border-top-left-radius: 9px;
  border-bottom-left-radius: 9px;
}
.bar-cap-right {
  border-top-right-radius: 9px;
  border-bottom-right-radius: 9px;
}

.bar-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
