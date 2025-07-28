<script setup>
import { ref } from 'vue';

// State untuk menampung data laporan dan filter
const reportData = ref([]);
const isLoading = ref(false);
const error = ref(null);
// Set periode default ke bulan ini, format YYYYMM
const selectedPeriode = ref(new Date().toISOString().slice(0, 7).replace('-', ''));

// Fungsi untuk memanggil API backend
async function fetchReport() {
  isLoading.value = true;
  error.value = null;
  reportData.value = [];
  try {
    const response = await fetch(`http://localhost:3000/api/reports/regional?periode=${selectedPeriode.value}`);
    if (!response.ok) {
      throw new Error('Gagal mengambil data laporan dari server.');
    }
    const data = await response.json();
    
    // Hitung total untuk baris terakhir
    const total = {
      regional: 'TOTAL',
      tgt_mtd: data.reduce((sum, item) => sum + parseFloat(item.tgt_mtd), 0),
      real_mtd: data.reduce((sum, item) => sum + parseFloat(item.real_mtd), 0),
      tgt_ytd: data.reduce((sum, item) => sum + parseFloat(item.tgt_ytd), 0),
      real_ytd: data.reduce((sum, item) => sum + parseFloat(item.real_ytd), 0),
    };
    // Hitung ACH total
    total.ach_mtd = total.tgt_mtd ? (total.real_mtd / total.tgt_mtd) * 100 : 0;
    total.ach_ytd = total.tgt_ytd ? (total.real_ytd / total.tgt_ytd) * 100 : 0;

    reportData.value = [...data, total];

  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

// Panggil fungsi saat komponen pertama kali dimuat
fetchReport();
</script>

<template>
  <main>
    <h1 class="page-title">Revenue Performance - Per Regional</h1>

    <!-- Filter Section -->
    <div class="card filter-section">
      <div class="filter-control">
        <label for="periode-picker">PERIODE</label>
        <!-- Input untuk memilih bulan dan tahun -->
        <input type="month" id="periode-picker" v-model="selectedPeriode" @change="e => selectedPeriode = e.target.value.replace('-', '')">
      </div>
      <button class="btn btn-primary" @click="fetchReport" :disabled="isLoading">
        <span class="material-icons">search</span>
        Search
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">Loading report...</div>
    <!-- Error State -->
    <div v-if="error" class="error-state">{{ error }}</div>

    <!-- Report Table -->
    <div v-if="reportData.length > 0" class="card report-table-card">
      <div class="report-header">
        <h3>REPORT REVENUE - PER REGIONAL (PERIODE: {{ selectedPeriode }})</h3>
        <div class="action-buttons">
          <button class="btn btn-sm btn-secondary">Excel</button>
          <button class="btn btn-sm btn-secondary">Copy</button>
          <button class="btn btn-sm btn-secondary">JPEG</button>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th rowspan="2">REGIONAL</th>
            <th colspan="4">MTD {{ selectedPeriode }}</th>
            <th colspan="4">YTD {{ selectedPeriode }}</th>
          </tr>
          <tr>
            <!-- MTD Headers -->
            <th>TGT</th>
            <th>REAL</th>
            <th>ACH</th>
            <th>RANK</th>
            <!-- YTD Headers -->
            <th>TGT</th>
            <th>REAL</th>
            <th>ACH</th>
            <th>RANK</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in reportData" :key="index" :class="{ 'total-row': row.regional === 'TOTAL' }">
            <td>{{ row.regional }}</td>
            <!-- MTD Data -->
            <td>{{ parseFloat(row.tgt_mtd).toLocaleString() }}</td>
            <td>{{ parseFloat(row.real_mtd).toLocaleString() }}</td>
            <td>{{ parseFloat(row.ach_mtd).toFixed(2) }}%</td>
            <td>{{ row.rank_mtd || '-' }}</td>
            <!-- YTD Data -->
            <td>{{ parseFloat(row.tgt_ytd).toLocaleString() }}</td>
            <td>{{ parseFloat(row.real_ytd).toLocaleString() }}</td>
            <td>{{ parseFloat(row.ach_ytd).toFixed(2) }}%</td>
            <td>{{ row.rank_ytd || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.filter-section {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 2rem;
}

.report-table-card {
  overflow-x: auto; /* Agar tabel bisa di-scroll di layar kecil */
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap; /* Mencegah teks turun baris */
}

th, td {
  border: 1px solid var(--color-border);
  padding: 0.75rem;
  text-align: right;
}

th {
  background-color: var(--color-secondary);
  color: white;
  text-align: center;
  font-weight: 600;
}

/* Header grup (MTD, YTD) */
thead tr:first-child th {
  background-color: #2c3e50;
}

/* Header sub-kolom (TGT, REAL, etc) */
thead tr:last-child th {
  background-color: #34495e;
}

td:first-child, th:first-child {
  text-align: left;
  font-weight: 500;
}

.total-row {
  font-weight: 700;
  background-color: var(--color-background);
}

.total-row td {
  color: var(--color-text-primary);
}
</style>
