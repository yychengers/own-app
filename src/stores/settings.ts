import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

const SETTINGS_KEY = 'daily-amortize:settings:v1';

export type SortMode = 'dailyDesc' | 'dailyAsc' | 'purchaseDesc';

export type AppSettings = {
  sortMode: SortMode;
  searchQuery: string;
  onlyThisWeek: boolean;
  milestoneDays: number[];
};

const defaultSettings: AppSettings = {
  sortMode: 'purchaseDesc',
  searchQuery: '',
  onlyThisWeek: false,
  milestoneDays: [30, 90, 180, 365],
};

function clampMilestones(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [...defaultSettings.milestoneDays];
  const nums = raw
    .map((n) => (typeof n === 'number' ? n : Number(n)))
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 36500);
  const uniq = [...new Set(nums)].sort((a, b) => a - b);
  return uniq.length ? uniq : [...defaultSettings.milestoneDays];
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const o = JSON.parse(raw) as Record<string, unknown>;
    const sortMode =
      o.sortMode === 'dailyDesc' || o.sortMode === 'dailyAsc' || o.sortMode === 'purchaseDesc'
        ? o.sortMode
        : defaultSettings.sortMode;
    const searchQuery = typeof o.searchQuery === 'string' ? o.searchQuery : '';
    const onlyThisWeek = Boolean(o.onlyThisWeek);
    const milestoneDays = clampMilestones(o.milestoneDays);
    return { sortMode, searchQuery, onlyThisWeek, milestoneDays };
  } catch {
    return { ...defaultSettings };
  }
}

function persistSettings(s: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export const useSettingsStore = defineStore('settings', () => {
  const sortMode = ref<SortMode>(defaultSettings.sortMode);
  const searchQuery = ref(defaultSettings.searchQuery);
  const onlyThisWeek = ref(defaultSettings.onlyThisWeek);
  const milestoneDays = ref<number[]>([...defaultSettings.milestoneDays]);
  const hydrated = ref(false);

  function persistNow() {
    if (!hydrated.value) return;
    persistSettings({
      sortMode: sortMode.value,
      searchQuery: searchQuery.value,
      onlyThisWeek: onlyThisWeek.value,
      milestoneDays: [...milestoneDays.value],
    });
  }

  function hydrate() {
    const s = loadSettings();
    sortMode.value = s.sortMode;
    searchQuery.value = s.searchQuery;
    onlyThisWeek.value = s.onlyThisWeek;
    milestoneDays.value = s.milestoneDays;
    hydrated.value = true;
  }

  watch([sortMode, searchQuery, onlyThisWeek, milestoneDays], persistNow, { deep: true });

  function setMilestoneDaysFromString(csv: string) {
    const parts = csv
      .split(/[,，\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    const nums = parts.map((p) => Number(p)).filter((n) => Number.isFinite(n) && n > 0);
    milestoneDays.value = clampMilestones(nums);
  }

  return {
    sortMode,
    searchQuery,
    onlyThisWeek,
    milestoneDays,
    hydrated,
    hydrate,
    setMilestoneDaysFromString,
  };
});
