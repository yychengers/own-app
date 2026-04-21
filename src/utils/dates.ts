/** 本地日历日的 `YYYY-MM-DD`（与展示/输入一致，避免 UTC 偏移）。 */
export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 从 `YYYY-MM-DD` 解析为本地 0 点时间戳。 */
export function localMidnightMs(ymd: string): number {
  const [y, m, d] = ymd.split('-').map((n) => Number(n))
  if (!y || !m || !d) return NaN
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
}

/**
 * 从购买日到「当前评估日」的**日历日**天数（含首尾两天）。
 * 例：购买日与今天同一天 → 1 天。
 */
export function inclusiveCalendarDaysBetween(ymdStart: string, ymdEnd: string): number {
  const start = localMidnightMs(ymdStart)
  const end = localMidnightMs(ymdEnd)
  if (Number.isNaN(start) || Number.isNaN(end)) return 1
  const diff = Math.floor((end - start) / 86_400_000) + 1
  return Math.max(1, diff)
}

/** 距离下一次本地 0 点的毫秒数（>0）。 */
export function msUntilNextLocalMidnight(now = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  const ms = next.getTime() - now.getTime()
  return Math.max(1, ms)
}
