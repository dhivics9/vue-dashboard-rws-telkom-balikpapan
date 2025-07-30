<!-- File: src/views/tools/JsonToExcelView.vue -->
<script setup>
import { ref } from 'vue';
import * as XLSX from 'xlsx';

const jsonInput = ref('');
const fileName = ref('converted_data');
const error = ref(null);
const isLoading = ref(false);
const fileInputRef = ref(null);
const uploadStatusMessage = ref('');

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  fileName.value = file.name.replace(/\.[^/.]+$/, "");

  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    jsonInput.value = content;
    error.value = null;
    uploadStatusMessage.value = `✅ File "${file.name}" berhasil dimuat (${content.length.toLocaleString()} karakter). Siap untuk dikonversi.`;
  };
  reader.onerror = (e) => {
    error.value = "Gagal membaca file.";
    uploadStatusMessage.value = '';
    console.error("File reading error:", e);
  };
  reader.readAsText(file);
}

function onManualInput() {
    uploadStatusMessage.value = '';
}

function convertAndDownload() {
  isLoading.value = true;
  error.value = null;
  uploadStatusMessage.value = '';

  if (!jsonInput.value.trim()) {
    error.value = 'Input JSON tidak boleh kosong.';
    isLoading.value = false;
    return;
  }

  try {
    const data = JSON.parse(jsonInput.value);
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('JSON harus berupa array (array of objects) yang tidak kosong.');
    }
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    
    setTimeout(() => {
      XLSX.writeFile(workbook, `${fileName.value || 'converted_data'}.xlsx`);
      isLoading.value = false;
    }, 500);

  } catch (e) {
    console.error("Error converting JSON:", e);
    error.value = `Gagal mengonversi: ${e.message}. Pastikan format JSON Anda valid.`;
    isLoading.value = false;
  }
}
</script>

<template>
  <main>
    <h1 class="page-title">JSON to Excel Converter</h1>
    <p class="page-description">
      Alat ini aman dan berjalan sepenuhnya di browser Anda. Data Anda tidak pernah dikirim ke server mana pun.
    </p>

    <div class="card converter-card">
      <div class="upload-section">
        <label for="json-file-upload" class="btn btn-secondary">
          <span class="material-icons">upload_file</span>
          Upload JSON File
        </label>
        <input
          type="file"
          id="json-file-upload"
          ref="fileInputRef"
          accept=".json"
          @change="handleFileSelect"
          style="display: none;"
        />
        <span v-if="fileInputRef?.files[0]" class="file-name">{{ fileInputRef.files[0].name }}</span>
      </div>

      <div v-if="uploadStatusMessage" class="status-message success">
        {{ uploadStatusMessage }}
      </div>

      <div class="separator">
        <span>ATAU</span>
      </div>
      
      <div class="form-group">
        <label for="json-input">Paste your JSON data here:</label>
        <textarea
          id="json-input"
          v-model="jsonInput"
          @input="onManualInput"
          rows="15"
          placeholder='[{"kolom1": "nilai1", "kolom2": "nilai2"},{"kolom1": "nilai3", "kolom2": "nilai4"}]'
        ></textarea>
      </div>

      <div class="form-group">
        <label for="file-name">Output file name (without .xlsx):</label>
        <input id="file-name" type="text" v-model="fileName" />
      </div>

      <div v-if="error" class="status-message error">
        {{ error }}
      </div>

      <button class="btn btn-primary" @click="convertAndDownload" :disabled="isLoading">
        <span v-if="isLoading" class="material-icons spinning">autorenew</span>
        <span v-else class="material-icons">file_download</span>
        {{ isLoading ? 'Converting...' : 'Convert & Download' }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.page-description {
  margin-top: -1rem;
  margin-bottom: 2rem;
  color: var(--color-text-secondary);
  font-style: italic;
}
.converter-card { max-width: 800px; }
.form-group { margin-bottom: 1.5rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
textarea, input[type="text"] {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-family: monospace;
  font-size: 0.9rem;
}
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.upload-section { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
.file-name { color: var(--color-text-secondary); font-style: italic; font-size: 0.9rem; }
.separator { display: flex; align-items: center; text-align: center; color: var(--color-border); margin-bottom: 1.5rem; }
.separator::before, .separator::after { content: ''; flex: 1; border-bottom: 1px solid var(--color-border); }
.separator:not(:empty)::before { margin-right: .25em; }
.separator:not(:empty)::after { margin-left: .25em; }

.status-message {
  padding: 1rem;
  border-radius: var(--border-radius-md);
  margin-bottom: 1.5rem;
  font-weight: 500;
}
.status-message.error {
  background-color: #fbeee4;
  color: #d35400;
}
.status-message.success {
  background-color: #eafaf1;
  color: #27ae60;
}
</style>
