<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CalendarDatePicker from '@/components/CalendarDatePicker.vue'
import { pushToast } from '@/composables/useToast'
import { formatLocalYmd } from '@/utils/dates'
import { usePurchasesStore } from '@/stores/purchases'

const props = defineProps<{
  open: boolean
  /** 尚无记录时，不允许关闭，引导用户先录入一条。 */
  lockUntilFirstSave: boolean
  /** 非空时为编辑该 id 对应记录 */
  editingId: string | null
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const store = usePurchasesStore()

const name = ref('')
const amount = ref<string>('')
const purchaseDate = ref(formatLocalYmd(new Date()))

const submitting = ref(false)
const formError = ref<string | null>(null)

function resetFormForCreate() {
  name.value = ''
  amount.value = ''
  purchaseDate.value = formatLocalYmd(new Date())
}

function applyEditingFromStore() {
  if (!props.editingId) return false
  const it = store.items.find((p) => p.id === props.editingId)
  if (!it) return false
  name.value = it.name
  amount.value = String(it.amountYuan)
  purchaseDate.value = it.purchaseDate
  return true
}

watch(
  () => [props.open, props.editingId, props.lockUntilFirstSave] as const,
  ([isOpen]) => {
    if (!isOpen) return
    formError.value = null
    if (props.editingId) {
      if (!applyEditingFromStore()) {
        formError.value = '该记录已不存在，请关闭后重试。'
        resetFormForCreate()
      }
      return
    }
    if (!props.lockUntilFirstSave) resetFormForCreate()
  },
)

const isEdit = computed(() => Boolean(props.editingId))

const title = computed(() => {
  if (props.lockUntilFirstSave) return '先记一笔，开始摊销'
  if (isEdit.value) return '编辑消费记录'
  return '新消费记录'
})

const primaryLabel = computed(() => {
  if (isEdit.value) return '保存修改'
  return '保存并开始计算'
})

function closeIfAllowed() {
  if (props.lockUntilFirstSave) return
  emit('update:open', false)
}

function fillDemo() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - 30)
  name.value = '示例 · 手机'
  amount.value = '1000'
  purchaseDate.value = formatLocalYmd(d)
  formError.value = null
  pushToast('已填入示例，可直接保存', 'info')
}

function parseAmount(): number | null {
  const raw = amount.value.trim().replace(/,/g, '')
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n)) return null
  return n
}

async function onSubmit() {
  formError.value = null
  const n = parseAmount()
  if (n === null) {
    formError.value = '请输入有效的金额数字。'
    return
  }

  submitting.value = true
  await Promise.resolve()

  const res = props.editingId
    ? store.updatePurchase(props.editingId, {
        name: name.value,
        amountYuan: n,
        purchaseDate: purchaseDate.value,
      })
    : store.addPurchase({
        name: name.value,
        amountYuan: n,
        purchaseDate: purchaseDate.value,
      })

  submitting.value = false

  if (!res.ok) {
    formError.value = res.message
    return
  }

  pushToast(isEdit.value ? '已保存修改' : '已添加记录', 'ok')
  emit('update:open', false)
  if (!props.editingId) {
    name.value = ''
    amount.value = ''
    purchaseDate.value = formatLocalYmd(new Date())
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="modal" role="presentation" @click.self="closeIfAllowed">
        <div class="dialog" role="dialog" aria-modal="true" :aria-labelledby="'dlg-title'">
          <header class="dialog__head">
            <div>
              <div id="dlg-title" class="dialog__title">{{ title }}</div>
              <p class="dialog__sub">
                例如：1000 元买了一部手机。系统按<strong>本地日历日</strong>从购买日累计到今天（含首尾两天）计算每日成本。也可点下方「填入示例」快速体验。
              </p>
            </div>
            <button v-if="!lockUntilFirstSave" type="button" class="icon-btn" aria-label="关闭" @click="closeIfAllowed">
              ✕
            </button>
          </header>

          <form class="form" @submit.prevent="onSubmit">
            <label class="field">
              <span class="field__label">买了什么</span>
              <input v-model="name" class="field__input" type="text" autocomplete="off" placeholder="手机 / 耳机 / 咖啡机…" />
            </label>

            <label class="field">
              <span class="field__label">花了多少钱（元）</span>
              <input v-model="amount" class="field__input mono" inputmode="decimal" placeholder="例如 1000" />
            </label>

            <div class="field">
              <span class="field__label">购买日期</span>
              <CalendarDatePicker v-model="purchaseDate" :disabled="submitting" />
            </div>

            <p v-if="formError" class="form__error" role="alert">{{ formError }}</p>

            <div class="form__demo">
              <button type="button" class="btn btn--link" :disabled="submitting" @click="fillDemo">填入示例（手机 · 1000 元 · 30 天前）</button>
            </div>

            <footer class="form__actions">
              <button v-if="!lockUntilFirstSave" type="button" class="btn btn--ghost" :disabled="submitting" @click="closeIfAllowed">
                取消
              </button>
              <button type="submit" class="btn btn--primary" :disabled="submitting">
                {{ submitting ? '保存中…' : primaryLabel }}
              </button>
            </footer>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="less">
.fade-enter-active,
.fade-leave-active {
  transition: opacity 160ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(5, 3, 12, 0.62);
  backdrop-filter: blur(10px);
}

.dialog {
  width: min(560px, 100%);
  border-radius: 18px;
  padding: 18px 18px 16px;
  overflow: visible;
  color: #eef1ff;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 0 0 1px rgba(94, 234, 255, 0.12) inset,
    0 30px 80px rgba(0, 0, 0, 0.55);
}

.dialog__head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dialog__title {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.dialog__sub {
  margin: 8px 0 0;
  color: rgba(232, 236, 255, 0.72);
  line-height: 1.55;
  font-size: 13px;
}

.icon-btn {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.25);
  color: rgba(255, 255, 255, 0.86);
  width: 38px;
  height: 38px;
  border-radius: 12px;
  cursor: pointer;
}

.form {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 8px;
}

.field__label {
  font-size: 12px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(232, 236, 255, 0.62);
}

.field__input {
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.28);
  color: #f6f7ff;
  padding: 12px 12px;
  font-size: 15px;
}

.form__error {
  margin: 0;
  color: #ffb4d1;
  font-size: 13px;
}

.form__demo {
  display: flex;
  justify-content: flex-start;
}

.btn--link {
  border: none;
  background: transparent;
  color: rgba(94, 234, 255, 0.92);
  cursor: pointer;
  font-size: 13px;
  text-decoration: underline;
  padding: 0;
}

.btn--link:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.form__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 6px;
}

.btn {
  border-radius: 14px;
  padding: 10px 14px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 650;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--ghost {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.18);
  color: rgba(255, 255, 255, 0.86);
}

.btn--primary {
  border-color: rgba(94, 234, 255, 0.35);
  background: linear-gradient(135deg, rgba(94, 234, 255, 0.22), rgba(255, 61, 165, 0.22));
  color: #0b1020;
}
</style>
