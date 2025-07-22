<script setup>
import { useDataStore } from '@/stores/dataStore';

const props = defineProps({
  showItemsPerPage: {
    type: Boolean,
    default: false
  },
  itemsPerPageOptions: {
    type: Array,
    default: () => [5, 10, 20, 25]
  }
});

// Get the data store
const store = useDataStore();
</script>

<template>
  <div class="filter-bar">
    <div class="filter-control">
      <label for="regional-filter">Filter by Regional</label>
      <select id="regional-filter" v-model="store.selectedRegional">
        <option v-for="regional in store.regionalList" :key="regional" :value="regional">
          {{ regional }}
        </option>
      </select>
    </div>

    <div class="filter-control">
      <label for="witel-filter">Filter by Witel</label>
      <select id="witel-filter" v-model="store.selectedWitel">
        <option v-for="witel in store.witelList" :key="witel" :value="witel">
          {{ witel }}
        </option>
      </select>
    </div>

    <div class="filter-control">
      <label for="status-filter">Filter by Status</label>
      <select id="status-filter" v-model="store.statusFilter">
        <option value="All">All</option>
        <option value="New">New</option>
        <option value="Modify">Modify</option>
        <option value="Cancel">Cancel</option>
      </select>
    </div>

    <div class="filter-control">
      <label for="year-filter">Filter by Year</label>
      <select id="year-filter" v-model="store.selectedYear">
        <option v-for="year in store.yearList" :key="year" :value="year">
          {{ year }}
        </option>
      </select>
    </div>

    <div class="filter-control">
      <label for="month-filter">Filter by Month</label>
      <select id="month-filter" v-model="store.selectedMonthNumber">
        <option v-for="month in store.monthNumberList" :key="month.value" :value="month.value">
          {{ month.label }}
        </option>
      </select>
    </div>
    
    <!-- Conditionally render items per page -->
    <div v-if="showItemsPerPage" class="filter-control">
      <label for="items-per-page">Items per page</label>
      <select id="items-per-page" v-model="store.itemsPerPage">
        <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-control {
  display: flex;
  flex-direction: column;
  min-width: 200px;
  flex: 1;
}

.filter-control label {
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: #555;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.filter-control select {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  font-family: 'Poppins', sans-serif;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.filter-control select:focus {
  border-color: #41B883;
  box-shadow: 0 0 0 2px rgba(65, 184, 131, 0.2);
  outline: none;
}

/* Responsive design */
@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    padding: 15px;
  }
  
  .filter-control {
    width: 100%;
    min-width: unset;
  }
}
</style>