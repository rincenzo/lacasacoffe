<script setup>
import { useTransactionStore } from '../stores/transactions'
import { useAuthStore } from '../stores/auth'
import OrderTable from '../components/features/OrderTable.vue'
import { formatRupiah } from '../utils/storage'
const trx = useTransactionStore(); const auth = useAuthStore()
function print(o) {
  const date = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(o.createdAt))
  const body = o.items.map(i => `<tr><td>${i.name}<small>${i.qty} x ${formatRupiah(i.price)}</small></td><td>${formatRupiah(i.price * i.qty)}</td></tr>`).join('')
  const subtotal = o.subtotal ?? o.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const promoLabel = o.promoCode ? `Promo ${o.promoCode}` : 'Promo member'
  const totals = `<div class="subtotal"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>${o.promoDiscount ? `<div class="discount"><span>${promoLabel}</span><span>-${formatRupiah(o.promoDiscount)}</span></div>` : ''}`
  const w = window.open('', '_blank', 'width=420,height=620'); if (!w) return
  w.document.write(`<!doctype html><html><head><title>${o.code}</title><style>body{font-family:monospace;color:#111;margin:24px}.brand{text-align:center;border-bottom:1px dashed #777;padding-bottom:12px}.brand h2{margin:0}.meta{font-size:11px;margin:14px 0}.meta div{display:flex;justify-content:space-between}table{width:100%;border-collapse:collapse;font-size:12px}td{padding:8px 0;border-bottom:1px dashed #ddd}td:last-child{text-align:right}small{display:block;color:#777;margin-top:2px}.subtotal,.discount,.total{display:flex;justify-content:space-between;padding:6px 0;font-size:12px}.discount{color:#2e8b57}.total{border-top:1px solid #111;margin-top:8px;padding-top:12px;font-weight:bold;font-size:14px}.thanks{text-align:center;font-size:11px;margin-top:24px}@media print{body{margin:0}}</style></head><body><div class="brand"><h2>LA CASA</h2><span>Coffee & Space</span></div><div class="meta"><div><span>${o.code}</span><span>${date}</span></div><div style="margin-top:6px"><span>Pelanggan</span><strong>${o.customerName}</strong></div></div><table>${body}</table>${totals}<div class="total"><span>TOTAL</span><span>${formatRupiah(o.total)}</span></div><div class="thanks">Terima kasih<br>Selamat menikmati</div></body></html>`)
  w.document.close(); w.focus(); w.print()
}
</script>
<template>
  <div class="page"><div class="page-head"><div><h1>Daftar pesanan</h1><p>Perbarui status pembayaran dan pesanan.</p></div></div><div class="card">
    <OrderTable :orders="trx.items" :can-edit="auth.role === 'kasir'" @pay="id => trx.setStatus(id, { paymentStatus: 'lunas' })" @finish="id => trx.setStatus(id, { orderStatus: 'selesai' })" @print="print" /></div></div>
</template>
