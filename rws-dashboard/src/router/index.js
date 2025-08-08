// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/analytics/DashboardIndex.vue')
    },
    {
      path: '/analytics',
      component: () => import('../views/analytics/AnalyticsIndex.vue'),
      children: [
        {
          path: 'table',
          name: 'analytics-table',
          component: () => import('../views/analytics/TableView.vue')
        },
        {
          path: 'regional-report',
          name: 'analytics-regional-report',
          component: () => import('../views/analytics/RegionalReportView.vue')
        },
        {
          path: '/analytics/product-summary',
          name: 'analytics-product-summary',
          component: () => import('../views/analytics/ProductSummaryView.vue')
        },
      ]
    },
    {
      path: '/submission',
      name: 'submission',
      component: () => import('../views/submission/SubmissionIndex.vue'),
      children: [
        {
      path: '', 
      name: 'submission-list',
      component: () => import('../views/submission/SubmissionListView.vue')
    },
    {
      path: 'new',
      name: 'submission-new',
      component: () => import('../views/submission/NewSubmissionView.vue')
    },
    {
      path: ':id',
      name: 'submission-detail',
      component: () => import('../views/submission/DocumentDetailView.vue')
    },
      ]
    },
    {
      path: '/tools/json-converter',
      name: 'json-converter',
      component: () => import('../views/tools/JsonConverterView.vue')
    },
    {
      path: '/tools/api-explorer',
      name: 'api-explorer',
      component: () => import('../views/tools/ApiExplorerView.vue')
    },
    {
      path: '/tools/sync-data',
      name: 'sync-data',
      component: () => import('../views/tools/SyncDataView.vue')
    },
    {
      path: '/tools/update-data',
      name: 'update-data',
      component: () => import('../views/tools/updateDataView.vue')
    }
  ]
})

export default router