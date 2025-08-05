<script setup>
import { ref } from 'vue';

const apiResponse = ref(null);
const isLoading = ref(false);
const error = ref(null);
const currentFetch = ref(''); // Untuk melacak tombol mana yang sedang loading

// Fungsi generik untuk mengambil data
async function fetchData(endpoint) {
  isLoading.value = true;
  currentFetch.value = endpoint; // Set endpoint yang sedang berjalan
  error.value = null;
  apiResponse.value = null;

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiBaseUrl}/api/tools/${endpoint}`);
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Failed to fetch ${endpoint} data.`);
    }

    apiResponse.value = data;

  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
    currentFetch.value = '';
  }
}
</script>

<template>
  <main>
    <h1 class="page-title">API Explorer</h1>
    <p class="page-description">
      Gunakan alat ini untuk mengambil data terbaru langsung dari API pusat.
    </p>

    <div class="card">
      <!-- --- TOMBOL-TOMBOL BARU --- -->
      <div class="button-group">
        <button class="btn btn-primary" @click="fetchData('fetch-revenue')" :disabled="isLoading">
          <span v-if="isLoading && currentFetch === 'fetch-revenue'" class="material-icons spinning">autorenew</span>
          <span v-else class="material-icons">cloud_download</span>
          Fetch Revenue Data
        </button>
        <button class="btn btn-primary" @click="fetchData('fetch-ncx')" :disabled="isLoading">
          <span v-if="isLoading && currentFetch === 'fetch-ncx'" class="material-icons spinning">autorenew</span>
          <span v-else class="material-icons">cloud_download</span>
          Fetch NCX Data
        </button>
        <button class="btn btn-primary" @click="fetchData('fetch-sales')" :disabled="isLoading">
          <span v-if="isLoading && currentFetch === 'fetch-sales'" class="material-icons spinning">autorenew</span>
          <span v-else class="material-icons">cloud_download</span>
          Fetch Sales Data
        </button>
      </div>

      <div v-if="error" class="status-message error">
        <strong>Error:</strong> {{ error }}
      </div>
      
      <div v-if="apiResponse" class="response-container">
        <h3>Raw JSON Response:</h3>
        <pre><code>{{ JSON.stringify(apiResponse, null, 2) }}</code></pre>
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
.button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
}
.response-container {
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}
pre {
  background-color: #2c3e50;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: var(--border-radius-md);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 600px;
  overflow-y: auto;
}
.status-message {
  padding: 1rem;
  border-radius: var(--border-radius-md);
  margin-top: 1.5rem;
  font-weight: 500;
}
.status-message.error {
  background-color: #fbeee4;
  color: #d35400;
}
.spinning {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
