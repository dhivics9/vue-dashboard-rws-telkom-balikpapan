// stores/dataStore.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';

export const useDataStore = defineStore('data', () => {
  const tableData = ref([]);
  const summaryCards = ref({ totalRevenue: 0 });
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
  const isLoading = ref(false);
  const isUploading = ref(false);
  const currentPage = ref(1);
  const itemsPerPage = ref(10);
  const isDragging = ref(false);
  const isSyncing = ref(false);
  const syncStatus = ref('');

  const homepageSummary = ref({
    kpi: { totalRevenue: 0, totalTarget: 0, achievement: 0, activeCustomers: 0 },
    trend: [],
    topRegionals: [],
    recentDocuments: []
  });
  const isHomepageLoading = ref(false);

  async function startSyncProcess(targetFile) {
    if (!targetFile) return;
    isSyncing.value = true;
    syncStatus.value = 'Memulai proses sinkronisasi...\n';

    const formData = new FormData();
    formData.append('targetFile', targetFile);

    try {
      syncStatus.value += 'Mengirim permintaan ke server...\n';
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/sync/start`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Sinkronisasi gagal.');
      }
      
      syncStatus.value += `SUKSES: ${result.message}\nMemuat ulang data dashboard...`;
      alert('Sinkronisasi berhasil!');
      await fetchDashboardData();
      await fetchHomepageSummary();

    } catch (error) {
      console.error("Error during sync process:", error);
      syncStatus.value += `ERROR: ${error.message}`;
      alert(`Sinkronisasi gagal: ${error.message}`);
    } finally {
      isSyncing.value = false;
    }
  }


  async function fetchDashboardData() {
    isLoading.value = true;
    try {
      const params = new URLSearchParams({
        regional: selectedRegional.value,
        witel: selectedWitel.value,
        year: selectedYear.value,
        month: selectedMonthNumber.value,
        status: statusFilter.value,
      });
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/analytics/data?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      tableData.value = data.tableData;
      summaryCards.value = data.summary;
      
      if (filterOptions.value.regionals.length <= 1 && data.filterOptions.regionals.length > 1) {
        filterOptions.value = data.filterOptions;
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      tableData.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  async function uploadAnalyticsFile(file) {
    if (!file) return;
    isUploading.value = true;
    const formData = new FormData();
    formData.append('analyticsFile', file);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${apiBaseUrl}/api/analytics/upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Upload failed');
      alert('Upload successful! Fetching new data...');
      await fetchDashboardData();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      isUploading.value = false;
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

  const regionalList = computed(() => filterOptions.value.regionals);
  const witelList = computed(() => filterOptions.value.witels);
  const yearList = computed(() => filterOptions.value.years);
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

  function setDragging(value) {
    isDragging.value = value;
  }

  return {
    // State
    tableData, summaryCards, filterOptions,
    selectedRegional, selectedWitel, selectedYear, selectedMonthNumber, statusFilter,
    isLoading, isUploading, currentPage, itemsPerPage, isDragging,
    homepageSummary, isHomepageLoading, isSyncing, syncStatus,
    
    // Getters
    regionalList, witelList, yearList, monthNumberList,
    paginatedData, totalPages, revenueChartData, pieChartData, revenueLineChartData,
    
    // Actions
    fetchDashboardData, uploadAnalyticsFile, setDragging, fetchHomepageSummary, startSyncProcess,
  };
});
