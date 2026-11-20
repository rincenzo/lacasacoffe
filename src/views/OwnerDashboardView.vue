<script setup>
import { computed, ref } from 'vue'
import StatCard from '../components/common/StatCard.vue'
import BaseInput from '../components/common/BaseInput.vue'
import { useTransactionStore } from '../stores/transactions'
import { useProductStore } from '../stores/products'
import { normalizePhone, useAuthStore } from '../stores/auth'
import { formatRupiah } from '../utils/storage'
const trx = useTransactionStore(); const products = useProductStore()
const auth = useAuthStore()
const lowStock = computed(() => products.items.filter(p => p.stock <= 10))
const customerSearch = ref('')
const matchingCustomers = computed(() => {
  const query = customerSearch.value.trim()
  if (!query) return auth.customers
  const nameQuery = query.toLocaleLowerCase('id-ID')
  const phoneQuery = normalizePhone(query)
  return auth.customers.filter(customer =>
    customer.name.toLocaleLowerCase('id-ID').includes(nameQuery) ||
    (phoneQuery && normalizePhone(customer.phone).includes(phoneQuery))
  )
})
</script>
<template>
  <div class="page owner-page"><div class="page-head"><div><span class="dashboard-kicker">LA CASA · RUANG PEMILIK</span><h1>Ringkasan usaha</h1><p>Pendapatan dan stok La Casa hari ini.</p></div></div>
    <section class="welcome-banner"><div><span class="welcome-tag">DASHBOARD PEMILIK</span><h2>Selamat datang, {{ auth.session?.name || 'Pemilik' }}</h2><p>Berikut ringkasan operasional kafe Anda.</p></div><div class="welcome-mark">LC</div></section>
    <div class="grid">
      <StatCard title="Pendapatan (Lunas)" :value="formatRupiah(trx.totalRevenue)" />
      <StatCard title="Total Transaksi" :value="trx.items.length" />
      <StatCard title="Pesanan Diproses" :value="trx.countByStatus('diproses')" />
      <StatCard title="Jumlah Produk" :value="products.items.length" /></div>
    <div class="card stock-card"><div class="stock-heading"><div><span class="dashboard-kicker">PERLU DIPANTAU</span><h2>Stok menipis</h2></div><span class="stock-count">{{ lowStock.length }}</span></div>
      <p v-if="!lowStock.length" class="muted">Semua stok aman</p>
      <div v-else class="stock-list"><div v-for="p in lowStock" :key="p.id" class="stock-row"><span class="stock-dot"></span><strong>{{ p.name }}</strong><span>Sisa {{ p.stock }}</span></div></div>
    </div>
    <section class="card customer-card">
      <div class="customer-heading"><div><span class="dashboard-kicker">DATA PELANGGAN</span><h2>Member terdaftar</h2></div><span class="customer-count">{{ auth.customers.length }} pelanggan</span></div>
      <BaseInput v-model="customerSearch" label="Cari nama atau nomor HP" placeholder="Ketik nama atau nomor HP" />
      <div v-if="matchingCustomers.length" class="customer-list">
        <div v-for="customer in matchingCustomers" :key="customer.id" class="customer-row"><strong>{{ customer.name }}</strong><span>{{ customer.phone }}</span></div>
      </div>
      <p v-else class="muted customer-empty">{{ customerSearch ? 'Tidak ada pelanggan yang cocok.' : 'Belum ada akun pelanggan terdaftar.' }}</p>
    </section>
  </div>
</template>
<style scoped>
.owner-page{max-width:1320px}.dashboard-kicker{display:block;color:var(--moss);font-size:10px;font-weight:800;letter-spacing:.13em;margin-bottom:5px}.welcome-banner{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;gap:20px;margin:-4px 0 20px;padding:24px 28px;border-radius:18px;background:radial-gradient(ellipse at 90% 15%,#ffffff22,transparent 30%),linear-gradient(115deg,#315f50,#24493e);color:#fff;box-shadow:0 12px 26px #1f41371c}.welcome-tag{font-size:9px;font-weight:800;letter-spacing:.15em;opacity:.65}.welcome-banner h2{font-size:22px;margin:5px 0 3px;letter-spacing:-.03em}.welcome-banner p{margin:0;color:#e0eae4;font-size:12px}.welcome-mark{width:66px;height:66px;flex:none;border-radius:22px;background:#f0b547;color:var(--moss-dark);display:grid;place-items:center;font-size:19px;font-weight:800;box-shadow:0 8px 18px #18372f30;transform:rotate(5deg)}.stock-card{margin-top:20px}.stock-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.stock-heading h2{margin:0}.stock-count{min-width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:#fff3dc;color:#a86a13;font-weight:800}.stock-list{display:grid;gap:4px}.stock-row{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:10px;background:#fafbf9;font-size:12px}.stock-row strong{flex:1}.stock-row>span:last-child{color:#a86a13;font-weight:700}.stock-dot{width:7px;height:7px;border-radius:50%;background:#df9a31}
@media(max-width:600px){.welcome-banner{padding:20px}.welcome-banner h2{font-size:18px}.welcome-mark{width:52px;height:52px;border-radius:17px}}
</style>
<style scoped>
.customer-card{margin-top:20px}.customer-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.customer-heading h2{margin:0}.customer-count{padding:7px 10px;border-radius:20px;background:var(--mint);color:var(--moss);font-size:10px;font-weight:700}.customer-list{display:grid;max-height:300px;overflow:auto}.customer-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 4px;border-top:1px solid var(--line);font-size:12px}.customer-row span{color:var(--muted)}.customer-empty{margin:10px 0}
</style>
