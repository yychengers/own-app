import { computed, type Ref } from 'vue';
import type { Purchase } from '@/stores/purchases';
import type { SortMode } from '@/stores/settings';
import { inclusiveCalendarDaysBetween } from '@/utils/dates';
import { isYmdInLocalWeek } from '@/utils/week';

export function useDisplayedPurchases(
  items: Ref<Purchase[]>,
  todayYmd: Ref<string>,
  searchQuery: Ref<string>,
  onlyThisWeek: Ref<boolean>,
  sortMode: Ref<SortMode>,
) {
  return computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    const day = todayYmd.value;
    const filtered = items.value.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (onlyThisWeek.value && !isYmdInLocalWeek(p.purchaseDate)) return false;
      return true;
    });

    const decorated = filtered.map((p) => {
      const days = inclusiveCalendarDaysBetween(p.purchaseDate, day);
      const daily = p.amountYuan / days;
      return { p, days, daily, purchaseKey: p.purchaseDate };
    });

    decorated.sort((a, b) => {
      if (sortMode.value === 'dailyDesc') return b.daily - a.daily;
      if (sortMode.value === 'dailyAsc') return a.daily - b.daily;
      return b.purchaseKey.localeCompare(a.purchaseKey);
    });

    return decorated.map((d) => d.p);
  });
}
