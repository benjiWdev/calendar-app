<template>
  <v-dialog v-model="dialog" max-width="520">
    <v-card rounded="lg">
      <v-card-title class="text-headline-small pa-4 d-flex align-center">
        <v-icon icon="mdi-calendar-edit" class="mr-2" color="primary" />
        Eintrag bearbeiten
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-4">
        <v-alert
          v-if="errorMsg"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="errorMsg = null"
        >
          {{ errorMsg }}
        </v-alert>

        <EntryForm
          ref="entryFormRef"
          v-model:title="form.title"
          v-model:description="form.description"
          v-model:start_date="form.start_date"
          v-model:end_date="form.end_date"
          v-model:elements="form.elements"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn
          color="error"
          variant="elevated"
          prepend-icon="mdi-delete"
          :disabled="loading"
          @click="confirmDelete = true"
        >
          Löschen
        </v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="outlined"
          :disabled="loading"
          @click="close"
          >Abbrechen</v-btn
        >
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loading"
          prepend-icon="mdi-check"
          @click="submit"
        >
          Speichern
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete confirmation dialog -->
  <v-dialog v-model="confirmDelete" max-width="380">
    <v-card rounded="lg">
      <v-card-title class="pa-4">Eintrag löschen?</v-card-title>
      <v-card-text class="px-4 pb-2">
        <strong>{{ form.title }}</strong> wird unwiderruflich gelöscht.
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="confirmDelete = false">Abbrechen</v-btn>
        <v-btn
          color="error"
          variant="elevated"
          :loading="loading"
          @click="deleteEntry"
        >
          Löschen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { CalendarEntry, CreateEntryPayload } from "~/types";

type EntryFormInstance = {
  validate(): Promise<{ valid: boolean } | undefined>;
  resetValidation(): void;
};

const emit = defineEmits<{ updated: []; deleted: [] }>();

const dialog = defineModel<boolean>({ default: false });
const props = defineProps<{ entry: CalendarEntry | null }>();

const entryFormRef = ref<EntryFormInstance | null>(null);
const { form, loading, errorMsg, resetForm, toISODate, extractErrorMessage } =
  useEntryForm();
const confirmDelete = ref(false);

watch(dialog, (open) => {
  if (!open || !props.entry) return;
  Object.assign(form, {
    title: props.entry.title,
    description: props.entry.description ?? "",
    start_date: new Date(props.entry.start_date),
    end_date: new Date(props.entry.end_date),
    elements: [...props.entry.elements],
  });
  errorMsg.value = null;
});

function close(): void {
  dialog.value = false;
  confirmDelete.value = false;
  resetForm();
  entryFormRef.value?.resetValidation();
}

async function submit(): Promise<void> {
  const result = await entryFormRef.value?.validate();
  if (!result?.valid) return;

  loading.value = true;
  errorMsg.value = null;

  try {
    await $fetch(`/api/entries/${props.entry!.id}`, {
      method: "PUT",
      body: {
        title: form.title,
        description: form.description || undefined,
        start_date: toISODate(form.start_date!),
        end_date: toISODate(form.end_date!),
        elements: form.elements,
      } satisfies Partial<CreateEntryPayload>,
    });
    emit("updated");
    close();
  } catch (err: unknown) {
    errorMsg.value = extractErrorMessage(
      err,
      "Eintrag konnte nicht gespeichert werden. Bitte erneut versuchen.",
    );
  } finally {
    loading.value = false;
  }
}

async function deleteEntry(): Promise<void> {
  loading.value = true;

  try {
    await $fetch(`/api/entries/${props.entry!.id}`, { method: "DELETE" });
    emit("deleted");
    close();
  } catch (err: unknown) {
    confirmDelete.value = false;
    errorMsg.value = extractErrorMessage(
      err,
      "Eintrag konnte nicht gelöscht werden. Bitte erneut versuchen.",
    );
  } finally {
    loading.value = false;
  }
}
</script>
