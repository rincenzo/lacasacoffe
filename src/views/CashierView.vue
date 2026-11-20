<script setup>
import { computed, ref } from 'vue'
import { useProductStore } from '../stores/products'
import { useTransactionStore, LOYALTY_DISCOUNT_PERCENT } from '../stores/transactions'
import { useAuthStore } from '../stores/auth'
import ProductCard from '../components/features/ProductCard.vue'
import CartPanel from '../components/features/CartPanel.vue'
import { formatRupiah } from '../utils/storage'
const products = useProductStore(); const trx = useTransactionStore(); const auth = useAuthStore()
const lines = ref([]); const customerName = ref(''); const selectedCustomerId = ref(null); const message = ref('')
const promoCode = ref('')
const search = ref(''); const activeCategory = ref('all'); const receipt = ref(null)
const customers = computed(() => auth.customers)
const selectedCustomer = computed(() => customers.value.find(customer => customer.id === selectedCustomerId.value))
const subtotal = computed(() => lines.value.reduce((sum, line) => sum + line.price * line.qty, 0))
const memberLoyalty = computed(() => selectedCustomer.value ? trx.loyaltyStatus(selectedCustomer.value.id) : null)
const promoValidation = computed(() => promoCode.value.trim()
  ? trx.validatePromoCode(promoCode.value, selectedCustomer.value?.id ?? null, subtotal.value)
  : null)
