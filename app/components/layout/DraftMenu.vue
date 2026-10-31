<script setup lang="ts">
/**
 * Draft actions that used to sit next to "Next" on every step. They are rare,
 * destructive or technical, so they belong in a header menu — not in the
 * primary action area.
 */
import type { DropdownMenuItem } from "@nuxt/ui"

const { t } = useLocale()
const { path } = useAppPath()
const form = useFormStore()
const toast = useToast()

const importOpen = ref(false)
const importFile = ref<File | null>(null)
const importing = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: t("meta.exportJson"),
      icon: "i-lucide-download",
      onSelect: () => void exportDraft(),
    },
    {
      label: t("meta.importJson"),
      icon: "i-lucide-upload",
      onSelect: () => {
        importFile.value = null
        importOpen.value = true
      },
    },
  ],
  [
    {
      label: t("meta.clearAll"),
      icon: "i-lucide-trash-2",
      color: "error",
      onSelect: () => {
        deleteOpen.value = true
      },
    },
  ],
])

async function exportDraft() {
  const blob = await form.exportDraft()
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `tofes101-draft-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: t("draft.exported"), color: "success", icon: "i-lucide-download" })
}

async function confirmImport() {
  if (!importFile.value) return
  importing.value = true
  try {
    const result = await form.importDraft(importFile.value)
    if (!result.ok) {
      const map: Record<string, string> = {
        parse: "import.parse",
        foreign: "import.foreign",
        newer: "import.newer",
        shape: "import.shape",
        unavailable: "import.parse",
      }
      toast.add({
        title: t("draft.importFailed"),
        description: t((map[result.reason ?? "shape"] ?? "import.shape") as any),
        color: "error",
        icon: "i-lucide-circle-alert",
      })
      return
    }
    importOpen.value = false
    toast.add({ title: t("import.ok"), color: "success", icon: "i-lucide-upload" })
  } finally {
    importing.value = false
  }
}

async function deleteAll() {
  deleting.value = true
  try {
    await form.reset()
    deleteOpen.value = false
    toast.add({ title: t("delete.done"), color: "success", icon: "i-lucide-trash-2" })
    await navigateTo(path("/"))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton variant="ghost" color="neutral" size="sm" :aria-label="t('draft.menu')">
      {{ t("draft.menu") }}
    </UButton>
  </UDropdownMenu>

  <UModal v-model:open="importOpen" :title="t('draft.importTitle')" :description="t('draft.importBody')">
    <template #body>
      <UFileUpload
        v-model="importFile"
        accept="application/json,.json"
        :multiple="false"
        icon="i-lucide-upload"
        :label="t('draft.chooseFile')"
        :description="t('import.hint')"
        class="min-h-36"
      />
    </template>
    <template #footer>
      <UButton variant="ghost" color="neutral" @click="importOpen = false">{{ t("common.cancel") }}</UButton>
      <UButton :disabled="!importFile" :loading="importing" icon="i-lucide-upload" @click="confirmImport">
        {{ t("draft.importConfirm") }}
      </UButton>
    </template>
  </UModal>

  <UModal v-model:open="deleteOpen" :title="t('delete.title')" :description="t('delete.body')">
    <template #footer>
      <UButton variant="ghost" color="neutral" @click="deleteOpen = false">{{ t("common.cancel") }}</UButton>
      <UButton color="error" icon="i-lucide-trash-2" :loading="deleting" @click="deleteAll">
        {{ t("delete.confirm") }}
      </UButton>
    </template>
  </UModal>
</template>
