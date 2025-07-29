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
          component: () => import('../views/analytics/RevenuePerformanceView.vue')
        }
      ]
    },
    {
      path: '/submission',
      name: 'submission',
      component: () => import('../views/Submission/SubmissionIndex.vue'),
      children: [
        {
      path: '', 
      name: 'submission-list',
      component: () => import('../views/Submission/SubmissionListView.vue')
    },
    {
      path: 'new',
      name: 'submission-new',
      component: () => import('../views/Submission/NewSubmissionView.vue')
    },
    {
      path: ':id',
      name: 'submission-detail',
      component: () => import('../views/Submission/DocumentDetailView.vue')
    },
      ]
    }
  ]
})

export default router