import { onMounted, onUnmounted, shallowRef } from 'vue';
import { formatLocalYmd, msUntilNextLocalMidnight } from '@/utils/dates';

/**
 * 跟踪本地日历的「今天」`YYYY-MM-DD`，并在每天 0 点准时推进。
 * 同时处理切回前台、休眠唤醒后的漂移校正。
 */
export function useLocalCalendarDay() {
  const todayYmd = shallowRef(formatLocalYmd(new Date()));

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const bumpIfNeeded = () => {
    const next = formatLocalYmd(new Date());
    if (next !== todayYmd.value) todayYmd.value = next;
  };

  /** 用「下一次本地 0 点」链式调度，避免 `setInterval` 漂移。 */
  const scheduleNextMidnight = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      bumpIfNeeded();
      scheduleNextMidnight();
    }, msUntilNextLocalMidnight());
  };

  const onVisibility = () => {
    if (document.visibilityState === 'visible') bumpIfNeeded();
  };

  onMounted(() => {
    bumpIfNeeded();
    scheduleNextMidnight();
    document.addEventListener('visibilitychange', onVisibility);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibility);
    if (timeoutId) clearTimeout(timeoutId);
  });

  return { todayYmd };
}
