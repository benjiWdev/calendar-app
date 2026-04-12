<template>
  <v-dialog v-model="dialog" max-width="520">
    <v-card rounded="lg">
      <v-card-title class="text-headline-small pa-4 d-flex align-center">
        <v-icon icon="mdi-calendar-plus" class="mr-2" color="primary" />
        Kalendereintrag hinzufügen
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
        <v-spacer />
        <v-btn color="primary" variant="outlined" :disabled="loading" @click="close">Abbrechen</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loading"
          prepend-icon="mdi-check"
          @click="submit"
        >
          Eintrag speichern
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { CreateEntryPayload } from '~/types'

type EntryFormInstance = {
  validate(): Promise<{ valid: boolean } | undefined>
  resetValidation(): void
}

const emit = defineEmits<{ created: [] }>()

const dialog = defineModel<boolean>({ default: false })

const entryFormRef = ref<EntryFormInstance | null>(null)
const { form, loading, errorMsg, resetForm, toISODate, extractErrorMessage } = useEntryForm()

function close(): void {
  dialog.value = false
  resetForm()
  entryFormRef.value?.resetValidation()
}

async function submit(): Promise<void> {
  const result = await entryFormRef.value?.validate()
  if (!result?.valid) return

  loading.value = true
  errorMsg.value = null

  try {
    await $fetch('/api/entries', {
      method: 'POST',
      body: {
        title: form.title,
        description: form.description || undefined,
        start_date: toISODate(form.start_date!),
        end_date: toISODate(form.end_date!),
        elements: form.elements,
      } satisfies Partial<CreateEntryPayload>,
    })
    emit('created')
    close()
  } catch (err: unknown) {
    errorMsg.value = extractErrorMessage(
      err,
      'Eintrag konnte nicht gespeichert werden. Bitte erneut versuchen.',
    )
  } finally {
    loading.value = false
  }
}
</script>
