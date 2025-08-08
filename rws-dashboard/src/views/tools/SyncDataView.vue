<script setup>
import { ref } from 'vue';
import { useDataStore } from '@/stores/dataStore';

const store = useDataStore();
const targetFile = ref(null);
const fileInputRef = ref(null);

function handleFileSelect(event) {
  targetFile.value = event.target.files[0];
}

async function startUpload() {
  if (!targetFile.value) {
    alert('Harap pilih file Excel Target (OGD) terlebih dahulu.');
    return;
  }
  await store.uploadTargetFile(targetFile.value);
  
  if (fileInputRef.value) {
    fileInputRef.value.value = null;
  }
  targetFile.value = null;
}
</script>

<template>
  <main>
    <h1 class="page-title">Manajemen Data</h1>
    <p class="page-description">
      Gunakan halaman ini untuk mengelola dan memperbarui data di dalam dashboard.
    </p>

    <!-- BAGIAN BARU: PEMICU SINKRONISASI API -->
    <div class="card sync-card">
      <h3>Sinkronisasi Data API (Live)</h3>
      <p>
        Proses ini akan mengambil data Revenue, NCX, dan Sales terbaru dari API pusat. Proses ini berjalan otomatis setiap malam, tetapi Anda bisa memicunya secara manual di sini jika diperlukan.
      </p>
      <button class="btn btn-secondary" @click="store.triggerApiSync" :disabled="store.isApiSyncing || store.isUploadingTarget">
        <span v-if="store.isApiSyncing" class="material-icons spinning">autorenew</span>
        <span v-else class="material-icons">cloud_sync</span>
        {{ store.isApiSyncing ? 'Sedang Sinkronisasi API...' : 'Jalankan Sinkronisasi API Sekarang' }}
      </button>
    </div>

    <!-- BAGIAN LAMA: UPLOAD FILE TARGET -->
    <div class="card sync-card">
      <h3>Upload Data Target (Manual)</h3>
      <p>
        Pilih file Excel **Revenue Summary (OGD)** yang berisi data target untuk memperbarui laporan performa di seluruh dashboard.
      </p>

      <div class="upload-section">
        <label for="target-file-upload" class="btn btn-secondary">
          <span class="material-icons">upload_file</span>
          Pilih File Target (OGD)
        </label>
        <input
          type="file"
          id="target-file-upload"
          ref="fileInputRef"
          accept=".xlsx, .xls"
          @change="handleFileSelect"
          style="display: none;"
        />
        <span v-if="targetFile" class="file-name">{{ targetFile.name }}</span>
      </div>

      <button class="btn btn-primary" @click="startUpload" :disabled="store.isUploadingTarget || store.isApiSyncing">
        <span v-if="store.isUploadingTarget" class="material-icons spinning">autorenew</span>
        <span v-else class="material-icons">publish</span>
        {{ store.isUploadingTarget ? 'Sedang Mengupload...' : 'Upload File Target' }}
      </button>
    </div>
  </main>
</template>

<style scoped>
/* Tambahkan style ini untuk memisahkan kartu */
.sync-card {
  max-width: 800px;
  margin-bottom: 2rem; /* Beri jarak antar kartu */
}
.sync-card p {
    margin-bottom: 1.5rem;
}
.upload-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.file-name {
  color: var(--color-text-secondary);
  font-style: italic;
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
