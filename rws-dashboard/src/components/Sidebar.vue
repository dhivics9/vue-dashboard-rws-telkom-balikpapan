<script setup>
import { RouterLink } from 'vue-router';
import { ref } from 'vue';
import ThemeSwitcher from './ThemeSwitcher.vue';


const openMenu = ref('');

function toggleMenu(menuName) {
  if (openMenu.value === menuName) {
    openMenu.value = '';
  } else {
    openMenu.value = menuName;
  }
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img src="@/assets/wholphin_logo.png" alt="Wholphin Logo" class="logo" />
      <h2>WHOLPHIN</h2>
    </div>
    <nav class="sidebar-nav">
      <RouterLink to="/" class="nav-link">
        <span class="material-icons">dashboard</span>
        <span>Beranda</span>
      </RouterLink>

      <div class="nav-item">
        <a @click="toggleMenu('analytics')" class="nav-link nav-link-parent">
          <span class="material-icons">insights</span>
          <span>Revenue</span>
          <span class="material-icons chevron" :class="{ 'is-open': openMenu === 'analytics' }">expand_more</span>
        </a>
        <div v-if="openMenu === 'analytics'" class="sub-menu">
          <RouterLink to="/analytics/table" class="nav-link">
            <span>Revenue Data</span>
          </RouterLink>
          <RouterLink to="/analytics/regional-report" class="nav-link">
            <span>Revenue Performance</span>
          </RouterLink>
        </div>
      </div>

      <RouterLink to="/submission" class="nav-link">
        <span class="material-icons">note_add</span>
        <span>Berkas Dokumen</span>
      </RouterLink>
    </nav>

    <RouterLink to="/tools/json-converter" class="nav-link">
        <span class="material-icons">transform</span>
        <span>JSON Converter</span>
    </RouterLink>

    <div class="sidebar-footer">
      <ThemeSwitcher />
    </div>
  </aside>
</template>

<style scoped>
.nav-item {
  display: flex;
  flex-direction: column;
}

.nav-link-parent {
  cursor: pointer;
  justify-content: space-between;
}

.chevron {
  transition: transform 0.3s ease;
}

.chevron.is-open {
  transform: rotate(180deg);
}

.sub-menu {
  display: flex;
  flex-direction: column;
  padding-left: 2.5rem;
  border-left: 2px solid var(--color-primary-light);
  margin-left: 1rem;
  margin-top: 0.5rem;
  gap: 0.5rem;
}

.sub-menu .nav-link {
  padding: 0.5rem 0.5rem;
  font-size: 0.9rem;
}

.sub-menu .nav-link.router-link-exact-active {
    color: white;
    font-weight: var(--font-weight-medium);
}

.sidebar-footer {
  margin-top: auto;
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
}
</style>
