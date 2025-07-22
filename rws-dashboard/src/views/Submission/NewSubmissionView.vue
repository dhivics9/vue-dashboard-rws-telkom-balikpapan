<!-- File: src/views/NewSubmissionView.vue -->
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

// Gunakan useRouter untuk bisa navigasi antar halaman
const router = useRouter();

// State untuk menampung nilai dari setiap input form
const customerName = ref('');
const orderType = ref('Modify'); // Nilai default
const description = ref('');
const documentFile = ref(null);
const isSubmitting = ref(false); // State untuk menampilkan status loading pada tombol

// Fungsi untuk menangani saat file dipilih oleh pengguna
const handleFileChange = (event) => {
  // Ambil file pertama yang dipilih
  documentFile.value = event.target.files[0];
};

// Fungsi untuk mengirim form ke backend saat tombol "Submit" diklik
const handleSubmit = async () => {
  // Validasi sederhana: pastikan nama pelanggan dan file sudah diisi
  if (!customerName.value || !documentFile.value) {
    alert('Please fill in the customer name and select a file.');
    return;
  }

  isSubmitting.value = true; // Tampilkan status loading

  // FormData adalah cara standar untuk mengirim file dan data teks bersamaan
  const formData = new FormData();
  formData.append('customerName', customerName.value);
  formData.append('orderType', orderType.value);
  formData.append('description', description.value);
  formData.append('documentFile', documentFile.value); // 'documentFile' harus cocok dengan nama di backend (multer)

  try {
    const response = await fetch('http://localhost:3000/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      // Jika server mengembalikan error, tampilkan pesannya
      throw new Error(result.message || 'Upload failed due to a server error.');
    }

    alert('Success: ' + result.message);
    
    // Setelah sukses, arahkan pengguna kembali ke halaman daftar dokumen
    router.push('/submission');

  } catch (error) {
    console.error('Submission error:', error);
    alert('Error: ' + error.message);
  } finally {
    isSubmitting.value = false; // Sembunyikan status loading, baik sukses maupun gagal
  }
};
</script>

<template>
  <main>
    <div class="page-header">
      <h1 class="page-title">Submit New Document</h1>
      <!-- Tombol untuk kembali ke halaman daftar -->
      <button class="btn btn-secondary" @click="$router.push('/submission')">
        <span class="material-icons">arrow_back</span>
        Back to List
      </button>
    </div>

    <div class="card">
      <!-- @submit.prevent akan memanggil fungsi handleSubmit saat form disubmit -->
      <form @submit.prevent="handleSubmit">
        
        <!-- Input untuk Nama Pelanggan -->
        <div class="form-group">
          <label for="customer-name">Customer Name</label>
          <input id="customer-name" type="text" v-model="customerName" required placeholder="e.g., PT. Telkom Indonesia" />
        </div>

        <!-- Dropdown untuk Jenis Order -->
        <div class="form-group">
          <label for="order-type">Order Type</label>
          <select id="order-type" v-model="orderType">
            <option value="Modify">Modify</option>
            <option value="New">New</option>
            <option value="Cancel">Cancel</option>
          </select>
        </div>

        <!-- Text area untuk Deskripsi -->
        <div class="form-group">
          <label for="description">Description (Optional)</label>
          <textarea id="description" v-model="description" rows="4" placeholder="Add any relevant notes here..."></textarea>
        </div>

        <!-- Input untuk File Dokumen -->
        <div class="form-group">
          <label for="file-input">Document File (PDF, JPG, PNG, etc.)</label>
          <input id="file-input" type="file" @change="handleFileChange" required />
        </div>

        <!-- Tombol Submit -->
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Submitting...' : 'Submit Document' }}
        </button>
      </form>
    </div>
  </main>
</template> 

<style scoped>
  /* Menggunakan variabel dari file CSS global Anda untuk konsistensi */
  .card {
    max-width: 700px;
    margin: 0 auto;
    padding: var(--spacing-xl);
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-base);
    font-family: var(--font-family);
    transition: all var(--transition-fast);
  }
  
  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
    outline: none;
  }

  button[type="submit"] {
    width: 100%;
    padding: 0.8rem;
    font-size: 1.1rem;
    margin-top: 1rem;
  }

  /* Style untuk page header agar judul dan tombol sejajar */
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }
</style>
