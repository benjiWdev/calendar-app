<template>
  <v-card elevation="2" rounded="lg">
    <!-- Window navigation header -->
    <v-card-title class="d-flex align-center pa-3 bg-surface-variant">
      <v-btn
        variant="text"
        icon="mdi-chevron-left"
        density="comfortable"
        @click="prevWindow"
      />
      <span class="flex-grow-1 text-center text-subtitle-1 font-weight-bold">
        {{ rangeLabel }}
      </span>
      <v-btn
        variant="text"
        icon="mdi-chevron-right"
        density="comfortable"
        @click="nextWindow"
      />
    </v-card-title>

    <v-divider />

    <!-- One card column per month -->
    <v-row no-gutters>
      <v-col
        v-for="summary in summaries"
        :key="`${summary.year}-${summary.month}`"
        cols="12"
        md="4"
        class="pa-4 month-col"
      >
        <div class="text-body-1 font-weight-medium mb-3">
          {{ monthLabel(summary) }}
        </div>

        <!-- One month-wide track per element; booked ranges as positioned blocks -->
        <div
          v-for="el in ELEMENT_OPTIONS"
          :key="el"
          class="d-flex align-center mb-2"
        >
          <span class="element-label text-body-2">{{ el }}</span>
          <div class="month-track flex-grow-1 mx-3">
            <div
              v-for="(range, i) in summary.perElement[el]"
              :key="i"
              class="month-track-block"
              :style="{
                left: `${((range.start - 1) / summary.daysInMonth) * 100}%`,
                width: `${((range.end - range.start + 1) / summary.daysInMonth) * 100}%`,
                backgroundColor: ELEMENT_COLORS[el],
              }"
            />
          </div>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup lang="ts">
import type { CalendarEntry } from "~/types";
import { ELEMENT_OPTIONS, ELEMENT_COLORS } from "~/constants/elements";
import type {
  MonthRef,
  MonthBookingSummary,
} from "~/composables/useMonthBookingSummary";

const props = defineProps<{ entries: CalendarEntry[] }>();

const { summarize } = useMonthBookingSummary();

// ── 3-month window state ────────────────────────────────────────────────────
// Window starts at the current month: [current, +1, +2]. Prev/next jump ±3 months.

const now = new Date();
const anchor = ref<MonthRef>({ year: now.getFullYear(), month: now.getMonth() });

const months = computed<MonthRef[]>(() =>
  [0, 1, 2].map((offset) => {
    const d = new Date(anchor.value.year, anchor.value.month + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  }),
);

const summaries = computed<MonthBookingSummary[]>(() =>
  summarize(props.entries, months.value),
);

// ── Navigation (non-overlapping 3-month blocks) ─────────────────────────────

function shiftWindow(deltaMonths: number): void {
  const d = new Date(anchor.value.year, anchor.value.month + deltaMonths, 1);
  anchor.value = { year: d.getFullYear(), month: d.getMonth() };
}

function prevWindow(): void {
  shiftWindow(-3);
}

function nextWindow(): void {
  shiftWindow(3);
}

// ── Labels & helpers ────────────────────────────────────────────────────────

function monthLabel(m: MonthRef): string {
  return new Date(m.year, m.month, 1).toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

const rangeLabel = computed(() => {
  const list = months.value;
  return `${monthLabel(list[0])} – ${monthLabel(list[2])}`;
});
</script>

<style scoped>
.element-label {
  width: 72px;
  flex-shrink: 0;
}

/* Month-wide track with absolutely positioned booked-range blocks. */
.month-track {
  position: relative;
  height: 10px;
  border-radius: 9999px;
  background-color: rgba(var(--v-theme-on-surface), 0.08);
  overflow: hidden;
}

.month-track-block {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 9999px;
}

/* Divider between month columns on desktop, switching to a top border on mobile. */
.month-col + .month-col {
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

@media (max-width: 959px) {
  .month-col + .month-col {
    border-left: none;
    border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }
}
</style>
