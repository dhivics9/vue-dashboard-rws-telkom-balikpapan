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
      path: '/table',
      name: 'table',
      component: () => import('../views/analytics/TableView.vue')
    },
    // Nested route submission
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
    {
      path: '/report',
      name: 'report',
      component: () => import('../views/analytics/RegionalReportView.vue')
    },
      ]
    }
  ]
})

export default router