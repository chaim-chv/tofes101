<script setup lang="ts">
/**
 * Signature: drawn OR typed, never drawn-only (a canvas-only field is a keyboard
 * trap and fails WCAG 2.1.1). Emits the same `Signature` shape for both paths,
 * with the declaration version attached so an old file can be traced to the
 * exact wording that was signed.
 */
import type { Signature, Issue } from "~/form/types"
import type { MessageKey } from "~/locales"

const props = defineProps<{
  modelValue: Signature | undefined
  declarationVersion: string
  /** Fingerprint of the answers this signature covers. */
  answersHash?: string
  disabled?: boolean
  /** State-aware requiredness from the engine. */
  required?: boolean
  fieldId?: string
  helpKey?: MessageKey
  issues?: Issue[]
}>()

const emit = defineEmits<{ "update:modelValue": [value: Signature | undefined] }>()

const { t } = useLocale()

const errors = computed(() => props.issues?.filter((i) => i.severity === "error") ?? [])
const warning = computed(() => props.issues?.find((i) => i.severity === "warning"))
const fieldId = computed(() => props.fieldId ?? "sign.signature")
const errorId = (index = 0) => `err-${fieldId.value}-${index}`
const describedBy = computed(() => {
  const ids: string[] = []
  if (props.helpKey) ids.push(`help-${fieldId.value}`)
  if (errors.value.length) ids.push(...errors.value.map((_, i) => errorId(i)))
  else if (warning.value) ids.push(`warn-${fieldId.value}`)
  return ids.join(" ") || undefined
})

const mode = ref<"draw" | "type">("draw")
const typedName = ref(props.modelValue?.typedName ?? "")
const canvas = ref<HTMLCanvasElement | null>(null)
const hasStrokes = ref(false)
let drawing = false
let strokes: number[][][] = []
let current: number[][] = []

function ctx() {
  return canvas.value?.getContext("2d") ?? null
}

function resize() {
  const el = canvas.value
  if (!el) return
  const ratio = window.devicePixelRatio || 1
  const rect = el.getBoundingClientRect()
  el.width = Math.round(rect.width * ratio)
  el.height = Math.round(rect.height * ratio)
  const c = ctx()
  if (c) {
    c.scale(ratio, ratio)
    c.lineWidth = 2
    c.lineCap = "round"
    c.lineJoin = "round"
    c.strokeStyle = "#111827"
  }
  redraw()
}

function toLocal(event: PointerEvent) {
  const rect = canvas.value!.getBoundingClientRect()
  return [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height]
}

function start(event: PointerEvent) {
  if (props.disabled) return
  canvas.value?.setPointerCapture(event.pointerId)
  drawing = true
  current = [toLocal(event)]
  strokes.push(current)
  hasStrokes.value = true
}

function move(event: PointerEvent) {
  if (!drawing) return
  current.push(toLocal(event))
  redraw()
}

function end() {
  if (!drawing) return
  drawing = false
  commit()
}

function redraw() {
  const el = canvas.value
  const c = ctx()
  if (!el || !c) return
  const rect = el.getBoundingClientRect()
  c.clearRect(0, 0, rect.width, rect.height)
  c.beginPath()
  for (const stroke of strokes) {
    stroke.forEach(([x, y], i) => {
      const px = (x ?? 0) * rect.width
      const py = (y ?? 0) * rect.height
      if (i === 0) c.moveTo(px, py)
      else c.lineTo(px, py)
    })
  }
  c.stroke()
}

function commit() {
  if (!hasStrokes.value) return
  emit("update:modelValue", {
    kind: "drawn",
    strokes: strokes.map((stroke) => stroke.map(([x, y]) => [x ?? 0, y ?? 0] as [number, number])),
    signedAt: new Date().toISOString(),
    declarationVersion: props.declarationVersion,
    answersHash: props.answersHash,
  })
}

function clear() {
  strokes = []
  current = []
  hasStrokes.value = false
  redraw()
  emit("update:modelValue", undefined)
}

