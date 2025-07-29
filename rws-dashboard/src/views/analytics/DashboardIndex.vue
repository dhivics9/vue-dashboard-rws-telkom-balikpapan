<script setup>
import { useDataStore } from '@/stores/dataStore';
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import KPICard from '../../components/KPICard.vue';
import RevenueLineChart from '../../components/RevenueLineChart.vue';
import RevenueBarChart from '../../components/RevenueBarChart.vue';

const store = useDataStore();
const router = useRouter();

const trendChartData = computed(() => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = Array(12).fill(0);
    store.homepageSummary.trend.forEach(item => {
        const monthIndex = parseInt(item.month, 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
            data[monthIndex] = parseFloat(item.monthly_revenue);
        }
    });
    return {
        labels,
        datasets: [{
            label: 'Monthly Revenue',
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.1)',
            data,
            fill: true,
            tension: 0.4
        }]
    };
});

const topRegionalChartData = computed(() => {
    const data = store.homepageSummary.topRegionals;
    return {
        labels: data.map(r => r.regional),
        datasets: [{
            label: 'YTD Revenue',
            backgroundColor: '#3498db',
            data: data.map(r => parseFloat(r.total_revenue))
        }]
    };
});

onMounted(() => {
  store.fetchHomepageSummary();
});
</script>

<template>
  <main>
    <h1 class="page-title">Executive Summary</h1>

    <div v-if="store.isHomepageLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading summary...</p>
    </div>

    <div v-else>
      <div class="summary-cards">
        <KPICard title="Total Revenue (YTD)" :value="store.homepageSummary.kpi.totalRevenue" icon="trending_up" />
        <KPICard title="Total Target (YTD)" :value="store.homepageSummary.kpi.totalTarget" icon="flag" />
        <KPICard title="Overall Achievement (YTD)" :value="store.homepageSummary.kpi.achievement" icon="military_tech" format="percent" />
        <KPICard title="Active Customers" :value="store.homepageSummary.kpi.activeCustomers" icon="groups" format="integer" />
      </div>

      <div class="chart-container line-chart">
        <h3>Revenue Trend (This Year)</h3>
        <RevenueLineChart :chart-data="trendChartData" />
      </div>

      <div class="charts-wrapper">
        <div class="chart-container">
          <h3>Top 5 Regionals (YTD Revenue)</h3>
          <RevenueBarChart :chart-data="topRegionalChartData" />
        </div>
        <div class="card recent-documents">
          <h3>Recent Documents</h3>
          <ul>
            <li v-for="doc in store.homepageSummary.recentDocuments" :key="doc.id">
              <a @click="router.push(`/submission/${doc.id}`)">
                <span class="material-icons">description</span>
                <div class="doc-info">
                  <span class="doc-name">{{ doc.file_name }}</span>
                  <span class="doc-date">{{ new Date(doc.upload_timestamp).toLocaleDateString() }}</span>
                </div>
              </a>
            </li>
          </ul>
           <div v-if="!store.homepageSummary.recentDocuments || !store.homepageSummary.recentDocuments.length" class="empty-state-small">
              No recent documents.
           </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.recent-documents {
  flex: 1;
}
.recent-documents h3 {
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}
.recent-documents ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.recent-documents li a {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0.5rem;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}
.recent-documents li a:hover {
  background-color: var(--color-background);
}
.recent-documents .material-icons {
  color: var(--color-text-secondary);
}
.doc-info {
  display: flex;
  flex-direction: column;
}
.doc-name {
  font-weight: 500;
  color: var(--color-text-primary);
}
.doc-date {
  font-size: 0.8rem;
  color: var(--color-text-light);
}
.empty-state-small {
    text-align: center;
    padding: 2rem;
    color: var(--color-text-light);
}
</style>
