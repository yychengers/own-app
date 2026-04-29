import { localMidnightMs } from '@/utils/dates'

/** 本地「周一为一周开始」的当周起止（含）对应的 0 点时间戳。 */
export function localWeekRangeMondayStart(now = new Date()): { startMs: number; endMs: number } {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const mondayOffset = (day + 6) % 7 // Mon=0
  const start = new Date(d)
  start.setDate(d.getDate() - mondayOffset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { startMs: start.getTime(), endMs: end.getTime() }
}

export function isYmdInLocalWeek(ymd: string, now = new Date()): boolean {
  const t = localMidnightMs(ymd)
  if (Number.isNaN(t)) return false
  const { startMs, endMs } = localWeekRangeMondayStart(now)
  return t >= startMs && t <= endMs
}
