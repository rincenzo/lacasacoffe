import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore, HOME_BY_ROLE } from '../stores/auth'
const routes = [
  { path: '/', redirect: '/katalog' },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { guest: true } },
  { path: '/pemilik', component: () => import('../views/OwnerDashboardView.vue'), meta: { roles: ['pemilik'] } },
  { path: '/produk', component: () => import('../views/ProductManageView.vue'), meta: { roles: ['pemilik'] } },
  { path: '/karyawan', component: () => import('../views/CashierManageView.vue'), meta: { roles: ['pemilik'] } },
  { path: '/akun', component: () => import('../views/OwnerAccountView.vue'), meta: { roles: ['pemilik'] } },
  { path: '/kasir', component: () => import('../views/CashierView.vue'), meta: { roles: ['kasir'] } },
  { path: '/pesanan', component: () => import('../views/OrdersView.vue'), meta: { roles: ['kasir', 'pemilik'] } },
  { path: '/katalog', component: () => import('../views/CatalogView.vue'), meta: { public: true } },
  { path: '/status', component: () => import('../views/TrackOrderView.vue'), meta: { public: true } },
  { path: '/akun-pelanggan', component: () => import('../views/CustomerAccountView.vue'), meta: { public: true, customerAccount: true } },
  { path: '/:pathMatch(.*)*', redirect: '/katalog' }
]
const router = createRouter({ history: createWebHashHistory(), routes })
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.customerAccount && auth.role !== 'pelanggan') {
    if (auth.isLoggedIn) return HOME_BY_ROLE[auth.role]
    return { path: '/login', query: { role: 'pelanggan' } }
  }
  if (to.meta.public) return true
  if (to.meta.guest) return auth.isLoggedIn ? HOME_BY_ROLE[auth.role] : true
  if (!auth.isLoggedIn) return '/login'
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return HOME_BY_ROLE[auth.role]
  return true
})
export default router
