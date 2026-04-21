import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { Purchase } from '@/stores/purchases';
import { inclusiveCalendarDaysBetween } from '@/utils/dates';

export function usePurchaseMetrics(
  item: MaybeRefOrGetter<Purchase>,
  todayYmd: MaybeRefOrGetter<string>,
) {
  const daysUsed = computed(() =>
    inclusiveCalendarDaysBetween(toValue(item).purchaseDate, toValue(todayYmd)),
  );

  const dailyYuan = computed(() => {
    const d = daysUsed.value;
    const amount = toValue(item).amountYuan;
    if (d <= 0) return amount;
    return amount / d;
  });

  return { daysUsed, dailyYuan };
}
