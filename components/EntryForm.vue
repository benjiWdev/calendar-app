<template>
  <v-form ref="formRef" @submit.prevent>
    <v-text-field
      v-model="title"
      label="Titel"
      placeholder="Wer?"
      :rules="titleRules"
      variant="outlined"
      density="comfortable"
      class="mb-3"
      autofocus
    />

    <v-textarea
      v-model="description"
      label="Beschreibung (optional)"
      placeholder="Details hinzufügen…"
      variant="outlined"
      density="comfortable"
      rows="3"
      auto-grow
      class="mb-3"
    />

    <v-row class="mb-3" no-gutters>
      <v-col cols="6" class="pr-2">
        <v-date-input
          v-model="startDate"
          label="Startdatum"
          :rules="startDateRules"
          variant="outlined"
          density="comfortable"
          :first-day-of-week="1"
          display-format="fullDate"
          prepend-icon=""
          prepend-inner-icon="$calendar"
        />
      </v-col>
      <v-col cols="6">
        <v-date-input
          v-model="endDate"
          label="Enddatum"
          :rules="endDateRules"
          variant="outlined"
          density="comfortable"
          :first-day-of-week="1"
          display-format="fullDate"
          prepend-icon=""
          prepend-inner-icon="$calendar"
          :min="startDate ?? undefined"
        />
      </v-col>
    </v-row>

    <v-select
      v-model="elements"
      :items="ELEMENT_OPTIONS"
      label="Elemente"
      :rules="elementRules"
      variant="outlined"
      density="comfortable"
      multiple
      chips
      closable-chips
    >
      <template #chip="{ item, props: chipProps }">
        <v-chip
          v-bind="chipProps"
          :style="{
            backgroundColor: ELEMENT_COLORS[item.title as ElementName],
            color: '#fff',
          }"
        >
          {{ item.title }}
        </v-chip>
      </template>
    </v-select>
  </v-form>
</template>

<script setup lang="ts">
import type { VForm } from "vuetify/components";
import type { ElementName } from "~/types";
import { ELEMENT_OPTIONS, ELEMENT_COLORS } from "~/constants/elements";

const title = defineModel<string>("title", { required: true });
const description = defineModel<string>("description", { default: "" });
const startDate = defineModel<Date | null>("start_date", { required: true });
const endDate = defineModel<Date | null>("end_date", { required: true });
const elements = defineModel<ElementName[]>("elements", { required: true });

const formRef = ref<InstanceType<typeof VForm> | null>(null);

const titleRules = [(v: string) => !!v?.trim() || "Titel ist erforderlich"];
const startDateRules = [
  (v: Date | null) => !!v || "Startdatum ist erforderlich",
];
const endDateRules = computed(() => [
  (v: Date | null) => !!v || "Enddatum ist erforderlich",
  (v: Date | null) =>
    !startDate.value ||
    !v ||
    v >= startDate.value ||
    "Enddatum darf nicht vor dem Startdatum liegen",
]);
const elementRules = [
  (v: ElementName[]) =>
    v.length > 0 || "Mindestens ein Element ist erforderlich",
];

defineExpose({
  validate: () => formRef.value?.validate(),
  resetValidation: () => formRef.value?.resetValidation(),
});
</script>