const promoDiscount = computed(() => promoValidation.value?.ok ? promoValidation.value.discount : 0)
const filteredProducts = computed(() => products.items.filter(p => {
  const matchesSearch = p.name.toLowerCase().includes(search.value.toLowerCase())
  const matchesCategory = activeCategory.value === 'all' || p.categoryId === activeCategory.value
  return matchesSearch && matchesCategory
}))
function add(p) {
  const l = lines.value.find(x => x.productId === p.id)
  l ? l.qty++ : lines.value.push({ productId: p.id, name: p.name, price: p.price, qty: 1 })
}
function dec(id) { const l = lines.value.find(x => x.productId === id); if (l && --l.qty < 1) lines.value = lines.value.filter(x => x !== l) }
function submit() {
  const r = trx.create({
    cashierId: auth.session.id,
    customerId: selectedCustomer.value?.id ?? null,
    customerName: selectedCustomer.value?.name ?? customerName.value,
    lines: lines.value,
    promoCode: promoCode.value
  })
  message.value = r.ok ? '' : r.message
  if (r.ok) { receipt.value = r.trx; lines.value = []; customerName.value = ''; selectedCustomerId.value = null; promoCode.value = '' }
}
function clearCart() { lines.value = []; message.value = '' }
function selectCustomer(id) {
  selectedCustomerId.value = id
  customerName.value = ''
  promoCode.value = ''
  message.value = ''
}
function receiptDate(value) { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }
function printReceipt() {
  if (!receipt.value) return
  const r = receipt.value
  const items = r.items.map(i => `<tr><td>${i.name}<br><small>${i.qty} x ${new Intl.NumberFormat('id-ID').format(i.price)}</small></td><td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(i.price * i.qty)}</td></tr>`).join('')
  const totals = `<div class="subtotal"><span>Subtotal</span><span>${formatRupiah(r.subtotal)}</span></div>${r.promoDiscount ? `<div class="discount"><span>Promo ${r.promoCode} (${LOYALTY_DISCOUNT_PERCENT}%)</span><span>-${formatRupiah(r.promoDiscount)}</span></div>` : ''}`
  const w = window.open('', '_blank', 'width=420,height=620')
  if (!w) return
  w.document.write(`<!doctype html><html><head><title>${r.code}</title><style>body{font-family:monospace;color:#111;margin:24px}.head{text-align:center;border-bottom:1px dashed #555;padding-bottom:12px}.meta{font-size:12px;margin:14px 0}table{width:100%;border-collapse:collapse;font-size:12px}td{padding:7px 0}td:last-child{text-align:right}.subtotal,.discount,.total{display:flex;justify-content:space-between;padding:5px 0;font-size:12px}.discount{color:#2e8b57}.total{border-top:1px dashed #555;margin-top:6px;padding-top:10px;font-weight:bold;font-size:14px}.thanks{text-align:center;font-size:12px;margin-top:24px}@media print{body{margin:0}}</style></head><body><div class="head"><h2 style="margin:0">LA CASA</h2><div>Coffee & Space</div></div><div class="meta">${r.code}<br>${receiptDate(r.createdAt)}<br>Pelanggan: ${r.customerName}</div><table>${items}</table>${totals}<div class="total"><span>TOTAL</span><span>${formatRupiah(r.total)}</span></div><div class="thanks">Terima kasih<br>Selamat menikmati</div></body></html>`)
  w.document.close(); w.focus(); w.print()
}
</script>
<template>
  <div class="page cashier-page">
    <div class="page-head">
      <div><span class="eyebrow">Kasir</span><h1>Transaksi baru</h1><p>Pilih menu dan buat pesanan pelanggan.</p></div>
      <div class="live-status"><span></span> Toko aktif</div>
    </div>
    <div class="pos">
      <section>
        <div class="catalog-toolbar">
          <label class="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"/></svg>
            <input v-model="search" type="search" placeholder="Cari menu..." />
          </label>
          <div class="categories">
            <button :class="{ active: activeCategory === 'all' }" @click="activeCategory = 'all'">Semua</button>
            <button v-for="c in products.categories" :key="c.id" :class="{ active: activeCategory === c.id }" @click="activeCategory = c.id">{{ c.name }}</button>
          </div>
        </div>
        <div v-if="filteredProducts.length" class="grid">
          <ProductCard v-for="p in filteredProducts" :key="p.id" :product="p" :category-name="products.categoryName(p.categoryId)" show-add @add="add" />
        </div>
        <div v-else class="card empty-catalog">Produk tidak ditemukan.</div>
      </section>
      <CartPanel :lines="lines" v-model:customer-name="customerName" :selected-customer-id="selectedCustomerId" v-model:promo-code="promoCode" :customers="customers" :loyalty-status="memberLoyalty" :promo-validation="promoValidation" :member-discount="promoDiscount" :message="message" @update:selected-customer-id="selectCustomer" @inc="id => add(products.items.find(p => p.id === id))" @dec="dec" @submit="submit" @clear="clearCart" />
    </div>

    <Teleport to="body">
      <div v-if="receipt" class="modal-backdrop" @click.self="receipt = null">
        <div class="receipt-modal" role="dialog" aria-modal="true" aria-label="Struk pembelian">
          <button class="modal-close" aria-label="Tutup" @click="receipt = null">×</button>
          <div class="receipt">
            <div class="receipt-brand"><div class="receipt-logo">LC</div><h2>La Casa</h2><span>Coffee & Space</span></div>
            <div class="receipt-meta"><span>{{ receipt.code }}</span><span>{{ receiptDate(receipt.createdAt) }}</span></div>
            <div class="receipt-customer">Pelanggan: <strong>{{ receipt.customerName }}</strong></div>
            <div class="receipt-lines">
              <div v-for="i in receipt.items" :key="i.productId" class="receipt-line">
                <div><strong>{{ i.name }}</strong><small>{{ i.qty }} × {{ formatRupiah(i.price) }}</small></div>
                <strong>{{ formatRupiah(i.price * i.qty) }}</strong>
              </div>
            </div>
            <div class="receipt-subtotal"><span>Subtotal</span><strong>{{ formatRupiah(receipt.subtotal) }}</strong></div>
            <div v-if="receipt.promoDiscount" class="receipt-discount"><span>Promo {{ receipt.promoCode }} ({{ LOYALTY_DISCOUNT_PERCENT }}%)</span><strong>−{{ formatRupiah(receipt.promoDiscount) }}</strong></div>
            <div class="receipt-total"><span>Total</span><strong>{{ formatRupiah(receipt.total) }}</strong></div>
            <p class="receipt-thanks">Terima kasih telah berbelanja</p>
          </div>
          <div class="receipt-actions"><button class="secondary-action" @click="receipt = null">Selesai</button><button class="print-action" @click="printReceipt">Cetak struk</button></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
