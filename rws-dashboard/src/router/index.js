// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import DashboardIndex from '../views/DashboardIndex.vue' // Import halaman baru
import TableView from '../views/TableView.vue'     // Import halaman baru

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../views/DashboardIndex.vue') // Halaman utama
    },

    {
      path: '/table',
      name: 'table',
      component: () => import('../views/TableView.vue') // Halaman tabel
    },
    // Nested route submission
    {
      path: '/submission',
      name: 'submission',
      component: () => import('../views/Submission/SubmissionIndex.vue'), // Halaman submission
      children: [
        {
      // Halaman list dokumen '/submission'
      path: '', 
      name: 'submission-list',
      component: () => import('../views/Submission/SubmissionListView.vue')
    },
    {
      // Halaman form upload dokumen '/submission/new'
      path: 'new',
      name: 'submission-new',
      component: () => import('../views/Submission/NewSubmissionView.vue')
    },
    {
      // Halaman detail dokumen '/submission/:id'
      path: ':id',
      name: 'submission-detail',
      component: () => import('../views/Submission/DocumentDetailView.vue')
    },
      ]
    }
  ]
})

export default router