<script setup>
import { useDataStore } from '@/stores/dataStore';
import FilterBar from '../components/FilterBar.vue';

// Get the data store
const store = useDataStore();

// Items per page selector options
const itemsPerPageOptions = [5, 10, 20];

// Export function (placeholder)
const exportToExcel = () => {
  alert('Export functionality will be implemented here');
};
</script>

<template>
  <main>
    <h1 class="page-title">Data Table</h1>
    
    <FilterBar :showItemsPerPage="true" :itemsPerPageOptions="itemsPerPageOptions" />

    <div class="table-section">

      <div class="table-header">
        <h2 class="table-title">Customer Data</h2>
        <button class="btn btn-primary" @click="exportToExcel">
          <span class="material-icons">file_download</span>
          Export to Excel
        </button>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Product Label</th>
            <th>Customer Name</th>
            <th>Product Name</th>
            <th>Product Group</th>
            <th>LCCD</th>
            <th>Regional</th>
            <th>Witel</th>
            <th>Status</th>
            <th>Revenue</th>
          </tr>
        </thead>
        
        <tbody>
          <tr v-for="customer in store.paginatedData" :key="customer.Cust_Order_Number">
            <td>{{ store.formatPeriode(customer.Periode) }}</td>
            <td>{{ customer.Product_Label }}</td>
            <td>{{ customer.Customer_Name }}</td>
            <td>{{ customer.Product_Name }}</td>
            <td>{{ customer.Product_Group_Name }}</td>
            <td>{{ customer.LCCD }}</td>
            <td>{{ customer.Regional }}</td>
            <td>{{ customer.Witel }}</td>
            <td>
              <span 
                class="status-badge"
                :class="{
                  'status-new': customer.Rev_Type === 'New',
                  'status-modify': customer.Rev_Type === 'Modify',
                  'status-cancel': customer.Rev_Type === 'Cancel'
                }"
              >
                {{ customer.Rev_Type }}
              </span>
            </td>
            <td class="revenue-cell">Rp.{{ (customer.Revenue || 0).toLocaleString() }}</td>
          </tr>
          <tr v-if="store.paginatedData.length === 0">
            <td colspan="10" style="text-align: center; padding: 20px;">No data found. Please upload a file or adjust your filters.</td>
          </tr>
        </tbody>
      </table>
      
      <div class="pagination-controls">
        <button class="btn btn-secondary btn-sm" @click="store.prevPage" :disabled="store.currentPage === 1">
          <span class="material-icons">chevron_left</span>
          Previous
        </button>
        
        <div class="page-input-control">
          <span>Page</span>
          <input
            type="number"
            v-model.number="store.currentPage"
            min="1"
            :max="store.totalPages"
          />
          <span>of {{ store.totalPages }}</span>
        </div>
        
        <button class="btn btn-secondary btn-sm" @click="store.nextPage" :disabled="store.currentPage === store.totalPages">
          Next
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
    </div>
  </main>
</template>