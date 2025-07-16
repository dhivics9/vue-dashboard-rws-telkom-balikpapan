<script setup>
// Import necessary Vue features and components
import { ref, computed } from 'vue'; // 1. Import 'computed'
import { customers } from '../data/mock-data.js';
import * as XLSX from 'xlsx';
import RevenueBarChart from '../components/RevenueBarChart.vue';
import StatusPieChart from '../components/StatusPieChart.vue';


//Data handling variables
const customerData = ref([]);
const fileInput = ref(null);

//Filter variables
const selectedRegional = ref('All Regionals');
const selectedMonth = ref('All Months');
const statusFilter = ref('All');

//Website State variables
const isLoading = ref(false);
const isDragging = ref(false);
const itemsPerPage = ref(5);
const currentPage = ref(1);

//Filtering Logic
const regionalList = computed(() => {
  if (!customerData.value.length) return ['All Regionals'];

  const allRegionals = customerData.value
    .filter(c => c.regional) //
    .map(c => c.regional); //

  const uniqueRegionals = [...new Set(allRegionals)];
  return ['All Regionals', ...uniqueRegionals.sort()];
});

const monthList = computed(() => {
  if (!customerData.value.length) return ['All Months'];
  const allMonths = customerData.value.map(c => c.periode.toString()).filter(Boolean);
  const uniqueMonths = [...new Set(allMonths)];
  return ['All Months', ...uniqueMonths.sort().reverse()];
});

const filteredData = computed(() => {
  let dataToFilter = [...customerData.value];

  // 1. Filter based on Regional
  if (selectedRegional.value !== 'All Regionals') {
    dataToFilter = dataToFilter.filter(c => c.Regional === selectedRegional.value);
  }

  // 2. Filter based on Status (Rev_Type)
  if (statusFilter.value !== 'All') {
    dataToFilter = dataToFilter.filter(c => c.Rev_Type === statusFilter.value);
  }

  // 3. Filter based on Bulan (Periode)
  if (selectedMonth.value !== 'All Months') {
    dataToFilter = dataToFilter.filter(c => c.periode.toString() === selectedMonth.value);
  }

  currentPage.value = 1; // Reset to page 1
  return dataToFilter;
});

const refreshData = () => {
  customerData.value = [];
  
  if (fileInput.value) {
    fileInput.value.value = null;
  }
};

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredData.value.slice(start, end);
});

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / itemsPerPage.value);
});

const nextPage = () => {
  const totalPages = Math.ceil(filteredData.value.length / itemsPerPage.value);
  if (currentPage.value < totalPages) {
    currentPage.value++;
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

// 1. Initialize customerData with json/excel
const processFile = (file) => {
  if (!file) return;

  const fileName = file.name;
  const fileExtension = fileName.split('.').pop().toLowerCase();

  isLoading.value = true;

  const reader = new FileReader();

  if (fileExtension === 'json'){
    reader.onload = (e) => {
    try {
      const text = e.target.result;
      // console.log("Raw file content:", text.substring(0, 200)); // Log first 200 chars
      // console.log("File starts with:", text.charCodeAt(0)); // Check for BOM


      const jsonData = JSON.parse(text);
      customerData.value = jsonData; // Limit records for performance
      // Optionally log the data for debugging
      console.log(`Data successfully read : ${customerData.value.length} records`);
      console.log("Excel data loaded successfully:", customerData.value.slice(0, 10));
    } catch (error) {
      console.error("Error parsing JSON file:", error);
      console.error("Error details:", error.message);
      alert("The file is not a valid JSON file.");
    } finally {
      isLoading.value = false;
    }
  };

  reader.onerror = () => {
    console.error("Could not read the file.");
    alert("There was an error reading the file.");
    isLoading.value = false;
  };

  // Read the file as text instead of an ArrayBuffer
  reader.readAsText(file);
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        customerData.value = jsonData; // Limit records for performance
        // Optionally log the data for debugging
        console.log(`Data successfully read : ${customerData.value.length} records`);
        console.log("Excel data loaded successfully:", customerData.value.slice(0, 10));
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("The file is not a valid Excel file.");
      } finally {
        isLoading.value = false;
      }
    };

    reader.onerror = () => {
      console.error("Could not read the file.");
      alert("There was an error reading the file.");
      isLoading.value = false;
    };

    // Read the file as an ArrayBuffer
    reader.readAsArrayBuffer(file);
  } else {
    alert("Please upload a valid JSON or Excel file.");
    isLoading.value = false;
  }
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
  return filteredData.value.reduce((total, customer) => {
    const revenueValue = parseFloat(customer.Revenue || 0);
    return total + revenueValue;
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
        data: filteredData.value.map(customer => customer.currentRevenue)
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

    <div class="upload-section">
      <div class="refresh-upload">
        <button @click="refreshData">Refresh Data</button>
      </div>
      <div class="upload-zone" :class="{ 'is-dragging': isDragging }" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop">
        <input
          type="file"
          id="file-upload"
          ref="fileInput"
          accept=".json, .xlsx, .xls" @change="handleFileSelect"
        />
        <p>Drag & Drop your Excel file here, or <span>click to select</span>.</p>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-control">
        <label for="regional-filter">Filter by Regional</label>
        <select id="regional-filter" v-model="selectedRegional">
          <option v-for="regional in regionalList" :key="regional" :value="regional">
            {{ regional }}
          </option>
        </select>
      </div>

      <div class="filter-control">
        <label for="status-filter">Filter by Status</label>
        <select id="status-filter" v-model="statusFilter">
          <option value="All">All</option>
          <option value="New">New</option>
          <option value="Modify">Modify</option>
          <option value="Cancel">Cancel</option>
        </select>
      </div>

      <div class="filter-control">
        <label for="month-filter">Filter by Month</label>
        <select id="month-filter" v-model="selectedMonth">
          <option v-for="month in monthList" :key="month" :value="month">
            {{ month }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="summary-cards">
      <div class="card">
        <h2>Total Revenue</h2>
        <p>Rp.{{ totalRevenue.toLocaleString() }}</p>
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

    <div class="table-section">
      <table>
          <thead>
            <tr>
              <th>Periode</th>
              <th>Product Label</th>
              <th>Customer Name</th>
              <th>Product Name</th>
              <th>Product Group Name</th>
              <th>LCCD</th>
              <th>Regional</th>
              <th>Witel</th>
              <th>Rev Type</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in paginatedData" :key="customer.Cust_Order_Number">
              <td>{{ customer.Periode }}</td>
              <td>{{ customer.Product_Label }}</td>
              <td>{{ customer.Customer_Name }}</td>
              <td>{{ customer.Product_Name }}</td>
              <td>{{ customer.Product_Group_Name }}</td>
              <td>{{ customer.LCCD }}</td>
              <td>{{ customer.Regional }}</td>
              <td>{{ customer.Witel }}</td>
              <td>{{ customer.Rev_Type }}</td>
              <td>Rp.{{ (customer.Revenue || 0).toLocaleString() }}</td>
            </tr>
          </tbody>
      </table>
      <div class="pagination-controls">
        <button @click="prevPage" :disabled="currentPage === 1">Previous</button>
        <!-- computed property totalPages -->
        <div class="page-input-control">
          <span>Page</span>
          <input
            type="number"
            v-model.number="currentPage"
            min="1"
            :max="totalPages"
          />
          <span>of {{ totalPages }}</span>
        </div>
        <button @click="nextPage" :disabled="currentPage >= totalPages">Next</button>
      </div>
      </div>
  </main>
</template>

<style scoped src="./HomeView.css"></style>