<!-- File: src/views/NewSubmissionView.vue -->
<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const selectedDocumentType = ref('');
const documentFile = ref(null);
const isSubmitting = ref(false);

const formData = reactive({
  description: '',
  // Fields untuk 'berita_acara'
  nama_pelanggan: '',
  lokasi_kerja: '',
  jenis_layanan: '',
  mo: '',
  SID: '',
  bw_prev: '',
  bw_new: '',
  tanggal_mulai: '', // Anda lupa menambahkan ini di template
  // Fields untuk 'resign_letter'
  employee_name: '',
  employee_id: '',
  last_day_of_work: '',
  reason: '',
});



const handleFileChange = (event) => {
  documentFile.value = event.target.files[0];
};

const handleSubmit = async () => {
  if (!selectedDocumentType.value || !documentFile.value) {
    alert('Please select a document type and upload a file.');
    return;
  }
  isSubmitting.value = true;

  const apiFormData = new FormData();

  apiFormData.append('document_type', selectedDocumentType.value);
  apiFormData.append('description', formData.description);
  apiFormData.append('documentFile', documentFile.value);

  switch (selectedDocumentType.value) {
    case 'berita_acara':
      const baFields = ['nama_pelanggan', 'lokasi_kerja', 'jenis_layanan', 'mo', 'SID', 'bw_prev', 'bw_new', 'tanggal_mulai'];
      baFields.forEach(field => apiFormData.append(field, formData[field]));
      break;
    case 'resign_letter':
      const rlFields = ['employee_name', 'employee_id', 'last_day_of_work', 'reason'];
      rlFields.forEach(field => apiFormData.append(field, formData[field]));
      break;
  }

  try {
    const response = await fetch('http://localhost:3000/api/documents', {
      method: 'POST',
      body: apiFormData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Upload failed due to a server error.');
    }

    alert('Success: ' + result.message);
    router.push('/submission');

  } catch (error) {
    console.error('Submission error:', error);
    alert('Error: ' + error.message);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <main>
    <div class="page-header">
      <h1 class="page-title">Submit New Document</h1>
      <button class="btn btn-secondary" @click="$router.push('/submission')">
        <span class="material-icons">arrow_back</span>
        Back to List
      </button>
    </div>

    <div class="card">
      <form @submit.prevent="handleSubmit">

        <div class="form-group">
          <label for="document-type">Document Type</label>
          <select id="document-type" v-model="selectedDocumentType" required>
            <option disabled value="">-- Please select a type --</option>
            <option value="berita_acara">Berita Acara</option>
            <option value="resign_letter">Resignation Letter</option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">Description (Optional)</label>
          <textarea id="description" v-model="formData.description" rows="3" placeholder="Add any relevant notes here..."></textarea>
        </div>

        <div v-if="selectedDocumentType === 'berita_acara'">
          <h3>Detail Berita Acara</h3>
          <div class="form-group">
            <label for="nama_pelanggan">Nama Pelanggan</label>
            <input id="nama_pelanggan" type="text" v-model="formData.nama_pelanggan" required placeholder="e.g., Lil Dips" />
          </div>
          <div class="form-group">
            <label for="lokasi_kerja">Lokasi Kerja</label>
            <input id="lokasi_kerja" type="text" v-model="formData.lokasi_kerja" required placeholder="e.g., PT. Telkom Indonesia" />
          </div>
          <div class="form-group">
            <label for="jenis_layanan">Jenis Layanan</label>
            <input id="jenis_layanan" type="text" v-model="formData.jenis_layanan" required placeholder="e.g., Metro E" />
          </div>
          <div class="form-group">
            <label for="mo">MO</label>
            <input id="mo" type="text" v-model="formData.mo" required placeholder="e.g., 2-12345" />
          </div>
          <div class="form-group">
            <label for="sid">SID</label>
            <input id="sid" type="text" v-model="formData.SID" required placeholder="e.g., 123456" />
          </div>
          <div class="form-group">
            <label for="bw_prev">Bandwidth Sebelumnya</label>
            <input id="bw_prev" type="text" v-model="formData.bw_prev" required placeholder="e.g., 100 Mbps Backhaul 1 Corporate"/>
          </div>
          <div class="form-group">
            <label for="bw_new">Bandwidth Baru</label>
            <input id="bw_new" type="text" v-model="formData.bw_new" required placeholder="e.g., 200 Mbps Backhaul 2 Corporate"/>
          </div>
           <div class="form-group">
            <label for="tanggal_mulai">Tanggal Mulai</label>
            <input id="tanggal_mulai" type="date" v-model="formData.tanggal_mulai" required/>
          </div>
        </div>

        <div v-else-if="selectedDocumentType === 'resign_letter'">
          <h3>Detail Resignation Letter</h3>
          <div class="form-group">
            <label for="employee_name">Employee Name</label>
            <input id="employee_name" type="text" v-model="formData.employee_name" required />
          </div>
          <div class="form-group">
            <label for="employee_id">Employee ID</label>
            <input id="employee_id" type="text" v-model="formData.employee_id" required />
          </div>
           <div class="form-group">
            <label for="last_day_of_work">Last Day of Work</label>
            <input id="last_day_of_work" type="date" v-model="formData.last_day_of_work" />
          </div>
           <div class="form-group">
            <label for="reason">Reason (Optional)</label>
            <textarea id="reason" v-model="formData.reason" rows="3"></textarea>
          </div>
        </div>
        
        <div v-if="selectedDocumentType" class="form-group">
          <label for="file-input">Document File</label>
          <input id="file-input" type="file" @change="handleFileChange" required />
        </div>

        <button v-if="selectedDocumentType" type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Submitting...' : 'Submit Document' }}
        </button>
      </form>
    </div>
  </main>
</template>

<style scoped>
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

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }
</style>
