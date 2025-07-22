<!-- src/App.vue -->
<script setup>
import { RouterView } from 'vue-router';
import Sidebar from './components/Sidebar.vue';
</script>

<template>
  <div class="app-layout">
    <Sidebar class="app-sidebar" />
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>