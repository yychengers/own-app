import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const STORAGE_KEY = 'daily-amortize:purchases:v1';

export type Purchase = {
  id: string;
  name: string;
  amountYuan: number;
  purchaseDate: string;
};

function safeRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function loadFromStorage(): { items: Purchase[]; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], error: null };
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { items: [], error: '数据格式异常，已重置列表。' };
    const items: Purchase[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      const id = typeof r.id === 'string' ? r.id : safeRandomId();
      const name = typeof r.name === 'string' ? r.name : '';
      const amountYuan =
        typeof r.amountYuan === 'number' && Number.isFinite(r.amountYuan) ? r.amountYuan : NaN;
      const purchaseDate = typeof r.purchaseDate === 'string' ? r.purchaseDate : '';
      if (
        !name.trim() ||
        !Number.isFinite(amountYuan) ||
        amountYuan <= 0 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)
      )
        continue;
      items.push({ id, name: name.trim(), amountYuan, purchaseDate });
    }
    return { items, error: null };
  } catch {
    return { items: [], error: '读取本地数据失败，已使用空列表。' };
  }
}

function persist(items: Purchase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export const usePurchasesStore = defineStore('purchases', () => {
  const items = ref<Purchase[]>([]);
  const loadError = ref<string | null>(null);
  const isHydrated = ref(false);

  const hasItems = computed(() => items.value.length > 0);

  function hydrate() {
    const { items: loaded, error } = loadFromStorage();
    items.value = loaded;
    loadError.value = error;
    isHydrated.value = true;
  }

  function addPurchase(input: Omit<Purchase, 'id'>): { ok: true } | { ok: false; message: string } {
    const name = input.name.trim();
    if (!name) return { ok: false, message: '请填写物品名称。' };
    if (!Number.isFinite(input.amountYuan) || input.amountYuan <= 0)
      return { ok: false, message: '金额需为大于 0 的数字。' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.purchaseDate))
      return { ok: false, message: '购买日期格式不正确。' };

    const next: Purchase = {
      id: safeRandomId(),
      name,
      amountYuan: input.amountYuan,
      purchaseDate: input.purchaseDate,
    };
    items.value = [next, ...items.value];
    persist(items.value);
    return { ok: true };
  }

  function updatePurchase(
    id: string,
    input: Omit<Purchase, 'id'>,
  ): { ok: true } | { ok: false; message: string } {
    const idx = items.value.findIndex((p) => p.id === id);
    if (idx === -1) return { ok: false, message: '找不到该记录，可能已被删除。' };

    const name = input.name.trim();
    if (!name) return { ok: false, message: '请填写物品名称。' };
    if (!Number.isFinite(input.amountYuan) || input.amountYuan <= 0)
      return { ok: false, message: '金额需为大于 0 的数字。' };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.purchaseDate))
      return { ok: false, message: '购买日期格式不正确。' };

    const next = [...items.value];
    next[idx] = { id, name, amountYuan: input.amountYuan, purchaseDate: input.purchaseDate };
    items.value = next;
    persist(items.value);
    return { ok: true };
  }

  function removePurchase(id: string) {
    items.value = items.value.filter((p) => p.id !== id);
    persist(items.value);
  }

  return {
    items,
    loadError,
    isHydrated,
    hasItems,
    hydrate,
    addPurchase,
    updatePurchase,
    removePurchase,
  };
});
