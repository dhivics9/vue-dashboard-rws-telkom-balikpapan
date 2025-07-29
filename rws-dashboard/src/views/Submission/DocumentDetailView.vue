<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const document = ref(null);
const errorState = ref(null);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

async function fetchDocumentDetail() {
  const docId = route.params.id;
  try {
    const response = await fetch(`${apiBaseUrl}/api/documents/${docId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Server responded with status: ${response.status}`);
    }
    document.value = await response.json();
  } catch (error) {
    console.error("Gagal mengambil detail dokumen:", error);
    errorState.value = error.message;
  }
}

function getFileExtension(filename) {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
}

onMounted(fetchDocumentDetail);
</script>

<template>
  <main>
    <div v-if="document">
      <div class="page-header">
        <h1 class="page-title">{{ document.file_name }}</h1>
        <button class="btn btn-secondary" @click="$router.push('/submission')">
          <span class="material-icons">arrow_back</span>
          Back to List
        </button>
      </div>
      <div class="card">
        <div class="document-details common-details">
            <p><strong>Document Type:</strong> {{ document.document_type }}</p>
            <p><strong>Description:</strong> {{ document.description || 'No description provided.' }}</p>
            <p><strong>Uploaded On:</strong> {{ new Date(document.upload_timestamp).toLocaleString() }}</p>
        </div>

        <hr>

        <div class="document-details specific-details">
            <div v-if="document.document_type === 'berita_acara'">
                <h4>Berita Acara Details</h4>
                <p><strong>Nama Pelanggan:</strong> {{ document.nama_pelanggan }}</p>
                <p><strong>Lokasi Kerja:</strong> {{ document.lokasi_kerja }}</p>
                <p><strong>Jenis Layanan:</strong> {{ document.jenis_layanan }}</p>
                <p><strong>MO:</strong> {{ document.mo }}</p>
                <p><strong>SID:</strong> {{ document.sid }}</p>
                <p><strong>Bandwidth Sebelumnya:</strong> {{ document.bw_prev }}</p>
                <p><strong>Bandwidth Baru:</strong> {{ document.bw_new }}</p>
                <p><strong>Tanggal Mulai:</strong> {{ formatDate(document.tanggal_mulai) }}</p>
            </div>  

            <div v-else-if="document.document_type === 'resign_letter'">
                <h4>Resignation Letter Details</h4>
                <p><strong>Employee Name:</strong> {{ document.employee_name }}</p>
                <p><strong>Employee ID:</strong> {{ document.employee_id }}</p>
                <p><strong>Last Day of Work:</strong> {{ document.last_day_of_work }}</p>
                <p><strong>Reason:</strong> {{ document.reason || 'No reason provided.' }}</p>
            </div>

            <div v-else-if="document.document_type === 'other'">
              <h4>General Document</h4>
              <p class="other-details-info">This is a general document with no specific details. Please refer to the description and the file preview.</p>
          </div>
        </div>
        
        <a :href="`${apiBaseUrl}/api/documents/${document.id}/download`" class="btn btn-primary download-btn">
          <span class="material-icons">file_download</span>
          Download File
        </a>
        
        <div class="file-preview">
          <h3>File Preview</h3>
          <iframe 
            v-if="getFileExtension(document.file_name) === 'pdf'"
            :src="`${apiBaseUrl}/api/documents/${document.id}/preview`" 
            width="100%"
            height="600px"
            frameborder="0"
          ></iframe>
          <img 
            v-else-if="['jpg', 'jpeg', 'png', 'gif'].includes(getFileExtension(document.file_name))"
            :src="`${apiBaseUrl}/api/documents/${document.id}/preview`"
            alt="File Preview"
            class="image-preview"
          />
          <div v-else class="preview-unavailable">
            <span class="material-icons">visibility_off</span>
            <p>Preview not available for this file type.</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="errorState" class="card error-state">
      <h2 class="page-title">Failed to Load Document</h2>
      <p>There was a problem retrieving the document details.</p>
      <p><strong>Reason:</strong> {{ errorState }}</p>
    </div>

    <div v-else class="card loading-state">
      <p>Loading document details...</p>
    </div>
  </main>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.document-details p {
  margin-bottom: 0.75rem;
  word-break: break-word;
}
.specific-details h4 {
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    color: var(--color-primary);
    border-bottom: 1px solid var(--color-border-light);
    padding-bottom: 0.5rem;
}
.download-btn {
  margin-top: 1rem;
  margin-bottom: 2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.file-preview {
  border-top: 1px solid var(--color-border);
  padding-top: 1.5rem;
}
.image-preview {
  max-width: 100%;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}
.preview-unavailable, .loading-state, .error-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-secondary);
}
</style>