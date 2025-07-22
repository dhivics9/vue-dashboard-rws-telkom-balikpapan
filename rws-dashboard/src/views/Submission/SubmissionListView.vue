<!-- src/views/SubmissionListView.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const documents = ref([]);
const router = useRouter();

async function fetchDocuments() {
  try {
    const response = await fetch('http://localhost:3000/api/documents');
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
    await fetch(`http://localhost:3000/api/documents/${id}`, { method: 'DELETE' });
    // Refresh daftar setelah berhasil menghapus
    fetchDocuments();
  } catch (error) {
    console.error("Gagal menghapus dokumen:", error);
  }
}

// Ambil data saat komponen pertama kali dimuat
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
            <th>Customer Name</th>
            <th>Order Type</th>
            <th>File Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in documents" :key="doc.id">
            <td>{{ doc.id }}</td>
            <td>{{ doc.customer_name }}</td>
            <td>{{ doc.order_type }}</td>
            <td>{{ doc.file_name }}</td>
            <td>
              <button class="btn btn-secondary btn-sm" @click="viewDocument(doc.id)">View</button>
              <button class="btn btn-danger btn-sm" @click="deleteDocument(doc.id)">Delete</button>
            </td>
          </tr>
          <tr v-if="documents.length === 0">
            <td colspan="5" style="text-align: center; padding: 20px;">No documents found.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>