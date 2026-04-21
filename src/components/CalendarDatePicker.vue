<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { formatLocalYmd } from '@/utils/dates'
import { daysInMonth, mondayFirstOffsetCells } from '@/utils/calendar'

const props = defineProps<{
  modelValue: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const panelOpen = ref(false)

const viewYear = ref(0)
const viewMonth = ref(1)

const todayYmd = computed(() => formatLocalYmd(new Date()))

function syncViewFromModel() {
  const [y, m] = props.modelValue.split('-').map((n) => Number(n))
  if (y && m >= 1 && m <= 12) {
    viewYear.value = y
    viewMonth.value = m
    return
  }
  const t = new Date()
  viewYear.value = t.getFullYear()
  viewMonth.value = t.getMonth() + 1
}

watch(
  () => props.modelValue,
  () => {
    if (panelOpen.value) return
    syncViewFromModel()
  },
  { immediate: true },
)

watch(
  () => panelOpen.value,
  (open) => {
    if (open) syncViewFromModel()
  },
)

const displayText = computed(() => {
  const [y, m, d] = props.modelValue.split('-').map((n) => Number(n))
  if (!y || !m || !d) return '选择日期'
  return `${y}年${m}月${d}日`
})

const monthTitle = computed(() => `${viewYear.value}年${viewMonth.value}月`)

const isCurrentMonthMax = computed(() => {
  const [ty, tm] = todayYmd.value.split('-').map(Number)
  return viewYear.value > ty || (viewYear.value === ty && viewMonth.value >= tm)
})

const cells = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const offset = mondayFirstOffsetCells(y, m)
  const last = daysInMonth(y, m)
  const out: Array<{ day: number | null; ymd: string | null }> = []
  for (let i = 0; i < offset; i++) out.push({ day: null, ymd: null })
  for (let d = 1; d <= last; d++) {
    const ymd = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    out.push({ day: d, ymd })
  }
  return out
})

function prevMonth() {
  if (viewMonth.value <= 1) {
    viewMonth.value = 12
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (isCurrentMonthMax.value) return
  if (viewMonth.value >= 12) {
    viewMonth.value = 1
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function pick(ymd: string | null) {
  if (!ymd) return
  if (ymd > todayYmd.value) return
  emit('update:modelValue', ymd)
  panelOpen.value = false
}

function togglePanel() {
  if (props.disabled) return
  panelOpen.value = !panelOpen.value
}

let removeDocListener: (() => void) | undefined

function bindOutsideClose() {
  removeDocListener?.()
  const onDocDown = (e: MouseEvent) => {
    const el = rootRef.value
    if (!el) return
    if (!el.contains(e.target as Node)) panelOpen.value = false
  }
  document.addEventListener('mousedown', onDocDown, true)
  removeDocListener = () => document.removeEventListener('mousedown', onDocDown, true)
}

watch(panelOpen, async (open) => {
  removeDocListener?.()
  removeDocListener = undefined
  if (!open) return
  await nextTick()
  setTimeout(() => bindOutsideClose(), 0)
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') panelOpen.value = false
}

onUnmounted(() => {
  removeDocListener?.()
})
</script>

<template>
  <div ref="rootRef" class="cdp" @keydown="onKeydown">
    <button
      type="button"
      class="cdp__trigger field-like mono"
      :class="{ 'cdp__trigger--open': panelOpen }"
      :disabled="disabled"
      :aria-expanded="panelOpen"
      aria-haspopup="dialog"
      @click.stop="togglePanel"
    >
      <span class="cdp__trigger-text">{{ displayText }}</span>
      <span class="cdp__chev" aria-hidden="true">▾</span>
    </button>

    <Transition name="pop">
      <div v-if="panelOpen" class="cdp__panel" role="dialog" aria-label="选择购买日期" @click.stop>
        <div class="cdp__nav">
          <button type="button" class="cdp__nav-btn" aria-label="上一月" @click="prevMonth">‹</button>
          <div class="cdp__nav-title mono">{{ monthTitle }}</div>
          <button
            type="button"
            class="cdp__nav-btn"
            aria-label="下一月"
            :disabled="isCurrentMonthMax"
            @click="nextMonth"
          >
            ›
          </button>
        </div>

        <div class="cdp__week mono" aria-hidden="true">
          <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
        </div>

        <div class="cdp__grid">
          <button
            v-for="(c, idx) in cells"
            :key="idx"
            type="button"
            class="cdp__cell mono"
            :class="{
              'cdp__cell--muted': !c.day,
              'cdp__cell--picked': c.ymd && c.ymd === modelValue,
              'cdp__cell--today': c.ymd && c.ymd === todayYmd,
              'cdp__cell--future': c.ymd && c.ymd > todayYmd,
            }"
            :disabled="!c.day || (!!c.ymd && c.ymd > todayYmd)"
            @click="pick(c.ymd)"
          >
            {{ c.day ?? '' }}
          </button>
        </div>

        <p class="cdp__hint">不可选择今天之后的日期。</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="less">
.cdp {
  position: relative;
}

.field-like {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  color: #f6f7ff;
  padding: 12px 12px;
  font-size: 15px;
}

.cdp__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  text-align: left;
}

.cdp__trigger:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cdp__trigger--open {
  border-color: rgba(94, 234, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(94, 234, 255, 0.18) inset;
}

.cdp__trigger-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cdp__chev {
  flex: none;
  opacity: 0.75;
}

.cdp__panel {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 8px);
  z-index: 80;
  border-radius: 16px;
  padding: 12px 12px 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(180deg, rgba(18, 12, 34, 0.98), rgba(8, 6, 16, 0.98));
  box-shadow:
    0 0 0 1px rgba(94, 234, 255, 0.12) inset,
    0 22px 60px rgba(0, 0, 0, 0.55);
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.cdp__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.cdp__nav-title {
  font-weight: 800;
  letter-spacing: 0.2px;
}

.cdp__nav-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.cdp__nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.cdp__week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin: 0 2px 8px;
  font-size: 11px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(232, 236, 255, 0.55);
  text-align: center;
}

.cdp__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.cdp__cell {
  height: 40px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
}

.cdp__cell--muted {
  background: transparent;
  cursor: default;
}

.cdp__cell--today:not(.cdp__cell--picked) {
  border-color: rgba(255, 214, 102, 0.28);
}

.cdp__cell--picked {
  border-color: rgba(94, 234, 255, 0.45);
  background: linear-gradient(135deg, rgba(94, 234, 255, 0.22), rgba(255, 61, 165, 0.18));
  color: #0b1020;
}

.cdp__cell--future {
  opacity: 0.28;
  cursor: not-allowed;
}

.cdp__cell:disabled {
  opacity: 0.28;
  cursor: not-allowed;
}

.cdp__hint {
  margin: 10px 2px 0;
  font-size: 11px;
  line-height: 1.4;
  color: rgba(232, 236, 255, 0.55);
}
</style>
