<!-- File: src/views/tools/SyncDataView.vue -->
<script setup>
import { ref } from 'vue';
import { useDataStore } from '@/stores/dataStore';

const store = useDataStore();
const targetFile = ref(null);
const fileInputRef = ref(null);

function handleFileSelect(event) {
  targetFile.value = event.target.files[0];
}

async function startSync() {
  if (!targetFile.value) {
    alert('Harap pilih file Excel Target (OGD) terlebih dahulu.');
    return;
  }
  await store.startSyncProcess(targetFile.value);
  
  if (fileInputRef.value) {
    fileInputRef.value.value = null;
  }
  targetFile.value = null;
}
</script>

<template>
  <main>
    <h1 class="page-title">Sinkronisasi Data</h1>
    <p class="page-description">
      Gunakan halaman ini untuk memperbarui seluruh data di dashboard dengan mengambil data terbaru dari API pusat dan menggabungkannya dengan data target dari file OGD.
    </p>

    <div class="card sync-card">
      <h3>Langkah-langkah Sinkronisasi</h3>
      <ol class="steps">
        <li>Backend akan mengambil data Revenue, NCX, dan Sales terbaru dari API pusat.</li>
        <li>Pilih file Excel **Revenue Summary (OGD)** yang berisi data target.</li>
        <li>Klik tombol "Mulai Sinkronisasi" untuk memulai proses penggabungan dan penyimpanan data.</li>
      </ol>

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

      <button class="btn btn-primary" @click="startSync" :disabled="store.isSyncing">
        <span v-if="store.isSyncing" class="material-icons spinning">autorenew</span>
        <span v-else class="material-icons">sync</span>
        {{ store.isSyncing ? 'Sedang Sinkronisasi...' : 'Mulai Sinkronisasi' }}
      </button>

      <div v-if="store.syncStatus" class="status-log">
        <h4>Log Sinkronisasi:</h4>
        <pre>{{ store.syncStatus }}</pre>
      </div>
    </div>
  </main>
</template>

<style scoped>
.page-description {
  margin-top: -1rem;
  margin-bottom: 2rem;
  color: var(--color-text-secondary);
}
.sync-card {
  max-width: 800px;
}
.steps {
  margin-bottom: 2rem;
  padding-left: 1.5rem;
}
.steps li {
  margin-bottom: 0.5rem;
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
.status-log {
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}
.status-log pre {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: var(--border-radius-md);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
