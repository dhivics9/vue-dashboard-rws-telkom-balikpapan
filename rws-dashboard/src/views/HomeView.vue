<script setup>
import { ref, computed } from 'vue'; // 1. Import 'computed'
import { customers } from '../data/mock-data.js';
import * as XLSX from 'xlsx';
import RevenueBarChart from '../components/RevenueBarChart.vue';
import StatusPieChart from '../components/StatusPieChart.vue';

const customerData = ref([]);
const activeFilter = ref('All');
const isDragging = ref(false);


// const setFilter = (status) => {
//   activeFilter.value = status;
// };

const filteredData = computed(() => {
  if (activeFilter.value === 'All') {
    return customerData.value;
  }
  return customerData.value.filter(
    (customer) => customer.status === activeFilter.value
  );
});


// 1. Initialize customerData with mock data
const processFile = (file) => {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    customerData.value = jsonData;
  };
  reader.readAsArrayBuffer(file);
};

// Normal file input click
const handleFileSelect = (event) => {
  processFile(event.target.files[0]);
};

// drag-and-drop upload
const handleDragOver = () => {
  isDragging.value = true;
};
const handleDragLeave = () => {
  isDragging.value = false;
};
const handleDrop = (event) => {
  isDragging.value = false;
  processFile(event.dataTransfer.files[0]);
};

// 2. Add computed properties to calculate summaries
const totalRevenue = computed(() => {
  // Use .reduce() to sum up the currentRevenue of all customers
  return filteredData.value.reduce((total, customer) => total + customer.currentRevenue, 0);
});

const totalPreviousRevenue = computed(() => {
  return filteredData.value.reduce((total, customer) => total + customer.previousRevenue, 0);
});

const netRevenueChange = computed(() => {
  if (!filteredData.value.length) return 0;

  return filteredData.value.reduce((total, customer) => {
    if (customer.status === 'New') {
      return total + customer.currentRevenue;
    }
    if (customer.status === 'Cancel') {
      return total - customer.previousRevenue;
    }
    if (customer.status === 'Modify') {
      const difference = customer.currentRevenue - customer.previousRevenue;
      return total + difference;
    }
    return total;
  }, 0);
});

const newCustomerCount = computed(() => {
  // Filter for customers with 'New' status, then get the count
  return filteredData.value.filter(customer => customer.status === 'New').length;
});

const modifiedCustomerCount = computed(() => {
  return filteredData.value.filter(customer => customer.status === 'Modify').length;
});

const canceledCustomerCount = computed(() => {
  return filteredData.value.filter(customer => customer.status === 'Cancel').length;
});

const revenueChartData = computed(() => {
  return {
    labels: filteredData.value.map(customer => customer.customerName),
    datasets: [
      {
        label: 'Current Revenue',
        backgroundColor: '#41B883', // A nice Vue green color
        data: customerData.value.map(customer => customer.currentRevenue)
      }
    ]
  };
});

const pieChartData = computed(() => {
  return {
    labels: ['New', 'Modify', 'Cancel'],
    datasets: [
      {
        backgroundColor: ['#41B883', '#E46651', '#00D8FF'],
        data: [
          newCustomerCount.value,
          modifiedCustomerCount.value,
          canceledCustomerCount.value
        ]
      }
    ]
  };
});
</script>

<template>
  <main>
    <h1>Wholesale Dashboard</h1>

    <div class="upload-zone" :class="{ 'is-dragging': isDragging }" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
      <input type="file" id="file-upload" @change="handleFileSelect"/>
      <p>Drag & Drop your Excel file here, or <span>click to select</span>.</p>
    </div>


    <!-- <div class="filter-buttons">
      <button @click="setFilter('All')" :class="{ active: activeFilter === 'All' }">All</button>
      <button @click="setFilter('New')" :class="{ active: activeFilter === 'New' }">New</button>
      <button @click="setFilter('Modify')" :class="{ active: activeFilter === 'Modify' }">Modify</button>
      <button @click="setFilter('Cancel')" :class="{ active: activeFilter === 'Cancel' }">Cancel</button>
    </div> -->

    <div class="filter-section">
      <div class="filter-status">
        <p>Filter by status</p>
        <select v-model="activeFilter">
          <option value="All">All</option>
          <option value="Modify">Modify</option>
          <option value="New">New</option>
          <option value="Cancel">Cancel</option>
        </select>
      </div>
    </div>
    


    <div class="summary-cards">
      <div class="card">
        <h2>Total Revenue</h2>
        <p>Rp.{{ totalRevenue.toLocaleString() }}</p>
      </div>
      <div class="card">
        <h2>Previous Revenue</h2>
        <p>Rp.{{ totalPreviousRevenue.toLocaleString() }}</p>
      </div>

     <div class="card">
        <h2>Net Revenue Change</h2>
        <p :class="{ 'positive': netRevenueChange > 0, 'negative': netRevenueChange < 0 }">
          Rp.{{ netRevenueChange.toLocaleString() }}
        </p>
      </div>

      <div class="card">
        <h2>New Customers</h2>
        <p>{{ newCustomerCount }}</p>
      </div>

      <div class="card">
        <h2>Modified Orders</h2>
        <p>{{ modifiedCustomerCount }}</p>
      </div>

      <div class="card">
        <h2>Canceled Orders</h2>
        <p>{{ canceledCustomerCount }}</p>
      </div>
    </div>

    <div class="charts-wrapper">
      <div class="chart-container">
        <h3>Revenue by Customer</h3>
        <RevenueBarChart :chart-data="revenueChartData" />
      </div>
      <div class="chart-container">
        <h3>Order Status Breakdown</h3>
        <StatusPieChart :chart-data="pieChartData" />
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Customer Name</th>
          <th>Status</th>
          <th>Current Revenue</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="customer in filteredData" :key="customer.id">
          <td>{{ customer.customerName }}</td>
          <td>{{ customer.status }}</td>
          <td>${{ customer.currentRevenue.toLocaleString() }}</td>
        </tr>
      </tbody>
    </table>
  </main>
</template>

<style scoped>
* {
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  text-decoration: none;
}

.upload-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  position: relative;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.upload-zone.is-dragging {
  border-color: #41B883;
  background-color: #f0fdf4;
}
.upload-zone p {
  margin: 0;
  color: #555;
}
.upload-zone p span {
  color: #41B883;
  font-weight: bold;
  cursor: pointer;
}
.upload-zone input[type="file"] {
  /* This hides the default button but keeps it functional */
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.charts-wrapper {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.chart-container h3 {
  text-align: center;
  margin-bottom: 15px;
  font-weight: 600;
}

.chart-container {
  height: 400px; /* Give the chart some vertical space */
  margin-bottom: 40px;
}

.filter-buttons {
  margin-bottom: 20px;
}
.filter-buttons button {
  padding: 8px 16px;
  margin-right: 10px;
  border: 1px solid #ccc;
  background-color: white;
  cursor: pointer;
  border-radius: 4px;
}
.filter-buttons button.active {
  background-color: #41B883;
  color: white;
  border-color: #41B883;
}

/* 4. Add styles for the summary cards */
.summary-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}
.card {
  flex: 1;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  background-color: #f9f9f9;
}
.card h2 {
  margin-top: 0;
  font-size: 1rem;
  color: #555;
}
.card p {
  margin-bottom: 0;
  font-size: 2rem;
  font-weight: bold;
}

.positive {
  color: #28a745; /* green */
}
.negative {
  color: #dc3545; /* red */
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
</style>