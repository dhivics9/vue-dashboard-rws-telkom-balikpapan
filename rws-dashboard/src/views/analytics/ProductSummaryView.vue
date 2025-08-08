<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useDataStore } from '@/stores/dataStore';

const store = useDataStore();
const reportData = ref([]);
const isLoading = ref(false);
const error = ref(null);

const getCurrentMonthForInput = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// State untuk filter
const filters = reactive({
  periode: getCurrentMonthForInput().replace('-', ''),
  regional: 'All',
  witel: 'All',
  lccd: 'All',
  stream: 'All',
  customerType: 'All'
});

const selectedMonthInput = ref(getCurrentMonthForInput());

const expandedProducts = ref({});

function toggleProduct(productName) {
  expandedProducts.value[productName] = !expandedProducts.value[productName];
}

async function fetchReport() {
  isLoading.value = true;
  error.value = null;
  filters.periode = selectedMonthInput.value.replace('-', '');
  try {
    const params = new URLSearchParams(filters);
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${apiBaseUrl}/api/reports/product-summary?${params.toString()}`);
    if (!response.ok) throw new Error('Gagal mengambil data laporan.');
    reportData.value = await response.json();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchReport);
</script>

<template>
  <main>
    <h1 class="page-title">Product & Customer Summary Report</h1>

    <!-- Filter Section -->
    <div class="card filter-section">
      <div class="filter-control">
        <label>Periode</label>
        <input type="month" v-model="selectedMonthInput">
      </div>
      <div class="filter-control">
        <label>Regional</label>
        <select v-model="filters.regional">
          <option value="All">All Regionals</option>
          <option v-for="r in store.regionalList.filter(i => i !== 'All Regionals')" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>
      <div class="filter-control">
        <label>Witel</label>
        <select v-model="filters.witel">
          <option value="All">All Witels</option>
          <option v-for="w in store.witelList.filter(i => i !== 'All Witels')" :key="w" :value="w">{{ w }}</option>
        </select>
      </div>
      <div class="filter-control">
        <label>LCCD</label>
        <select v-model="filters.lccd">
          <option value="All">All LCCDs</option>
          <option v-for="l in store.lccdList.filter(i => i !== 'All LCCDs')" :key="l" :value="l">{{ l }}</option>
        </select>
      </div>
      <div class="filter-control">
        <label>Stream</label>
        <select v-model="filters.stream">
          <option value="All">All Streams</option>
          <option v-for="s in store.streamList.filter(i => i !== 'All Streams')" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="filter-control">
        <label>Customer Type</label>
        <select v-model="filters.customerType">
          <option value="All">All Customer Types</option>
          <option v-for="c in store.customerTypeList.filter(i => i !== 'All Customer Types')" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="fetchReport" :disabled="isLoading">
        <span class="material-icons">search</span>
        Apply Filter
      </button>
    </div>

    <div v-if="isLoading" class="card text-center"><p>Loading report...</p></div>
    <div v-else-if="error" class="card error-state"><p>{{ error }}</p></div>

    <!-- Report Table -->
    <div v-else class="card report-table-card">
      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>Total Target</th>
            <th>Total Revenue</th>
          </tr>
        </thead>
        <tbody v-if="reportData.length > 0">
          <template v-for="product in reportData" :key="product.product_name">
            <tr @click="toggleProduct(product.product_name)" class="product-row">
              <td>
                <span class="material-icons expand-icon" :class="{ 'is-open': expandedProducts[product.product_name] }">chevron_right</span>
                {{ product.product_name }}
              </td>
              <td>Rp. {{ product.total_target.toLocaleString('id-ID') }}</td>
              <td>Rp. {{ product.total_revenue.toLocaleString('id-ID') }}</td>
            </tr>
            <tr v-if="expandedProducts[product.product_name]" v-for="customer in product.customers" :key="customer.customer_name" class="customer-row">
              <td class="customer-name-cell">{{ customer.customer_name }}</td>
              <td>Rp. {{ customer.target.toLocaleString('id-ID') }}</td>
              <td>Rp. {{ customer.revenue.toLocaleString('id-ID') }}</td>
            </tr>
          </template>
        </tbody>
        <tbody v-else>
            <tr>
                <td colspan="3" class="text-center">No data found for the selected filters.</td>
            </tr>
        </tbody>
      </table>
    </div>
  </main>
</template>

<style scoped>
.filter-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 2rem;
}
.filter-control {
  display: flex;
  flex-direction: column;
}
.filter-control label {
  font-size: 0.8rem;
  margin-bottom: 0.25rem;
}
.product-row {
  font-weight: 600;
  background-color: var(--color-background);
  cursor: pointer;
}
.product-row:hover {
  background-color: var(--color-primary-light);
}
.customer-row td:first-child {
  padding-left: 3rem; /* Indentasi untuk nama pelanggan */
}
.customer-name-cell {
    color: var(--color-text-secondary);
}
.expand-icon {
  transition: transform 0.3s ease;
  vertical-align: middle;
  margin-right: 0.5rem;
}
.expand-icon.is-open {
  transform: rotate(90deg);
}
.text-center {
    text-align: center;
    padding: 2rem;
}
</style>
