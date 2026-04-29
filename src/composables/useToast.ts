import { ref } from 'vue';

export type ToastType = 'ok' | 'err' | 'info';

export type ToastItem = { id: number; message: string; type: ToastType };

const toasts = ref<ToastItem[]>([]);
let seq = 0;

export function useToastList() {
  return toasts;
}

export function pushToast(message: string, type: ToastType = 'info') {
  const id = ++seq;
  toasts.value = [...toasts.value, { id, message, type }];
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }, 3200);

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'ok') navigator.vibrate(12);
      else if (type === 'err') navigator.vibrate([28, 36, 28]);
    } catch {
      /* ignore */
    }
  }
}
