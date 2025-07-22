<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const document = ref(null);
const errorState = ref(null); // State baru untuk menampung pesan error

async function fetchDocumentDetail() {
  const docId = route.params.id;
  console.log('Mencoba mengambil detail untuk dokumen ID:', docId); // DEBUG (Pastiin ID benar)

  try {
    const response = await fetch(`http://localhost:3000/api/documents/${docId}`);
    console.log('Status Respons API:', response.status); // DEBUG (Lihat status respons)

    if (!response.ok) {
      throw new Error(`Server merespons dengan status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Data yang diterima dari API:', data); // DEBUG (Lihat data yang diterima)


    if (data && Object.keys(data).length > 0) {
      document.value = data;
    } else {
      throw new Error("Data yang diterima kosong atau tidak valid.");
    }

  } catch (error) {
    console.error("Gagal mengambil detail dokumen:", error);
    errorState.value = error.message;
  }
}

function getFileExtension(filename) {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
}

onMounted(fetchDocumentDetail);
</script>

<template>
  <main>
    <!-- Tampilkan detail jika dokumen berhasil dimuat -->
    <div v-if="document">
      <div class="page-header">
        <h1 class="page-title">Detail for: {{ document.file_name }}</h1>
        <button class="btn btn-secondary" @click="$router.push('/submission')">
          <span class="material-icons">arrow_back</span>
          Back to List
        </button>
      </div>
      <div class="card">
        <div class="document-details">
            <p><strong>Customer:</strong> {{ document.customer_name }}</p>
            <p><strong>Order Type:</strong> {{ document.order_type }}</p>
            <p><strong>Description:</strong> {{ document.description || 'No description provided.' }}</p>
            <p><strong>Uploaded On:</strong> {{ new Date(document.upload_timestamp).toLocaleString() }}</p>
        </div>
        
        <a :href="`http://localhost:3000/api/documents/download/${document.id}`" class="btn btn-primary download-btn">
          <span class="material-icons">file_download</span>
          Download File
        </a>
        
        <div class="file-preview">
          <h3>File Preview</h3>
          <iframe 
                v-if="getFileExtension(document.file_name) === 'pdf'"
                :src="`http://localhost:3000/api/documents/preview/${document.id}`" 
                width="100%"
                height="600px"
                frameborder="0"
            ></iframe>
          <img 
                v-else-if="['jpg', 'jpeg', 'png', 'gif'].includes(getFileExtension(document.file_name))"
                :src="`http://localhost:3000/api/documents/preview/${document.id}`"
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

    <!-- Tampilkan pesan error jika terjadi masalah -->
    <div v-else-if="errorState" class="card error-state">
      <h2 class="page-title">Failed to Load Document</h2>
      <p>There was a problem retrieving the document details.</p>
      <p><strong>Reason:</strong> {{ errorState }}</p>
    </div>

    <!-- Tampilkan pesan loading jika belum ada data dan belum ada error -->
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
  margin-bottom: var(--spacing-lg);
}
.document-details p {
  margin-bottom: var(--spacing-sm);
}
.download-btn {
  margin-top: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}
.file-preview {
  border-top: 1px solid var(--color-border-light);
  padding-top: var(--spacing-lg);
}
.image-preview {
  max-width: 100%;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--color-border);
}
.preview-unavailable, .loading-state, .error-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-secondary);
}
</style>