<!-- File: src/views/submission/SubmissionListView.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const documents = ref([]);
const router = useRouter();
const isLoading = ref(false);

const searchTerm = ref('');
const selectedType = ref('all');

async function fetchDocuments() {
  isLoading.value = true;
  try {
    const params = new URLSearchParams({
      search: searchTerm.value,
      type: selectedType.value,
    });
    
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiBaseUrl}/api/documents?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    documents.value = await response.json();
  } catch (error) {
    console.error("Gagal mengambil daftar dokumen:", error);
  } finally {
    isLoading.value = false;
  }
}

function viewDocument(id) {
  router.push(`/submission/${id}`);
}

async function deleteDocument(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;
  
  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiBaseUrl}/api/documents/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete document');
    fetchDocuments();
  } catch (error) {
    console.error("Gagal menghapus dokumen:", error);
  }
}

onMounted(fetchDocuments);
</script>

<template>
  <main>
    <div class="page-header">
      <h1 class="page-title">Document Repository</h1>
      <button class="btn btn-primary" @click="$router.push('/submission/new')">
        <span class="material-icons">add</span>
        New Document
      </button>
    </div>

    <div class="card filter-controls">
      <div class="form-group search-bar">
        <span class="material-icons">search</span>
        <input 
          type="search" 
          v-model="searchTerm" 
          placeholder="Cari berdasarkan nama file, deskripsi, pelanggan..."
          @keyup.enter="fetchDocuments"
        />
      </div>
      <div class="form-group">
        <select v-model="selectedType" @change="fetchDocuments">
          <option value="all">Semua Tipe Dokumen</option>
          <option value="berita_acara">Berita Acara</option>
          <option value="resign_letter">Resignation Letter</option>
          <option value="other">Other Document</option>
        </select>
      </div>
      <button class="btn btn-secondary" @click="fetchDocuments">Cari</button>
    </div>

    <div class="card">
      <table>
        <thead>
          <tr>
            <th>Tipe Dokumen</th>
            <th>Subjek Utama</th>
            <th>Nama File</th>
            <th>Tanggal Upload</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="5" class="text-center">Memuat dokumen...</td>
          </tr>
          <tr v-else-if="documents.length === 0">
            <td colspan="5" class="text-center">Tidak ada dokumen yang ditemukan.</td>
          </tr>
          <tr v-else v-for="doc in documents" :key="doc.id">
            <td><span class="doc-type-badge">{{ doc.document_type.replace('_', ' ') }}</span></td>
            <td>{{ doc.primary_subject || '-' }}</td>
            <td>{{ doc.file_name }}</td>
            <td>{{ new Date(doc.upload_timestamp).toLocaleDateString('id-ID') }}</td>
            <td>
              <button class="btn btn-secondary btn-sm" @click="viewDocument(doc.id)">View</button>
              <button class="btn btn-danger btn-sm" @click="deleteDocument(doc.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.filter-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem 1.5rem;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-grow: 1;
}

.form-group {
  margin: 0;
}

.form-group.search-bar {
  flex-grow: 1; 
  position: relative;
}

.search-bar .material-icons {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-light);
  pointer-events: none;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-family: var(--font-family);
  transition: all var(--transition-fast);
}

.form-group.search-bar input {
  padding-left: 40px; 
}

.form-group select {
  min-width: 200px;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
  outline: none;
}

.text-center {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}
.doc-type-badge {
  background-color: var(--color-background);
  padding: 0.25rem 0.5rem;
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
}
</style>
