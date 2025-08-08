<script setup>
import { ref } from 'vue';
import { useDataStore } from '@/stores/dataStore';

const store = useDataStore();
const files = ref({
  revenueFile: null,
  ncxFile: null,
  salesFile: null,
  targetFile: null,
});

function handleFileSelect(event, fileType) {
  files.value[fileType] = event.target.files[0];
}

async function startUpload() {
  // Validasi sederhana
  if (Object.values(files.value).some(file => !file)) {
    alert('Harap pilih semua empat file Excel yang diperlukan.');
    return;
  }
  await store.uploadAllFiles(files.value);
}
</script>

<template>
  <main>
    <h1 class="page-title">Update Data Manual</h1>
    <p class="page-description">
      Gunakan halaman ini untuk memperbarui seluruh data di dashboard dengan meng-upload file Excel yang relevan.
    </p>

    <div class="card upload-card">
      <h3>Pilih File Data</h3>
      <div class="file-input-grid">
        <!-- Input untuk setiap file -->
        <div class="file-input-group">
          <label for="revenue-file">1. File Revenue (dari API)</label>
          <input type="file" id="revenue-file" @change="handleFileSelect($event, 'revenueFile')" accept=".xlsx, .xls">
          <span v-if="files.revenueFile" class="file-name">{{ files.revenueFile.name }}</span>
        </div>
        <div class="file-input-group">
          <label for="ncx-file">2. File NCX (dari API)</label>
          <input type="file" id="ncx-file" @change="handleFileSelect($event, 'ncxFile')" accept=".xlsx, .xls">
          <span v-if="files.ncxFile" class="file-name">{{ files.ncxFile.name }}</span>
        </div>
        <div class="file-input-group">
          <label for="sales-file">3. File Sales (dari API)</label>
          <input type="file" id="sales-file" @change="handleFileSelect($event, 'salesFile')" accept=".xlsx, .xls">
          <span v-if="files.salesFile" class="file-name">{{ files.salesFile.name }}</span>
        </div>
        <div class="file-input-group">
          <label for="target-file">4. File Target (dari OGD)</label>
          <input type="file" id="target-file" @change="handleFileSelect($event, 'targetFile')" accept=".xlsx, .xls">
          <span v-if="files.targetFile" class="file-name">{{ files.targetFile.name }}</span>
        </div>
      </div>

      <button class="btn btn-primary" @click="startUpload" :disabled="store.isUploading">
        <span v-if="store.isUploading" class="material-icons spinning">autorenew</span>
        <span v-else class="material-icons">publish</span>
        {{ store.isUploading ? 'Sedang Mengupload...' : 'Upload Semua File' }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.file-input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}
.file-input-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
}
.file-input-group input {
  width: 100%;
}
.file-name {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-style: italic;
}
</style>
