<script setup lang="ts">
import { emptyDraft, loadDraft, saveDraft, storageEstimate, requestPersistence, exportDraft, importDraft } from '~/utils/draft'

const out = ref<any>({ status: 'running' })

onMounted(async () => {
  try {
    const before = await loadDraft()
    const d = emptyDraft()
    d.data.answers['personal.lastName'] = 'כהן'
    d.data.answers['personal.firstName'] = 'דוד'
    const t0 = performance.now()
    let saved = d
    for (let i = 0; i < 20; i++) saved = await saveDraft({ ...saved, data: { ...saved.data, answers: { ...saved.data.answers, n: i } } })
    const writeMs = (performance.now() - t0) / 20
    const loaded = await loadDraft()
    const json = exportDraft(loaded!)
    const roundTrip = importDraft(json).data.answers['personal.lastName']
    out.value = {
      status: 'ok',
      hadDraftBefore: !!before,
      lastName: loaded?.data.answers['personal.lastName'],
      revision: loaded?.revision,
      avgWriteMs: +writeMs.toFixed(2),
      importRoundTrip: roundTrip,
      estimate: await storageEstimate(),
      persisted: await requestPersistence(),
      bytes: new Blob([json]).size
    }
    ;(window as any).__draftResult = out.value
  } catch (e) {
    out.value = { status: 'error', message: String(e) }
    ;(window as any).__draftResult = out.value
  }
})
</script>

<template>
  <UContainer class="py-8">
    <h1 class="text-xl font-bold mb-4">draft storage probe</h1>
    <pre class="text-xs whitespace-pre-wrap">{{ out }}</pre>
  </UContainer>
</template>
