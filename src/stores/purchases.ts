import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

const STORAGE_KEY = 'daily-amortize:purchases:v1';

export type Purchase = {
  id: string;
  name: string;
  amountYuan: number;
  purchaseDate: string;
};

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  items: Purchase[];
};

function safeRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function tryNormalizeRow(row: unknown): Purchase | null {
  if (!row || typeof row !== 'object') return null;
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
    return null;
  return { id, name: name.trim(), amountYuan, purchaseDate };
}

function loadFromStorage(): { items: Purchase[]; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], error: null };
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { items: [], error: '数据格式异常，已重置列表。' };
    const items: Purchase[] = [];
    for (const row of parsed) {
      const it = tryNormalizeRow(row);
      if (it) items.push(it);
    }
    return { items, error: null };
  } catch {
    return { items: [], error: '读取本地数据失败，已使用空列表。' };
  }
}

function persist(items: Purchase[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function parseImportPayload(text: string): { items: Purchase[] } | { error: string } {
  let root: unknown;
  try {
    root = JSON.parse(text) as unknown;
  } catch {
    return { error: 'JSON 解析失败，请检查文件内容。' };
  }
  let rows: unknown[];
  if (Array.isArray(root)) rows = root;
  else if (root && typeof root === 'object' && Array.isArray((root as ExportPayload).items))
    rows = (root as ExportPayload).items;
  else return { error: '格式应为记录数组，或包含 items 数组的对象。' };

  const items: Purchase[] = [];
  for (const row of rows) {
    const it = tryNormalizeRow(row);
    if (it) items.push(it);
  }
  if (!items.length) return { error: '没有可用的记录条目。' };
  return { items };
}

export const usePurchasesStore = defineStore('purchases', () => {
  const items = ref<Purchase[]>([]);
  const loadError = ref<string | null>(null);
  const isHydrated = ref(false);
  /** 最近删除（内存），最多 5 条，用于撤销 */
  const undoStack = ref<Purchase[]>([]);

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
    const hit = items.value.find((p) => p.id === id);
    if (!hit) return;
    undoStack.value.unshift(hit);
    if (undoStack.value.length > 5) undoStack.value = undoStack.value.slice(0, 5);
    items.value = items.value.filter((p) => p.id !== id);
    persist(items.value);
  }

  function undoDelete(): boolean {
    const hit = undoStack.value.shift();
    if (!hit) return false;
    if (items.value.some((p) => p.id === hit.id)) {
      return false;
    }
    items.value = [hit, ...items.value];
    persist(items.value);
    return true;
  }

  function clearUndoStack() {
    undoStack.value = [];
  }

  function clearAll() {
    undoStack.value = [];
    items.value = [];
    persist(items.value);
  }

  function exportJson(): string {
    const payload: ExportPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: items.value.map((p) => ({ ...p })),
    };
    return JSON.stringify(payload, null, 2);
  }

  function importJson(
    text: string,
    mode: 'merge' | 'replace',
  ): { ok: true; count: number } | { ok: false; message: string } {
    const parsed = parseImportPayload(text);
    if ('error' in parsed) return { ok: false, message: parsed.error };

    if (mode === 'replace') {
      const next = parsed.items.map((p) => ({
        id: safeRandomId(),
        name: p.name,
        amountYuan: p.amountYuan,
        purchaseDate: p.purchaseDate,
      }));
      items.value = next;
      persist(items.value);
      undoStack.value = [];
      return { ok: true, count: next.length };
    }

    const injected = parsed.items.map((p) => ({
      id: safeRandomId(),
      name: p.name,
      amountYuan: p.amountYuan,
      purchaseDate: p.purchaseDate,
    }));
    items.value = [...injected, ...items.value];
    persist(items.value);
    return { ok: true, count: injected.length };
  }

  return {
    items,
    loadError,
    isHydrated,
    hasItems,
    undoStack,
    hydrate,
    addPurchase,
    updatePurchase,
    removePurchase,
    undoDelete,
    clearUndoStack,
    clearAll,
    exportJson,
    importJson,
  };
});
