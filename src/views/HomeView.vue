<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AddPurchaseModal from '@/components/AddPurchaseModal.vue'
import PurchaseCard from '@/components/PurchaseCard.vue'
import { useLocalCalendarDay } from '@/composables/useLocalCalendarDay'
import type { Purchase } from '@/stores/purchases'
import { usePurchasesStore } from '@/stores/purchases'
import { inclusiveCalendarDaysBetween } from '@/utils/dates'
import { formatYuan } from '@/utils/money'

const store = usePurchasesStore()
const { todayYmd } = useLocalCalendarDay()

const modalOpen = ref(false)
/** 弹窗编辑中的记录 id；与「新增」互斥 */
const editingId = ref<string | null>(null)

const accents = ['#5eeaff', '#ff3da5', '#ffd666', '#a87aff', '#58ffa9', '#ff8a3d'] as const
const accentAt = (i: number) => accents[i % accents.length]!

onMounted(() => {
  store.hydrate()
})

watch(
  () => store.isHydrated && !store.hasItems,
  (need) => {
    if (need) modalOpen.value = true
  },
  { immediate: true },
)

watch(
  () => store.hasItems,
  (has) => {
    if (!has) modalOpen.value = true
  },
)

const lockModal = computed(() => store.isHydrated && !store.hasItems)

const totalDaily = computed(() => {
  const day = todayYmd.value
  let sum = 0
  for (const it of store.items) {
    const days = inclusiveCalendarDaysBetween(it.purchaseDate, day)
    sum += it.amountYuan / days
  }
  return sum
})

function openModal() {
  editingId.value = null
  modalOpen.value = true
}

function onEdit(item: Purchase) {
  editingId.value = item.id
  modalOpen.value = true
}

watch(modalOpen, (open) => {
  if (!open) editingId.value = null
})

function onRemove(id: string) {
  const ok = window.confirm('确定删除这条记录吗？')
  if (!ok) return
  store.removePurchase(id)
}
</script>

<template>
  <main class="home">
    <header class="hero">
      <div class="hero__badge mono">LOCAL · {{ todayYmd }}</div>
      <h1 class="hero__title">每日摊销实验室</h1>
      <p class="hero__desc">把一次性支出摊到每一天：价格 ÷ 从购买日到今天（含首尾）的日历天数。每天 0 点按你电脑的本地时区自动换日。</p>

      <div v-if="store.loadError" class="banner banner--warn" role="status">
        {{ store.loadError }}
      </div>

      <section v-if="store.isHydrated && store.hasItems" class="hero__summary" aria-label="汇总">
        <div class="pill">
          <div class="pill__k">全部物品今日合计</div>
          <div class="pill__v mono">{{ formatYuan(totalDaily) }} 元 / 天</div>
        </div>
        <div class="pill pill--soft">
          <div class="pill__k">记录条数</div>
          <div class="pill__v mono">{{ store.items.length }}</div>
        </div>
      </section>
    </header>

    <section v-if="!store.isHydrated" class="loading" aria-live="polite">
      <div class="loading__spinner" />
      <p class="loading__text mono">正在读取本地记录…</p>
    </section>

    <section v-else class="list" aria-label="消费列表">
      <PurchaseCard
        v-for="(it, idx) in store.items"
        :key="it.id"
        :item="it"
        :today-ymd="todayYmd"
        :accent="accentAt(idx)"
        @remove="onRemove"
        @edit="onEdit"
      />
    </section>

    <button v-if="store.isHydrated && store.hasItems" type="button" class="fab" aria-label="新增记录" @click="openModal">
      <span class="fab__plus">＋</span>
    </button>

    <AddPurchaseModal v-model:open="modalOpen" :lock-until-first-save="lockModal" :editing-id="editingId" />
  </main>
</template>

<style scoped lang="less">
.home {
  max-width: 980px;
  margin: 0 auto;
  padding: calc(26px + env(safe-area-inset-top)) max(18px, env(safe-area-inset-right))
    calc(96px + env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left));
  position: relative;
  z-index: 1;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.22);
  color: rgba(232, 236, 255, 0.78);
  font-size: 12px;
}

.hero__title {
  margin: 14px 0 10px;
  font-size: clamp(28px, 4vw, 40px);
  line-height: 1.05;
  letter-spacing: -0.6px;
  background: linear-gradient(120deg, #ffffff, #c9d6ff 40%, #5eeaff 70%, #ff3da5);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero__desc {
  margin: 0;
  max-width: 72ch;
  color: rgba(232, 236, 255, 0.72);
  line-height: 1.65;
  font-size: 14px;
}

.hero__summary {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1.4fr 0.7fr;
  gap: 12px;
}

.pill {
  border-radius: 16px;
  padding: 14px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  box-shadow: 0 0 0 1px rgba(94, 234, 255, 0.12) inset;
}

.pill--soft {
  box-shadow: none;
}

.pill__k {
  font-size: 12px;
  color: rgba(232, 236, 255, 0.62);
  letter-spacing: 0.4px;
}

.pill__v {
  margin-top: 8px;
  font-size: 22px;
  font-weight: 800;
}

.banner {
  margin-top: 14px;
  border-radius: 14px;
  padding: 12px 12px;
  border: 1px solid rgba(255, 214, 102, 0.22);
  background: rgba(255, 214, 102, 0.08);
  color: rgba(255, 236, 190, 0.92);
  font-size: 13px;
  line-height: 1.55;
}

.loading {
  margin-top: 22px;
  display: grid;
  place-items: center;
  gap: 12px;
  padding: 40px 0;
  color: rgba(232, 236, 255, 0.72);
}

.loading__spinner {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.14);
  border-top-color: rgba(94, 234, 255, 0.85);
  animation: spin 900ms linear infinite;
}

.loading__text {
  margin: 0;
  font-size: 13px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.list {
  margin-top: 18px;
  display: grid;
  gap: 12px;
}

.fab {
  position: fixed;
  right: max(18px, env(safe-area-inset-right));
  bottom: calc(18px + env(safe-area-inset-bottom));
  z-index: 40;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  border: 1px solid rgba(94, 234, 255, 0.35);
  cursor: pointer;
  color: #0b1020;
  font-weight: 900;
  background: linear-gradient(135deg, rgba(94, 234, 255, 0.95), rgba(255, 61, 165, 0.85));
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.45);
}

.fab__plus {
  font-size: 30px;
  line-height: 1;
}

@media (max-width: 720px) {
  .hero__summary {
    grid-template-columns: 1fr;
  }
}
</style>
