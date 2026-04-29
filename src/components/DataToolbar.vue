<script setup lang="ts">
import { ref } from 'vue'
import { pushToast } from '@/composables/useToast'
import { usePurchasesStore } from '@/stores/purchases'
import { useSettingsStore } from '@/stores/settings'

const store = usePurchasesStore()
const settings = useSettingsStore()

const fileInput = ref<HTMLInputElement | null>(null)
const importDraft = ref<string | null>(null)
const milestonesOpen = ref(false)
const milestoneCsv = ref('')

function onExport() {
  const blob = new Blob([store.exportJson()], { type: 'application/json;charset=utf-8' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = `daily-amortize-${new Date().toISOString().slice(0, 19).replace(/[:]/g, '-')}.json`
  a.click()
  URL.revokeObjectURL(url)
  pushToast('已导出 JSON', 'ok')
}

function pickImport() {
  importDraft.value = null
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const el = e.target as HTMLInputElement
  const f = el.files?.[0]
  el.value = ''
  if (!f) return
  importDraft.value = await f.text()
}

function cancelImport() {
  importDraft.value = null
}

function confirmImport(mode: 'merge' | 'replace') {
  const text = importDraft.value
  if (!text) return
  const res = store.importJson(text, mode)
  importDraft.value = null
  if (!res.ok) {
    pushToast(res.message, 'err')
    return
  }
  pushToast(mode === 'replace' ? `已替换为 ${res.count} 条` : `已合并 ${res.count} 条`, 'ok')
}

function onClearAll() {
  if (!window.confirm('首次确认：将删除全部本地记录，且无法从本应用恢复。继续？')) return
  if (!window.confirm('二次确认：真的要清空所有消费记录吗？')) return
  store.clearAll()
  pushToast('已清空全部记录', 'info')
}

function onUndo() {
  if (store.undoDelete()) pushToast('已撤销最近一次删除', 'ok')
  else pushToast('暂无可撤销的删除', 'err')
}

function toggleMilestones() {
  milestonesOpen.value = !milestonesOpen.value
  if (milestonesOpen.value) milestoneCsv.value = settings.milestoneDays.join(',')
}

function applyMilestones() {
  settings.setMilestoneDaysFromString(milestoneCsv.value)
  pushToast('里程碑天数已保存', 'ok')
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__row">
      <label class="field">
        <span class="field__k">搜索</span>
        <input v-model="settings.searchQuery" class="field__i mono" type="search" placeholder="按物品名称…" />
      </label>

      <label class="chk">
        <input v-model="settings.onlyThisWeek" type="checkbox" />
        <span>仅本周购买</span>
      </label>

      <label class="field field--sm">
        <span class="field__k">排序</span>
        <select v-model="settings.sortMode" class="field__i">
          <option value="purchaseDesc">购买日（新→旧）</option>
          <option value="dailyDesc">今日摊销（高→低）</option>
          <option value="dailyAsc">今日摊销（低→高）</option>
        </select>
      </label>
    </div>

    <div class="toolbar__row toolbar__actions">
      <button type="button" class="btn" @click="onExport">导出 JSON</button>
      <button type="button" class="btn" @click="pickImport">导入 JSON</button>
      <input ref="fileInput" class="sr" type="file" accept="application/json,.json" @change="onFileChange" />

      <button
        type="button"
        class="btn btn--ghost"
        :disabled="store.undoStack.length === 0"
        @click="onUndo"
      >
        撤销删除 ({{ store.undoStack.length }})
      </button>

      <button type="button" class="btn btn--danger" :disabled="!store.hasItems" @click="onClearAll">
        清空全部
      </button>

      <button type="button" class="btn btn--ghost" @click="toggleMilestones">
        {{ milestonesOpen ? '收起里程碑' : '里程碑天数' }}
      </button>
    </div>

    <div v-if="milestonesOpen" class="panel">
      <p class="panel__hint">当「已用天数」达到下列阈值时，在卡片上显示纪念标签（逗号分隔，单位：天）。</p>
      <div class="panel__row">
        <input v-model="milestoneCsv" class="field__i mono" type="text" />
        <button type="button" class="btn" @click="applyMilestones">保存</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="importDraft" class="import-dim" role="presentation" @click.self="cancelImport">
        <div class="import-box" role="dialog" aria-modal="true" aria-labelledby="import-title">
          <h2 id="import-title" class="import-title">选择导入方式</h2>
          <p class="import-sub">合并：保留现有记录并在顶部追加导入条目（新 id）。替换：删除现有记录后仅保留导入条目。</p>
          <div class="import-btns">
            <button type="button" class="btn btn--ghost" @click="cancelImport">取消</button>
            <button type="button" class="btn" @click="confirmImport('merge')">合并导入</button>
            <button type="button" class="btn btn--danger" @click="confirmImport('replace')">替换导入</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped lang="less">
.toolbar {
  margin-top: 14px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  display: grid;
  gap: 12px;
}

.toolbar__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.toolbar__actions {
  align-items: center;
}

.field {
  display: grid;
  gap: 6px;
  flex: 1;
  min-width: 180px;
}

.field--sm {
  flex: 0 0 220px;
}

.field__k {
  font-size: 11px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(232, 236, 255, 0.55);
}

.field__i {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  color: #f6f7ff;
  padding: 10px 10px;
  font-size: 14px;
}

.chk {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: rgba(232, 236, 255, 0.78);
  user-select: none;
}

.btn {
  border-radius: 12px;
  border: 1px solid rgba(94, 234, 255, 0.35);
  background: linear-gradient(135deg, rgba(94, 234, 255, 0.18), rgba(255, 61, 165, 0.12));
  color: #eef1ff;
  padding: 9px 12px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn--ghost {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.22);
}

.btn--danger {
  border-color: rgba(255, 61, 165, 0.45);
  background: rgba(255, 61, 165, 0.12);
}

.panel {
  border-radius: 12px;
  padding: 10px 10px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
}

.panel__hint {
  margin: 0 0 8px;
  font-size: 12px;
  color: rgba(232, 236, 255, 0.65);
  line-height: 1.5;
}

.panel__row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.panel__row .field__i {
  flex: 1;
  min-width: 200px;
}

.sr {
  position: fixed;
  left: -9999px;
  top: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.import-dim {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(5, 3, 12, 0.62);
  backdrop-filter: blur(8px);
}

.import-box {
  width: min(480px, 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(12, 8, 24, 0.96);
  color: #eef1ff;
}

.import-title {
  margin: 0 0 8px;
  font-size: 18px;
}

.import-sub {
  margin: 0 0 14px;
  font-size: 13px;
  color: rgba(232, 236, 255, 0.72);
  line-height: 1.55;
}

.import-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}
</style>
