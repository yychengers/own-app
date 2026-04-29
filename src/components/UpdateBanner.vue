<script setup lang="ts">
import { onMounted, ref } from 'vue'

const KEY = 'daily-amortize:last-build-id'

const visible = ref(false)

onMounted(() => {
  const current = typeof __APP_BUILD_ID__ === 'string' ? __APP_BUILD_ID__ : 'dev'
  const prev = localStorage.getItem(KEY)
  if (prev && prev !== current) visible.value = true
  localStorage.setItem(KEY, current)
})

function reload() {
  window.location.reload()
}
</script>

<template>
  <div v-if="visible" class="banner" role="status">
    <span>检测到站点已更新，建议刷新以加载最新脚本。</span>
    <button type="button" class="btn" @click="reload">立即刷新</button>
    <button type="button" class="link" @click="visible = false">稍后</button>
  </div>
</template>

<style scoped lang="less">
.banner {
  position: sticky;
  top: 0;
  z-index: 90;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(94, 234, 255, 0.25);
  background: linear-gradient(90deg, rgba(94, 234, 255, 0.12), rgba(255, 61, 165, 0.1));
  color: #eef1ff;
  font-size: 13px;
}

.btn {
  border-radius: 12px;
  border: 1px solid rgba(94, 234, 255, 0.35);
  background: rgba(0, 0, 0, 0.25);
  color: #eef1ff;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: 700;
}

.link {
  border: none;
  background: transparent;
  color: rgba(232, 236, 255, 0.75);
  cursor: pointer;
  text-decoration: underline;
  font-size: 13px;
}
</style>
