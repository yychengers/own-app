<script setup lang="ts">
import { useToastList } from '@/composables/useToast'

const list = useToastList()
</script>

<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="t in list"
          :key="t.id"
          class="toast"
          :class="[`toast--${t.type}`]"
          role="status"
        >
          {{ t.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="less">
.toast-host {
  position: fixed;
  left: 50%;
  bottom: calc(24px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  width: min(520px, calc(100vw - 32px));
  pointer-events: none;
}

.toast {
  pointer-events: none;
  border-radius: 14px;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 650;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(10, 8, 20, 0.92);
  color: #eef1ff;
  box-shadow: 0 16px 50px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(10px);
}

.toast--ok {
  border-color: rgba(88, 255, 169, 0.35);
}

.toast--err {
  border-color: rgba(255, 61, 165, 0.45);
}

.toast--info {
  border-color: rgba(94, 234, 255, 0.35);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
