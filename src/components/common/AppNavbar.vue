<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import BaseButton from './BaseButton.vue'
const auth = useAuthStore(); const router = useRouter()
const MENU = [
  { to: '/pemilik', label: 'Dashboard', roles: ['pemilik'] },
  { to: '/produk', label: 'Kelola Produk', roles: ['pemilik'] },
  { to: '/karyawan', label: 'Kelola Kasir', roles: ['pemilik'] },
  { to: '/akun', label: 'Keamanan Akun', roles: ['pemilik'] },
  { to: '/kasir', label: 'Transaksi', roles: ['kasir'] },
  { to: '/pesanan', label: 'Pesanan', roles: ['kasir', 'pemilik'] },
  { to: '/katalog', label: 'Katalog', roles: ['pelanggan'] },
  { to: '/status', label: 'Cek Pesanan', roles: ['pelanggan'] }
]
const links = computed(() => MENU.filter(m => m.roles.includes(auth.role)))
const accountRoute = computed(() => auth.role === 'pelanggan'
  ? '/akun-pelanggan'
  : { path: '/login', query: { role: 'pelanggan' } })
function onLogout() {
  const destination = auth.role === 'pelanggan' ? '/akun-pelanggan' : '/login'
  auth.logout()
  router.push(destination)
}
</script>
<template>
  <aside v-if="auth.isLoggedIn || $route.meta.public" class="side">
    <div class="brand"><span class="logo">LC</span><div><strong>La Casa</strong><small>Coffee & Space</small></div></div>
      <nav v-if="$route.meta.public">
        <RouterLink to="/katalog">Katalog</RouterLink>
        <RouterLink to="/status">Cek Pesanan</RouterLink>
        <RouterLink :to="accountRoute">{{ auth.role === 'pelanggan' ? 'Akun Saya' : 'Akun' }}</RouterLink>
      </nav>
      <nav v-else-if="auth.isLoggedIn"><RouterLink v-for="l in links" :key="l.to" :to="l.to">{{ l.label }}</RouterLink></nav>
      <div v-if="auth.isLoggedIn && (!$route.meta.public || auth.role === 'pelanggan')" class="user"><div class="who"><strong>{{ auth.session.name }}</strong><small>{{ auth.role }}</small></div>
      <BaseButton variant="ghost" @click="onLogout">Keluar</BaseButton></div>
  </aside>
</template>
<style scoped>
.side{background:radial-gradient(ellipse at 0% 0%,#ffffff13,transparent 40%),linear-gradient(165deg,#234b3f 0%,#18372f 100%);color:#fff;padding:26px 17px;display:flex;flex-direction:column;gap:34px;position:sticky;top:0;height:100vh;box-shadow:8px 0 30px #152b2010;z-index:5}
.brand{display:flex;gap:12px;align-items:center;padding:0 8px}.brand strong{font-size:15px;letter-spacing:-.02em}.brand small{display:block;opacity:.62;font-size:11px;margin-top:1px}
.logo{width:42px;height:42px;border-radius:14px;background:linear-gradient(145deg,#f1b94c,#dc962a);color:var(--moss-dark);display:grid;place-items:center;font-weight:800;box-shadow:0 5px 16px #0e241b44}
nav{display:flex;flex-direction:column;gap:6px;flex:1}
nav a{color:#e2eee8;text-decoration:none;padding:11px 13px;border-radius:11px;opacity:.76;font-weight:600;font-size:13px;transition:background .18s,transform .18s,color .18s}
nav a:hover{background:#ffffff12;opacity:1;transform:translateX(2px)}nav a.router-link-active{background:#f4f7f3;color:var(--moss-dark);opacity:1;font-weight:700;box-shadow:0 4px 12px #12281e20}
.user{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px;border-radius:14px;background:#ffffff10;border:1px solid #ffffff0d}
.who small{display:block;opacity:.65;text-transform:capitalize}
@media(max-width:860px){.side{position:static;height:auto;flex-direction:row;flex-wrap:wrap;align-items:center;gap:12px;padding:12px 16px}
nav{flex-direction:row;overflow-x:auto;order:3;flex:1 1 100%}nav a{white-space:nowrap}.user{padding:0;background:none}.who{display:none}}
</style>
