<template>
  <v-dialog v-model="dialog" max-width="520" persistent>
    <v-card rounded="lg">
      <v-card-title class="text-headline-small pa-4 d-flex align-center">
        <v-icon icon="mdi-calendar-plus" class="mr-2" color="primary" />
        Add Calendar Entry
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

        <v-form ref="formRef" @submit.prevent="submit">
          <v-text-field
            v-model="form.title"
            label="Title"
            placeholder="e.g. Team meeting"
            :rules="[(v) => !!v?.trim() || 'Title is required']"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            autofocus
          />

          <v-textarea
            v-model="form.description"
            label="Description (optional)"
            placeholder="Add details…"
            variant="outlined"
            density="comfortable"
            rows="3"
            auto-grow
            class="mb-3"
          />

          <v-row class="mb-3" no-gutters>
            <v-col cols="6" class="pr-2">
              <v-text-field
                v-model="form.start_date"
                label="Start date"
                type="date"
                :rules="[(v) => !!v || 'Start date is required']"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="form.end_date"
                label="End date (optional)"
                type="date"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
          </v-row>

          <v-select
            v-model="form.elements"
            :items="ELEMENT_OPTIONS"
            label="Elements"
            :rules="[(v: ElementName[]) => v.length > 0 || 'At least one element is required']"
            variant="outlined"
            density="comfortable"
            multiple
            chips
            closable-chips
          >
            <template #chip="{ item, props: chipProps }">
              <v-chip
                v-bind="chipProps"
                :style="{ backgroundColor: ELEMENT_COLORS[item as ElementName], color: '#fff' }"
              >
                {{ item }}
              </v-chip>
            </template>
          </v-select>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" :disabled="loading" @click="close">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          :loading="loading"
          prepend-icon="mdi-check"
          @click="submit"
        >
          Save Entry
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { VForm } from 'vuetify/components'
import type { CreateEntryPayload, ElementName } from '~/types'

const ELEMENT_OPTIONS: ElementName[] = ['Magazzino', 'Colmata', 'Kuhstall']

const ELEMENT_COLORS: Record<ElementName, string> = {
  Magazzino: '#5C6BC0',
  Colmata: '#26A69A',
  Kuhstall: '#FFA726',
}

const emit = defineEmits<{
  created: []
}>()

/** Two-way binding for v-model on the parent */
const dialog = defineModel<boolean>({ default: false })

const formRef = ref<InstanceType<typeof VForm> | null>(null)
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const form = reactive<CreateEntryPayload & { elements: ElementName[] }>({
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  elements: [],
})

function resetForm(): void {
  formRef.value?.reset()
  form.title = ''
  form.description = ''
  form.start_date = ''
  form.end_date = ''
  form.elements = []
  errorMsg.value = null
}

function close(): void {
  dialog.value = false
  resetForm()
}

async function submit(): Promise<void> {
  const { valid } = await formRef.value!.validate()
  if (!valid) return

  loading.value = true
  errorMsg.value = null

  try {
    await $fetch('/api/entries', {
      method: 'POST',
      body: {
        title: form.title,
        description: form.description || undefined,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        elements: form.elements,
      } satisfies Partial<CreateEntryPayload>,
    })

    emit('created')
    close()
  } catch (err: unknown) {
    const msg =
      err instanceof Error
        ? err.message
        : (err as { data?: { message?: string } })?.data?.message ??
          'Failed to save entry. Please try again.'
    errorMsg.value = msg
  } finally {
    loading.value = false
  }
}
</script>
