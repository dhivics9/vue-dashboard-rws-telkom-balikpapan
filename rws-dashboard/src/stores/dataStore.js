// stores/dataStore.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useDataStore = defineStore('data', () => {
  // --- STATE ---
  const tableData = ref([]);
  const homepageSummary = ref({
    kpi: { totalRevenue: 0, totalTarget: 0, achievement: 0, activeCustomers: 0 },
    trend: [],
    topRegionals: [],
    recentDocuments: []
  });
  const filterOptions = ref({
      regionals: ['All Regionals'],
      witels: ['All Witels'],
      years: ['All Years']
  });
  const selectedRegional = ref('All Regionals');
  const selectedWitel = ref('All Witels');
  const selectedYear = ref('All Years');
  const selectedMonthNumber = ref('All');
  const statusFilter = ref('All');

  // State UI
  const isLoading = ref(false);
  const isHomepageLoading = ref(false);
  const isUploadingTarget = ref(false);
  const isApiSyncing = ref(false);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const isUploading = ref(false);

  // --- ACTIONS ---
  async function uploadAllFiles(files) {
    isUploading.value = true;
    const formData = new FormData();
    // Lampirkan setiap file ke FormData
    Object.keys(files).forEach(key => {
        if (files[key]) {
            formData.append(key, files[key]);
        }
    });

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/upload/all`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Upload gagal.');
      }
      
      alert('Upload semua file berhasil! Memuat ulang data...');
      await fetchDashboardData();
      await fetchHomepageSummary();

    } catch (error) {
      console.error("Error during multi-file upload:", error);
      alert(`Upload gagal: ${error.message}`);
    } finally {
      isUploading.value = false;
    }
  }
  
  async function uploadTargetFile(targetFile) {
    if (!targetFile) return;
    isUploadingTarget.value = true;

    const formData = new FormData();
    formData.append('targetFile', targetFile);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/targets/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Upload file target gagal.');
      }
      
      alert('Upload file target berhasil!');
      await fetchDashboardData();
      await fetchHomepageSummary();

    } catch (error) {
      console.error("Error during target upload:", error);
      alert(`Upload gagal: ${error.message}`);
    } finally {
      isUploadingTarget.value = false;
    }
  }

  async function triggerApiSync() {
    isApiSyncing.value = true;
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/sync/trigger-api-sync`, {
        method: 'POST',
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal memicu sinkronisasi.');
      }
      
      alert('Sinkronisasi data API berhasil! Memuat ulang data dashboard...');
      await fetchDashboardData();
      await fetchHomepageSummary();

    } catch (error) {
      console.error("Error during manual API sync trigger:", error);
      alert(`Gagal memicu sinkronisasi: ${error.message}`);
    } finally {
      isApiSyncing.value = false;
    }
  }

  async function fetchDashboardData() {
    isLoading.value = true;
    console.log('🔍 Fetching dashboard data...');
    try {
        const params = new URLSearchParams();
        
        // Hanya tambahkan parameter jika bukan "All"
        if (selectedRegional.value && selectedRegional.value !== 'All Regionals') {
            params.append('regional', selectedRegional.value);
        }
        if (selectedWitel.value && selectedWitel.value !== 'All Witels') {
            params.append('witel', selectedWitel.value);
        }
        if (selectedYear.value && selectedYear.value !== 'All Years') {
            params.append('year', selectedYear.value);
        }
        if (selectedMonthNumber.value && selectedMonthNumber.value !== 'All') {
            params.append('month', selectedMonthNumber.value);
        }
        if (statusFilter.value && statusFilter.value !== 'All') {
            params.append('status', statusFilter.value);
        }
        
        // Selalu tambahkan page dan limit
        params.append('page', currentPage.value);
        params.append('limit', itemsPerPage.value);
        
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
        const url = `${apiBaseUrl}/api/analytics/data?${params.toString()}`;
        console.log('📡 API URL:', url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch dashboard data');
        
        const data = await response.json();
        console.log('📊 Received data:', data);
        
        tableData.value = data.tableData || [];
        filterOptions.value = data.filterOptions || {};
        
        console.log('✅ Data loaded:', tableData.value.length, 'records');

    } catch (error) {
        console.error("❌ Error fetching dashboard data:", error);
        tableData.value = [];
    } finally {
        isLoading.value = false;
    }
  }

  async function fetchHomepageSummary() {
    isHomepageLoading.value = true;
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/analytics/summary`);
      if (!response.ok) throw new Error('Failed to fetch homepage summary');
      homepageSummary.value = await response.json();
    } catch (error) {
      console.error("Error fetching homepage summary:", error);
    } finally {
      isHomepageLoading.value = false;
    }
  }

  watch(
    [selectedRegional, selectedWitel, selectedYear, selectedMonthNumber, statusFilter],
    () => {
      currentPage.value = 1; 
      fetchDashboardData();
    }
  );

  // --- GETTERS ---
  const regionalList = computed(() => filterOptions.value.regionals || ['All Regionals']);
  const witelList = computed(() => filterOptions.value.witels || ['All Witels']);
  const lccdList = computed(() => filterOptions.value.lccds || ['All LCCDs']);
  const streamList = computed(() => filterOptions.value.streams || ['All Streams']);
  const customerTypeList = computed(() => filterOptions.value.customerTypes || ['All Customer Types']);
  const yearList = computed(() => filterOptions.value.years || ['All Years']);
  const monthNumberList = computed(() => [
      { value: 'All', label: 'All Months' },
      { value: '01', label: 'January' }, { value: '02', label: 'February' },
      { value: '03', label: 'March' }, { value: '04', label: 'April' },
      { value: '05', label: 'May' }, { value: '06', label: 'June' },
      { value: '07', label: 'July' }, { value: '08', label: 'August' },
      { value: '09', label: 'September' }, { value: '10', label: 'October' },
      { value: '11', label: 'November' }, { value: '12', label: 'December' }
  ]);
  
  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return tableData.value.slice(start, end);
  });
  
  const totalPages = computed(() => {
      if (tableData.value.length === 0) return 1;
      return Math.ceil(tableData.value.length / itemsPerPage.value);
  });

const revenueChartData = computed(() => {
    const customerRevenueMap = new Map();
    tableData.value.forEach(item => {
        const revenue = parseFloat(item.revenue) || 0;
        const name = item.customer_name || 'Unknown';
        customerRevenueMap.set(name, (customerRevenueMap.get(name) || 0) + revenue);
    });
    const sortedCustomers = [...customerRevenueMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    return {
        labels: sortedCustomers.map(c => c[0]),
        datasets: [{ label: 'Revenue', backgroundColor: '#41B883', data: sortedCustomers.map(c => c[1]) }]
    };
  });
  
  const pieChartData = computed(() => {
    const statusCounts = { New: 0, Modify: 0, Cancel: 0 };
    tableData.value.forEach(item => {
        if (item.rev_type in statusCounts) {
            statusCounts[item.rev_type]++;
        }
    });
    return {
        labels: Object.keys(statusCounts),
        datasets: [{ backgroundColor: ['#41B883', '#E46651', '#00D8FF'], data: Object.values(statusCounts) }]
    };
  });

  const revenueLineChartData = computed(() => {
    const periodRevenueMap = new Map();
    tableData.value.forEach(item => {
        const revenue = parseFloat(item.revenue) || 0;
        const periode = item.periode || 'Unknown';
        periodRevenueMap.set(periode, (periodRevenueMap.get(periode) || 0) + revenue);
    });
    const sortedPeriods = [...periodRevenueMap.entries()].sort((a, b) => a[0] - b[0]);
    const formatPeriode = (p) => {
        const pStr = p.toString();
        if (pStr.length < 6) return pStr;
        const year = pStr.substring(0, 4);
        const month = pStr.substring(4, 6);
        return `${month}/${year}`;
    };
    return {
        labels: sortedPeriods.map(p => formatPeriode(p[0])),
        datasets: [{
            label: 'Total Revenue',
            backgroundColor: 'rgba(65, 184, 131, 0.2)',
            borderColor: '#41B883',
            data: sortedPeriods.map(p => p[1]),
            fill: true,
            tension: 0.3
        }]
    };
  });

  
  return {
    // State
    tableData, homepageSummary, filterOptions,
    selectedRegional, selectedWitel, selectedYear, selectedMonthNumber, statusFilter,
    isLoading, isHomepageLoading, currentPage, itemsPerPage,
    isUploadingTarget, isApiSyncing, isUploading,
    
    // Getters
    regionalList, witelList, lccdList, streamList, customerTypeList,
    yearList, monthNumberList,
    paginatedData, totalPages, revenueChartData, pieChartData, revenueLineChartData,
    
    // Actions
    fetchDashboardData,
    fetchHomepageSummary,
    uploadTargetFile,
    triggerApiSync,
    uploadAllFiles,
  };
});
