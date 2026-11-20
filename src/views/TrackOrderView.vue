<script setup>
import { ref } from 'vue'
import { useTransactionStore } from '../stores/transactions'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import { formatRupiah } from '../utils/storage'
const trx = useTransactionStore()
const code = ref(''); const result = ref(null); const message = ref('')
function search() {
  result.value = null
  if (!code.value.trim()) { message.value = 'Kode pesanan wajib diisi'; return }
  result.value = trx.findByCode(code.value) ?? null
  message.value = result.value ? '' : 'Pesanan tidak ditemukan'
}
function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
function printReceipt() {
  if (!result.value) return
  const r = result.value
  const items = r.items.map(i => `<tr><td>${i.name}<small>${i.qty} x ${formatRupiah(i.price)}</small></td><td>${formatRupiah(i.price * i.qty)}</td></tr>`).join('')
  const subtotal = r.subtotal ?? r.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const promoLabel = r.promoCode ? `Promo ${r.promoCode}` : 'Promo member'
  const totals = `<div class="subtotal"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>${r.promoDiscount ? `<div class="discount"><span>${promoLabel}</span><span>-${formatRupiah(r.promoDiscount)}</span></div>` : ''}`
  const w = window.open('', '_blank', 'width=420,height=620')
  if (!w) return
  w.document.write(`<!doctype html><html><head><title>Nota ${r.code}</title><style>body{font-family:monospace;color:#111;margin:24px}.brand{text-align:center;border-bottom:1px dashed #777;padding-bottom:12px}.brand h2{margin:0}.meta{font-size:11px;margin:14px 0}.meta div{display:flex;justify-content:space-between}table{width:100%;border-collapse:collapse;font-size:12px}td{padding:8px 0;border-bottom:1px dashed #ddd}td:last-child{text-align:right}small{display:block;color:#777;margin-top:2px}.subtotal,.discount,.total{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}.discount{color:#2e8b57}.total{border-top:1px solid #111;margin-top:8px;padding-top:12px;font-weight:bold;font-size:14px}.thanks{text-align:center;font-size:11px;margin-top:24px}@media print{body{margin:0}}</style></head><body><div class="brand"><h2>LA CASA</h2><span>Coffee & Space</span></div><div class="meta"><div><span>${r.code}</span><span>${formatDate(r.createdAt)}</span></div><div style="margin-top:6px"><span>Pelanggan</span><strong>${r.customerName}</strong></div></div><table>${items}</table>${totals}<div class="total"><span>TOTAL</span><span>${formatRupiah(r.total)}</span></div><div class="thanks">Terima kasih<br>Selamat menikmati</div></body></html>`)
  w.document.close(); w.focus(); w.print()
}
</script>
<template>
  <div class="page track-page">
    <div class="page-head"><div><span class="track-eyebrow">Informasi pesanan</span><h1>Cek status pesanan</h1><p>Masukkan kode pesanan untuk melihat nota dan status.</p></div></div>
    <div class="track-layout">
      <div class="card search-card">
        <h2>Kode Pesanan</h2>
        <BaseInput v-model="code" label="" placeholder="Contoh: TRX-0001" :error="message" @keyup.enter="search" />
        <BaseButton class="check-button" @click="search">Cek pesanan</BaseButton>
      </div>

      <div v-if="result" class="card order-card">
        <div class="order-head">
          <div><span class="order-label">Nota pesanan</span><h2>{{ result.code }}</h2></div>
          <div class="order-status"><StatusBadge :status="result.paymentStatus" /><StatusBadge :status="result.orderStatus" /></div>
        </div>
        <div class="customer-row"><span>Pelanggan</span><strong>{{ result.customerName }}</strong></div>
        <div class="order-date">{{ formatDate(result.createdAt) }}</div>
        <div class="nota">
          <div class="nota-head"><span>Pesanan</span><span>Jumlah</span></div>
          <div v-for="item in result.items" :key="item.productId" class="nota-item">
            <div><strong>{{ item.name }}</strong><small>{{ item.qty }} × {{ formatRupiah(item.price) }}</small></div>
            <strong>{{ formatRupiah(item.price * item.qty) }}</strong>
          </div>
          <div class="nota-summary"><div><span>Subtotal</span><strong>{{ formatRupiah(result.subtotal ?? result.items.reduce((sum, item) => sum + item.price * item.qty, 0)) }}</strong></div>          <div v-if="result.promoDiscount" class="nota-discount"><span>Promo {{ result.promoCode || 'member' }}</span><strong>−{{ formatRupiah(result.promoDiscount) }}</strong></div><div class="nota-total"><span>Total pembayaran</span><strong>{{ formatRupiah(result.total) }}</strong></div></div>
        </div>
        <button class="print-button" @click="printReceipt">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3M7 14h10v7H7z"/></svg>
          Cetak nota
        </button>
      </div>

      <div v-else-if="message && message !== 'Pesanan tidak ditemukan'" class="note-placeholder">
        <div class="placeholder-icon">LC</div><p>Masukkan kode untuk menampilkan nota pesanan.</p>
      </div>
    </div>
  </div>
</template>
<style scoped>
.track-page{max-width:920px}.track-eyebrow{display:block;color:var(--moss);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin-bottom:3px}.track-layout{display:grid;grid-template-columns:300px minmax(0,1fr);gap:18px;align-items:start}.search-card h2{font-size:15px;margin-bottom:14px}.check-button{width:100%}.order-card{margin:0}.order-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding-bottom:14px;border-bottom:1px dashed var(--line)}.order-label{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.1em}.order-head h2{margin:3px 0 0}.order-status{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px}.customer-row{display:flex;justify-content:space-between;margin-top:14px;font-size:13px}.customer-row span,.order-date{color:var(--muted)}.order-date{text-align:right;font-size:11px;margin-top:2px}.nota{margin-top:18px;border:1px solid var(--line);border-radius:12px;overflow:hidden}.nota-head{display:flex;justify-content:space-between;padding:9px 12px;background:#f4f7f4;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.08em}.nota-item{display:flex;justify-content:space-between;gap:12px;padding:11px 12px;border-bottom:1px dashed var(--line);font-size:13px}.nota-item>div{display:flex;flex-direction:column}.nota-item small{color:var(--muted);margin-top:3px}.nota-total{display:flex;justify-content:space-between;align-items:center;padding:14px 12px;background:#fbfcfb;font-size:14px}.nota-total strong{font-size:18px}.nota-summary{padding:9px 12px;background:#fbfcfb}.nota-summary>div:not(.nota-total){display:flex;justify-content:space-between;padding:5px 0;color:var(--muted);font-size:12px}.nota-summary .nota-discount{color:var(--success)!important}.nota-summary .nota-total{margin-top:6px;padding:12px 0 0;border-top:1px dashed var(--line);background:transparent}.print-button{margin-top:12px;width:100%;height:42px;border:0;border-radius:10px;background:var(--moss);color:#fff;font:700 13px inherit;display:flex;justify-content:center;align-items:center;gap:8px;cursor:pointer}.print-button svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7}.note-placeholder{min-height:330px;border:1px dashed var(--line);border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--muted);text-align:center;font-size:13px}.placeholder-icon{width:48px;height:48px;border-radius:14px;background:var(--mint);color:var(--moss);display:grid;place-items:center;font-weight:800}
@media(max-width:860px){.track-layout{grid-template-columns:1fr}.note-placeholder{min-height:180px}}
</style>
