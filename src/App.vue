<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppToast from '@/components/AppToast.vue'
import UpdateBanner from '@/components/UpdateBanner.vue'
</script>

<template>
  <div class="app-root">
    <UpdateBanner />
    <div class="app-root__aurora" aria-hidden="true" />
    <div class="app-root__grid" aria-hidden="true" />
    <RouterView />
    <AppToast />
  </div>
</template>

<style scoped lang="less">
.app-root {
  min-height: 100dvh;
  position: relative;
  overflow-x: hidden;
  color: #e8ecff;
  background: radial-gradient(1200px 800px at 10% -10%, #2b1055 0%, transparent 55%),
    radial-gradient(900px 700px at 110% 10%, #0b3b4f 0%, transparent 50%),
    linear-gradient(165deg, #07060f 0%, #0f0a1e 38%, #12081f 100%);
}

.app-root__aurora {
  position: fixed;
  inset: -20%;
  background: conic-gradient(
    from 200deg at 50% 50%,
    rgba(255, 61, 165, 0.22),
    rgba(94, 234, 255, 0.18),
    rgba(168, 122, 255, 0.22),
    rgba(255, 214, 102, 0.16),
    rgba(255, 61, 165, 0.22)
  );
  filter: blur(80px);
  opacity: 0.55;
  animation: spin-aurora 28s linear infinite;
  pointer-events: none;
}

.app-root__grid {
  position: fixed;
  inset: 0;
  background-image: linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at 50% 0%, black 0%, transparent 72%);
  pointer-events: none;
}

@keyframes spin-aurora {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .app-root__aurora {
    animation: none;
    opacity: 0.28;
  }
}
</style>
