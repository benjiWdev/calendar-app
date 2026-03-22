<template>
  <v-container fluid class="pa-4 pa-md-6">
    <!-- Page header -->
    <div class="d-flex align-center mb-5">
      <div>
        <p class="text-body-medium text-medium-emphasis mb-0">
          {{ today }}
        </p>
      </div>
      <v-spacer />
      <!-- Desktop "Add Entry" button -->
      <v-btn
        color="blue"
        prepend-icon="mdi-plus"
        class="d-none d-sm-flex text-blue-lighten-4"
        @click="showDialog = true"
      >
        Add Entry
      </v-btn>
    </div>

    <!-- Error state -->
    <v-alert
      v-if="fetchError"
      type="error"
      variant="tonal"
      class="mb-4"
      :text="`Could not load entries: ${fetchError.message}`"
    >
      <template #append>
        <v-btn variant="text" size="small" @click="refresh">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Calendar -->
    <CalendarView :entries="entries" />

    <!-- Mobile FAB -->
    <v-btn
      icon="mdi-plus"
      color="primary"
      size="large"
      position="fixed"
      location="bottom end"
      class="ma-5 d-flex d-sm-none"
      elevation="4"
      @click="showDialog = true"
    />

    <!-- Add Entry dialog -->
    <AddEntryDialog v-model="showDialog" @created="refresh" />
  </v-container>
</template>

<script setup lang="ts">
import type { CalendarEntry } from '~/types'

const showDialog = ref(false)

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

const {
  data,
  error: fetchError,
  refresh,
} = await useFetch<CalendarEntry[]>('/api/entries')

const entries = computed(() => data.value ?? [])
</script>