function commitTyped() {
  const name = typedName.value.trim()
  if (name.length < 2) return
  emit("update:modelValue", {
    kind: "typed",
    typedName: name,
    signedAt: new Date().toISOString(),
    declarationVersion: props.declarationVersion,
    answersHash: props.answersHash,
  })
}

onMounted(() => {
  resize()
  window.addEventListener("resize", resize)
})
onBeforeUnmount(() => window.removeEventListener("resize", resize))

const modes = computed(() => [
  { label: t("sign.mode.draw"), value: "draw", slot: "draw" as const },
  { label: t("sign.mode.type"), value: "type", slot: "type" as const },
])

const signedLabel = computed(() =>
  props.modelValue
    ? new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" }).format(
        new Date(props.modelValue.signedAt),
      )
    : null,
)
</script>

<template>
  <div class="min-w-0">
    <fieldset
      :id="`f-${fieldId}`"
      tabindex="-1"
      :disabled="props.disabled"
      class="min-w-0 focus:outline-none"
      :aria-describedby="describedBy"
    >
      <legend class="mb-2 block text-sm font-medium text-highlighted">
        {{ t("f.sign.signature") }}
        <span v-if="props.required" class="text-error" aria-hidden="true">*</span>
        <span v-if="props.required" class="sr-only">({{ t("common.required") }})</span>
      </legend>

      <UTabs
        v-model="mode"
        :items="modes"
        :ui="{ list: 'grid w-full grid-cols-2', indicator: 'hidden', trigger: 'transition-none data-[state=active]:bg-primary data-[state=active]:text-inverted' }"
        class="mb-3"
      >
        <template #draw>
          <canvas
            ref="canvas"
            role="img"
            :aria-label="t('f.sign.signature')"
            class="h-40 w-full touch-none rounded-lg border-2 border-dashed border-default bg-white"
            @pointerdown.prevent="start"
            @pointermove.prevent="move"
            @pointerup="end"
            @pointercancel="end"
            @pointerleave="end"
          />
          <div class="mt-2 flex items-center justify-between gap-3">
            <UButton type="button" variant="ghost" color="neutral" size="xs" @click="clear">
              {{ t("sign.clear") }}
            </UButton>
          </div>
        </template>

        <template #type>
          <div class="space-y-2">
            <UFormField :label="t('sign.typedName')" name="typed-signature">
              <UInput
                id="typed-signature"
                v-model="typedName"
                type="text"
                autocomplete="name"
                size="lg"
                class="w-full"
                :aria-invalid="errors.length ? true : undefined"
                :aria-describedby="describedBy"
                @keydown.enter.prevent="commitTyped"
              />
            </UFormField>
            <UButton type="button" size="lg" icon="i-lucide-check" @click="commitTyped">
              {{ t("sign.sign") }}
            </UButton>
          </div>
        </template>
      </UTabs>

      <p v-if="signedLabel" class="mt-3 flex items-center gap-2 text-sm text-highlighted" role="status">
        <UIcon name="i-lucide-check-circle-2" class="size-4 text-success" />
        {{ t("sign.signed") }} · <span dir="ltr">{{ signedLabel }}</span>
      </p>
      <p v-if="props.helpKey" :id="`help-${fieldId}`" class="mt-2 text-xs text-muted">
        {{ t(props.helpKey) }}
      </p>
      <p
        v-for="(issue, issueIndex) in errors"
        :id="errorId(issueIndex)"
        :key="`${issue.code}-${issueIndex}`"
        class="mt-2 flex items-center gap-1 text-sm text-error"
      >
        <UIcon name="i-lucide-circle-alert" class="size-4 shrink-0" />
        {{ t(issue.messageKey, issue.params) }}
      </p>
      <p v-if="!errors.length && warning" :id="`warn-${fieldId}`" class="mt-2 flex items-center gap-1 text-sm text-warning">
        <UIcon name="i-lucide-triangle-alert" class="size-4 shrink-0" />
        {{ t(warning.messageKey, warning.params) }}
      </p>
    </fieldset>
  </div>
</template>
