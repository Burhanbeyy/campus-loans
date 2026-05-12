import { createRouter, createWebHistory } from 'vue-router';
import { isAuthenticated } from '@/stores/useAuth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/devices',
      name: 'Devices',
      component: () => import('@/views/DevicesView.vue'),
    },
    {
      path: '/loans',
      name: 'Loans',
      component: () => import('@/views/LoansView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'History',
      component: () => import('@/views/HistoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
});

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ path: '/login', query: { returnTo: to.fullPath } });
  } else {
    next();
  }
});

export default router;
