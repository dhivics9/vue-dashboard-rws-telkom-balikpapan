// File: src/stores/uiStore.js
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const theme = ref(localStorage.getItem('theme') || 'light');

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  watch(theme, (newTheme) => {
    // Simpan pilihan ke localStorage
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, { immediate: true });

  return {
    theme,
    toggleTheme,
  };
});
