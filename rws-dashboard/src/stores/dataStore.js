// stores/dataStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as XLSX from 'xlsx';

export const useDataStore = defineStore('data', () => {
  // --- STATE --- (All data variables)
  const dashboardData = ref([]);
  const filterOptions = ref({ regionals: [], witels: [], periodes: [], rev_types: [] });
  const selectedRegional = ref('All Regionals');
  const selectedWitel = ref('All Witels');
  const selectedMonth = ref('All Months');
  const selectedYear = ref('All Years');
  const selectedMonthNumber = ref('All');
  const statusFilter = ref('All');
  const isLoading = ref(false);
  const itemsPerPage = ref(5);
  const currentPage = ref(1);
  const isDragging = ref(false);

  // --- GETTERS --- 
  const regionalList = computed(() => {
    if (!dashboardData.value.length) return ['All Regionals'];

    const allRegionals = dashboardData.value
      .filter(c => c.Regional)
      .map(c => c.Regional);

    const uniqueRegionals = [...new Set(allRegionals)];
    return ['All Regionals', ...uniqueRegionals.sort()];
  });

  const witelList = computed(() => {
    if (!dashboardData.value.length) return ['All Witels'];

    const allWitels = dashboardData.value
      .filter(c => c.Witel)
      .map(c => c.Witel);

    const uniqueWitels = [...new Set(allWitels)];
    return ['All Witels', ...uniqueWitels.sort()];
  });

  const monthList = computed(() => {
    if (!dashboardData.value.length) return ['All Months'];
    const allMonths = dashboardData.value
      .map(c => c.Periode?.toString())
      .filter(Boolean);
    const uniqueMonths = [...new Set(allMonths)];
    return ['All Months', ...uniqueMonths.sort().reverse()];
  });

  const yearList = computed(() => {
    if (!dashboardData.value.length) return ['All Years'];
    
    const years = dashboardData.value
      .map(c => {
        const periodeStr = c.Periode?.toString();
        if (periodeStr && periodeStr.length >= 4) {
          return periodeStr.substring(0, 4); // Extract year (first 4 digits)
        }
        return null;
      })
      .filter(Boolean);
    
    const uniqueYears = [...new Set(years)];
    return ['All Years', ...uniqueYears.sort().reverse()];
  });

  const monthNumberList = computed(() => {
    return [
      { value: 'All', label: 'All Months' },
      { value: '01', label: 'January' },
      { value: '02', label: 'February' },
      { value: '03', label: 'March' },
      { value: '04', label: 'April' },
      { value: '05', label: 'May' },
      { value: '06', label: 'June' },
      { value: '07', label: 'July' },
      { value: '08', label: 'August' },
      { value: '09', label: 'September' },
      { value: '10', label: 'October' },
      { value: '11', label: 'November' },
      { value: '12', label: 'December' }
    ];
  });

  const filteredData = computed(() => {
    let dataToFilter = [...dashboardData.value];

    // 1. Filter based on Regional
    if (selectedRegional.value !== 'All Regionals') {
      dataToFilter = dataToFilter.filter(c => c.Regional === selectedRegional.value);
    }

    // 2. Filter based on Status (Rev_Type)
    if (statusFilter.value !== 'All') {
      dataToFilter = dataToFilter.filter(c => c.Rev_Type === statusFilter.value);
    }

    // 3. Filter based on Year (first 4 digits of Periode)
    if (selectedYear.value !== 'All Years') {
      dataToFilter = dataToFilter.filter(c => {
        const periodeStr = c.Periode?.toString();
        if (periodeStr && periodeStr.length >= 4) {
          const year = periodeStr.substring(0, 4);
          return year === selectedYear.value;
        }
        return false;
      });
    }

    // Filter based on Month (last 2 digits of Periode)
    if (selectedMonthNumber.value !== 'All') {
      dataToFilter = dataToFilter.filter(c => {
        const periodeStr = c.Periode?.toString();
        if (periodeStr && periodeStr.length >= 6) {
          const month = periodeStr.substring(4, 6);
          return month === selectedMonthNumber.value;
        }
        return false;
      });
    }

    // Filter based on Witel
    if (selectedWitel.value !== 'All Witels') {
      dataToFilter = dataToFilter.filter(c => c.Witel === selectedWitel.value);
    }

    currentPage.value = 1; // Reset to page 1 when filter changes
    return dataToFilter;
  });

  const totalRevenue = computed(() => {
    return filteredData.value.reduce((total, customer) => {
      const revenueValue = parseFloat(customer.Revenue || 0);
      return total + revenueValue;
    }, 0);
  });

  const newCustomerCount = computed(() => {
    return filteredData.value.filter(customer => customer.Rev_Type === 'New').length;
  });

  const modifiedCustomerCount = computed(() => {
    return filteredData.value.filter(customer => customer.Rev_Type === 'Modify').length;
  });

  const canceledCustomerCount = computed(() => {
    return filteredData.value.filter(customer => customer.Rev_Type === 'Cancel').length;
  });

  const totalPages = computed(() => {
    return Math.ceil(filteredData.value.length / itemsPerPage.value);
  });

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredData.value.slice(start, end);
  });

  // --- ACTIONS ---
  function refreshData() {
    dashboardData.value = [];
    isLoading.value = false;
  }

  function processFile(file) {
    if (!file) return;

    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();

    isLoading.value = true;

    const reader = new FileReader();

    if (fileExtension === 'json'){
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const jsonData = JSON.parse(text);
          dashboardData.value = jsonData;
          console.log(`Data successfully read: ${dashboardData.value.length} records`);
          console.log("JSON data loaded successfully:", dashboardData.value.slice(0, 3));
          
          // Update filter options based on loaded data
          updateFilterOptions();
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
          dashboardData.value = jsonData;
          console.log(`Data successfully read: ${dashboardData.value.length} records`);
          console.log("Excel data loaded successfully:", dashboardData.value.slice(0, 3));
          
          // Update filter options based on loaded data
          updateFilterOptions();
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
  }

  function updateFilterOptions() {
    // Extract unique values for each filter from the data
    const regionals = [...new Set(dashboardData.value.map(item => item.Regional).filter(Boolean))];
    const witels = [...new Set(dashboardData.value.map(item => item.Witel).filter(Boolean))];
    const periodes = [...new Set(dashboardData.value.map(item => item.Periode?.toString()).filter(Boolean))];
    const rev_types = [...new Set(dashboardData.value.map(item => item.Rev_Type).filter(Boolean))];
    
    filterOptions.value = {
      regionals: ['All Regionals', ...regionals.sort()],
      witels: ['All Witels', ...witels.sort()],
      periodes: ['All Months', ...periodes.sort().reverse()],
      rev_types: ['All', ...rev_types.sort()]
    };
  }

  function nextPage() {
    if (currentPage.value < totalPages.value) currentPage.value++;
  }

  function prevPage() {
    if (currentPage.value > 1) currentPage.value--;
  }

  function setDragging(value) {
    isDragging.value = value;
  }

  // Add a utility function to format the periode for display
  function formatPeriode(periode) {
    if (!periode) return '';
    
    const periodeStr = periode.toString();
    if (periodeStr.length < 6) return periodeStr;
    
    const year = periodeStr.substring(0, 4);
    const month = periodeStr.substring(4, 6);
    
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${monthNames[monthIndex]} ${year}`;
    }
    
    return `${month}/${year}`;
  }

  // --- UPDATED CHART DATA PROPERTIES ---
  const revenueChartData = computed(() => {
    // If no data, return empty chart structure
    if (!filteredData.value.length) {
      return {
        labels: [],
        datasets: [{ 
          label: 'Revenue', 
          backgroundColor: '#41B883',
          data: [] 
        }]
      };
    }
    
    // group by customer and sum revenue
    const customerRevenueMap = new Map();
    
    filteredData.value.forEach(customer => {
      const customerName = customer.Customer_Name || 'Unknown';
      const revenue = parseFloat(customer.Revenue || 0);
      
      if (customerRevenueMap.has(customerName)) {
        customerRevenueMap.set(customerName, customerRevenueMap.get(customerName) + revenue);
      } else {
        customerRevenueMap.set(customerName, revenue);
      }
    });
    
    // Convert map to array of objects for sorting
    const customerRevenueArray = Array.from(customerRevenueMap, ([name, revenue]) => ({ name, revenue }));
    
    // Sort by revenue (highest to lowest)
    customerRevenueArray.sort((a, b) => b.revenue - a.revenue);
    
    const topCustomers = customerRevenueArray.slice(0, 8);
    
    // Truncate long customer names for better display
    const labels = topCustomers.map(item => {
      const name = item.name;
      return name.length > 20 ? name.substring(0, 18) + '...' : name;
    });
    
    return {
      labels: labels,
      datasets: [
        {
          label: 'Revenue',
          backgroundColor: '#41B883', // Vue green color
          data: topCustomers.map(item => item.revenue)
        }
      ]
    };
  });

  const pieChartData = computed(() => {
    // If no data, return empty chart structure
    if (!filteredData.value.length) {
      return {
        labels: ['New', 'Modify', 'Cancel'],
        datasets: [{ 
          backgroundColor: ['#41B883', '#E46651', '#00D8FF'],
          data: [0, 0, 0] 
        }]
      };
    }
    
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

  const revenueLineChartData = computed(() => {
    // If no data, return empty chart structure
    if (!filteredData.value.length) {
      return {
        labels: [],
        datasets: [{ 
          label: 'Total Revenue',
          backgroundColor: 'rgba(65, 184, 131, 0.2)',
          borderColor: '#41B883',
          data: [],
          fill: true
        }]
      };
    }
    
    // Group data by period for the line chart
    // Create a map to aggregate revenue by period
    const periodRevenueMap = new Map();
    
    filteredData.value.forEach(customer => {
      const periodeStr = customer.Periode?.toString() || 'Unknown';
      const revenue = parseFloat(customer.Revenue || 0);
      
      if (periodRevenueMap.has(periodeStr)) {
        periodRevenueMap.set(periodeStr, periodRevenueMap.get(periodeStr) + revenue);
      } else {
        periodRevenueMap.set(periodeStr, revenue);
      }
    });
    
    // Convert map to arrays and sort by period
    const periods = Array.from(periodRevenueMap.keys()).sort();
    const revenues = periods.map(period => periodRevenueMap.get(period));
    
    // Format periods for display
    const formattedPeriods = periods.map(period => formatPeriode(period));
    
    return {
      labels: formattedPeriods,
      datasets: [
        {
          label: 'Total Revenue',
          backgroundColor: 'rgba(65, 184, 131, 0.2)',
          borderColor: '#41B883',
          data: revenues,
          fill: true
        }
      ]
    };
  });

  // Return everything that should be accessible by other components
  return {
    // State
    dashboardData, 
    filterOptions, 
    selectedRegional, 
    selectedWitel, 
    selectedMonth,
    selectedYear,
    selectedMonthNumber,
    statusFilter, 
    isLoading, 
    itemsPerPage, 
    currentPage,
    isDragging,
    
    // Getters
    regionalList,
    witelList,
    monthList,
    yearList,
    monthNumberList,
    filteredData,
    totalRevenue, 
    newCustomerCount,
    modifiedCustomerCount,
    canceledCustomerCount, 
    totalPages, 
    paginatedData,
    revenueChartData,
    pieChartData,
    revenueLineChartData,
    
    // Actions
    refreshData,
    processFile,
    nextPage, 
    prevPage,
    setDragging,
    
    // Utils
    formatPeriode
  };
});