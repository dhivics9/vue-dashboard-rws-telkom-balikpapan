<script setup>
import { useDataStore } from '@/stores/dataStore';
import FilterBar from '../../components/FilterBar.vue';
import { onMounted } from 'vue';

const store = useDataStore();

const exportToExcel = () => {
  alert('Export functionality will be implemented here');
};

onMounted(() => {
  if (store.tableData.length === 0) {
    store.fetchDashboardData();
  }
});
</script>

<template>
  <main>
    <h1 class="page-title">Data Table</h1>
    
    <FilterBar :showItemsPerPage="true" />

    <div class="table-section">
      <div class="table-header">
        <h2 class="table-title">Revenue Data</h2>
        <button class="btn btn-primary" @click="exportToExcel">
          <span class="material-icons">file_download</span>
          Export to Excel
        </button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Regional</th>
            <th>Witel</th>
            <th>LCCD</th>
            <th>Stream</th>
            <th>Product Name</th>
            <th>Gl Account</th>
            <th>BP Number</th>
            <th>Customer Name</th>
            <th>Customer Type</th>
            <th>Target</th>
            <th>Revenue</th>
            <th>Periode</th>
            <th>Target RKAPP</th>
          </tr>
        </thead>
        
        <tbody>
          <tr v-for="row in store.paginatedData" :key="row.id">
            <td>{{ row.regional }}</td>
            <td>{{ row.witel }}</td>
            <td>{{ row.lccd }}</td>
            <td>{{ row.stream }}</td>
            <td>{{ row.product_name }}</td>
            <td>{{ row.gl_account }}</td>
            <td>{{ row.bp_number }}</td>
            <td>{{ row.customer_name }}</td>
            <td>{{ row.customer_type }}</td>
            <td>{{ row.target }}</td>
            <td>{{ row.revenue }}</td>
            <td>{{ row.periode }}</td>
            <td>{{ row.target_rkapp }}</td>
            <td>
              <span class="status-badge" :class="`status-${(row.rev_type || '').toLowerCase()}`">
                {{ row.rev_type }}
              </span>
            </td>
            <td class="revenue-cell">Rp.{{ (row.revenue || 0).toLocaleString() }}</td>
          </tr>
          <tr v-if="store.paginatedData.length === 0">
            <td colspan="7" style="text-align: center; padding: 20px;">
              {{ store.isLoading ? 'Loading...' : 'No data found.' }}
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination-controls">
        <button @click="store.currentPage--" :disabled="store.currentPage === 1">Previous</button>
        <span>Page {{ store.currentPage }} of {{ store.totalPages }}</span>
        <button @click="store.currentPage++" :disabled="store.currentPage === store.totalPages">Next</button>
      </div>
    </div>
  </main>
</template>
