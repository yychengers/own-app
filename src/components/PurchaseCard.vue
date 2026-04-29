<script setup lang="ts">
import { computed, toRef } from 'vue'
import type { Purchase } from '@/stores/purchases'
import { usePurchaseMetrics } from '@/composables/usePurchaseMetrics'
import { formatYuan } from '@/utils/money'

const props = defineProps<{
  item: Purchase
  todayYmd: string
  accent: string
  /** 达到即显示纪念标签（天） */
  milestones: number[]
}>()

const emit = defineEmits<{
  (e: 'remove', id: string): void
  (e: 'edit', item: Purchase): void
}>()

const { daysUsed, dailyYuan } = usePurchaseMetrics(toRef(props, 'item'), toRef(props, 'todayYmd'))

const achievedMilestones = computed(() =>
  [...props.milestones].filter((m) => daysUsed.value >= m).sort((a, b) => a - b),
)

const tomorrowDaily = computed(() => props.item.amountYuan / (daysUsed.value + 1))

const yearProgressPct = computed(() => Math.min(100, (daysUsed.value / 365) * 100))

const amortizedLinear = computed(() => dailyYuan.value * daysUsed.value)
</script>

<template>
  <article class="card" :style="{ '--accent': accent }">
    <div class="card__glow" aria-hidden="true" />

    <header class="card__head">
      <div>
        <div class="card__title-row">
          <h2 class="card__title">{{ item.name }}</h2>
          <ul v-if="achievedMilestones.length" class="badges" aria-label="已达成里程碑">
            <li v-for="m in achievedMilestones" :key="m" class="badge mono">已满 {{ m }} 天</li>
          </ul>
        </div>
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

    <div class="card__extra">
      <div class="row">
        <span class="row__k">明日起若仍持有（多计 1 天）</span>
        <span class="row__v mono">约 {{ formatYuan(tomorrowDaily) }} 元/天</span>
      </div>
      <div class="row">
        <span class="row__k">线性模型累计（日均×天数）</span>
        <span class="row__v mono">{{ formatYuan(amortizedLinear) }} 元</span>
      </div>
      <p class="row__hint">在「日历日均」定义下，上式应与总价一致（仅可能存在四舍五入误差）。</p>

      <div class="prog">
        <div class="prog__k">以 365 天为刻度的「使用感」进度（非财务折旧）</div>
        <div class="prog__bar" role="presentation">
          <div class="prog__fill" :style="{ width: `${yearProgressPct}%` }" />
        </div>
        <div class="prog__pct mono">{{ Math.round(yearProgressPct * 10) / 10 }}%</div>
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

.card__title-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.card__title {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.2px;
}

.badges {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid color-mix(in oklab, var(--accent) 40%, rgba(255, 255, 255, 0.12));
  background: rgba(0, 0, 0, 0.25);
  color: color-mix(in oklab, var(--accent) 85%, white);
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

.card__extra {
  position: relative;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  gap: 8px;
}

.row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 13px;
}

.row__k {
  color: rgba(232, 236, 255, 0.65);
}

.row__v {
  color: rgba(232, 236, 255, 0.92);
  font-weight: 750;
}

.row__hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.45;
  color: rgba(232, 236, 255, 0.52);
}

.prog {
  margin-top: 4px;
}

.prog__k {
  font-size: 11px;
  color: rgba(232, 236, 255, 0.58);
  margin-bottom: 6px;
}

.prog__bar {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.prog__fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(94, 234, 255, 0.85), rgba(255, 61, 165, 0.75));
  transition: width 220ms ease;
}

.prog__pct {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(232, 236, 255, 0.72);
}

@media (max-width: 640px) {
  .card__stats {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .prog__fill {
    transition: none;
  }
}
</style>
