<script setup>
import { useUiStore } from '@/stores/uiStore';

const uiStore = useUiStore();
</script>

<template>
  <button @click="uiStore.toggleTheme" class="theme-switcher" :title="`Switch to ${uiStore.theme === 'light' ? 'dark' : 'light'} mode`">
    <span v-if="uiStore.theme === 'light'" class="material-icons">dark_mode</span>
    <span v-else class="material-icons">light_mode</span>
  </button>
</template>

<style scoped>
.theme-switcher {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid transparent;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}
.theme-switcher:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.1) rotate(15deg);
}
.material-icons {
  transition: all var(--transition-fast);
}
</style>
