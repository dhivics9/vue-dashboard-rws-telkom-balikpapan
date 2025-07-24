<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <img src="@/assets/wholphin_logo.jpg" alt="Wholphin Logo" class="logo" />
      <h2>WHOLPHIN</h2>
    </div>
    <nav class="sidebar-nav">
      <RouterLink to="/" class="nav-link">
        <span class="material-icons">dashboard</span>
        <span>Beranda</span>
      </RouterLink>
      <RouterLink to="/table" class="nav-link">
        <span class="material-icons">table_rows</span>
        <span>Tabel Data</span>
      </RouterLink>
      <RouterLink to="/submission" class="nav-link">
        <span class="material-icons">note_add</span>
        <span>Berkas Dokumen</span>
      </RouterLink>
       <!-- Space untuk link lain di pengembangan selanjutnya -->
    </nav>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>