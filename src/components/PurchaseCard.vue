<script setup lang="ts">
import { toRef } from 'vue'
import type { Purchase } from '@/stores/purchases'
import { usePurchaseMetrics } from '@/composables/usePurchaseMetrics'
import { formatYuan } from '@/utils/money'

const props = defineProps<{
  item: Purchase
  todayYmd: string
  accent: string
}>()

const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'edit', item: Purchase): void
}>()

const { daysUsed, dailyYuan } = usePurchaseMetrics(toRef(props, 'item'), toRef(props, 'todayYmd'))
</script>

<template>
  <article class="card" :style="{ '--accent': accent }">
    <div class="card__glow" aria-hidden="true" />

    <header class="card__head">
      <div>
        <h2 class="card__title">{{ item.name }}</h2>
        <p class="card__meta mono">购买日 {{ item.purchaseDate }} · 总价 {{ formatYuan(item.amountYuan) }} 元</p>
      </div>

      <div class="card__actions">
        <button type="button" class="card__action" @click="emit('edit', item)">编辑</button>
        <button type="button" class="card__action card__action--danger" aria-label="删除记录" @click="emit('remove', item.id)">
          删除
        </button>
      </div>
    </header>

    <div class="card__stats">
      <div class="stat">
        <div class="stat__k">已用天数（本地日历）</div>
        <div class="stat__v mono">{{ daysUsed }} 天</div>
      </div>
      <div class="stat stat--hero">
        <div class="stat__k">今日摊销（元 / 天）</div>
        <div class="stat__v mono stat__v--big">{{ formatYuan(dailyYuan) }}</div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="less">
.card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
  padding: 16px 16px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.18));
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
}

.card__glow {
  position: absolute;
  inset: -40% -30% auto -30%;
  height: 220px;
  background: radial-gradient(closest-side, color-mix(in oklab, var(--accent) 55%, transparent), transparent 70%);
  opacity: 0.55;
  filter: blur(18px);
  transform: translate3d(0, 0, 0);
  pointer-events: none;
}

.card__head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card__title {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.2px;
}

.card__meta {
  margin: 8px 0 0;
  color: rgba(232, 236, 255, 0.68);
  font-size: 12px;
}

.card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.card__action {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.22);
  color: rgba(255, 255, 255, 0.78);
  padding: 8px 10px;
  cursor: pointer;
  font-size: 12px;
}

.card__action--danger {
  border-color: rgba(255, 61, 165, 0.22);
  color: rgba(255, 200, 220, 0.92);
}

.card__stats {
  position: relative;
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 10px;
}

.stat {
  border-radius: 14px;
  padding: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
}

.stat--hero {
  border-color: color-mix(in oklab, var(--accent) 35%, rgba(255, 255, 255, 0.12));
  box-shadow: 0 0 0 1px color-mix(in oklab, var(--accent) 22%, transparent) inset;
}

.stat__k {
  font-size: 11px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: rgba(232, 236, 255, 0.62);
}

.stat__v {
  margin-top: 8px;
  font-weight: 750;
  letter-spacing: 0.2px;
}

.stat__v--big {
  font-size: 26px;
  color: color-mix(in oklab, var(--accent) 78%, white);
}

@media (max-width: 640px) {
  .card__stats {
    grid-template-columns: 1fr;
  }
}
</style>
