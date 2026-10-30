<script setup lang="ts">
/**
 * Signature: drawn OR typed, never drawn-only (a canvas-only field is a keyboard
 * trap and fails WCAG 2.1.1). Emits the same `Signature` shape for both paths,
 * with the declaration version attached so an old file can be traced to the
 * exact wording that was signed.
 */
import type { Signature } from "~/form/types"

const props = defineProps<{
  modelValue: Signature | undefined
  declarationVersion: string
  disabled?: boolean
}>()

const emit = defineEmits<{ "update:modelValue": [value: Signature | undefined] }>()

const { t } = useLocale()

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
  })
}

onMounted(() => {
  resize()
  window.addEventListener("resize", resize)
})
onBeforeUnmount(() => window.removeEventListener("resize", resize))

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
    <fieldset :disabled="props.disabled">
      <legend class="mb-2 block text-sm font-medium text-highlighted">
        {{ t("f.sign.signature") }}
      </legend>

      <div class="mb-3 flex gap-1 rounded-lg border border-default p-1" role="tablist" :aria-label="t('f.sign.signature')">
        <button
          v-for="m in (['draw', 'type'] as const)"
          :key="m"
          type="button"
          role="tab"
          :aria-selected="mode === m"
          class="flex-1 rounded-md px-3 py-1.5 text-sm transition focus-visible:ring-2 focus-visible:ring-primary"
          :class="mode === m ? 'bg-elevated font-medium text-highlighted' : 'text-default hover:bg-elevated'"
          @click="mode = m"
        >
          {{ m === "draw" ? t("sign.mode.draw") : t("sign.mode.type") }}
        </button>
      </div>

      <div v-show="mode === 'draw'">
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
          <p class="text-xs text-muted">{{ t("f.sign.signature.help") }}</p>
          <UButton type="button" variant="ghost" color="neutral" size="xs" @click="clear">
            {{ t("sign.clear") }}
          </UButton>
        </div>
      </div>

      <div v-show="mode === 'type'" class="space-y-2">
        <label for="typed-signature" class="block text-sm text-highlighted">{{ t("sign.typedName") }}</label>
        <input
          id="typed-signature"
          v-model="typedName"
          type="text"
          autocomplete="name"
          class="w-full rounded-lg border border-default bg-default px-3 py-2.5 text-base text-highlighted"
          @keydown.enter.prevent="commitTyped"
        />
        <button
          type="button"
          class="rounded-md bg-teal-800 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-900 focus-visible:ring-2 focus-visible:ring-teal-900"
          @click="commitTyped"
        >
          {{ t("sign.sign") }}
        </button>
      </div>

      <p v-if="signedLabel" class="mt-3 flex items-center gap-2 text-sm text-highlighted" role="status">
        <UIcon name="i-lucide-check-circle-2" class="size-4 text-success" />
        {{ t("sign.signed") }} · <span dir="ltr">{{ signedLabel }}</span>
      </p>
    </fieldset>
  </div>
</template>
