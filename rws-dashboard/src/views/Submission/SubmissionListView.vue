<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const documents = ref([]);
const router = useRouter();

async function fetchDocuments() {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    documents.value = await response.json();
  } catch (error) {
    console.error("Gagal mengambil daftar dokumen:", error);
  }
}

function viewDocument(id) {
  router.push(`/submission/${id}`);
}

async function deleteDocument(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) return;
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/documents/${id}`, { method: 'DELETE' });
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
    <div class="card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Document Type</th>
            <th>File Type</th> 
            <th>File Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id">
            <td>{{ doc.id }}</td>
            <td>{{ doc.document_type }}</td>
            <td>{{ doc.file_type }}</td> 
            <td>{{ doc.file_name }}</td>
            <td>
              <button class="btn btn-secondary btn-sm" @click="viewDocument(doc.id)">View</button>
              <button class="btn btn-danger btn-sm" @click="deleteDocument(doc.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="documents.length === 0">
            <td colspan="6" style="text-align: center; padding: 20px;">No documents found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>