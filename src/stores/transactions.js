import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import seed from '../seed/transactions.json'
import { loadOrSeed, save } from '../utils/storage'
import { useProductStore } from './products'
import { useAuthStore } from './auth'
const KEY = 'lcc_transactions'
const PROMO_KEY = 'lcc_promo_codes'
export const LOYALTY_PURCHASE_THRESHOLD = 5
export const LOYALTY_DISCOUNT_PERCENT = 10
export const LOYALTY_DISCOUNT_CAP = 20000
export const MIN_TRANSACTION_SUBTOTAL = 50000
export const useTransactionStore = defineStore('transactions', () => {
  const items = ref(loadOrSeed(KEY, seed))
  const promoCodes = ref(loadOrSeed(PROMO_KEY, []))
  const persist = () => save(KEY, items.value)
  const persistPromoCodes = () => save(PROMO_KEY, promoCodes.value)
  const totalRevenue = computed(() => items.value.filter(t => t.paymentStatus === 'lunas').reduce((s, t) => s + t.total, 0))
  const countByStatus = (s) => items.value.filter(t => t.orderStatus === s).length
  function transactionSubtotal(transaction) {
    return Number(transaction.subtotal ?? transaction.items?.reduce((sum, item) => sum + item.price * item.qty, 0) ?? 0)
  }
  function lastPromoTransactionId(customerId) {
    return items.value
      .filter(t => t.customerId === customerId && (t.promoCode || t.promoDiscount > 0))
      .reduce((latest, t) => Math.max(latest, t.id), 0)
  }
  function paidPurchasesSincePromo(customerId) {
    const lastPromoId = lastPromoTransactionId(customerId)
    return items.value.filter(t =>
      t.customerId === customerId &&
      t.paymentStatus === 'lunas' &&
      t.id > lastPromoId &&
      transactionSubtotal(t) >= MIN_TRANSACTION_SUBTOTAL
    ).length
  }
  function generatePromoCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code
    do {
      const bytes = new Uint8Array(8)
      if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(bytes)
      else bytes.forEach((_, index) => { bytes[index] = Math.floor(Math.random() * 256) })
      code = `LC-${Array.from(bytes, byte => alphabet[byte % alphabet.length]).join('')}`
    } while (promoCodes.value.some(promo => promo.code === code))
    return code
  }
  function ensurePromoCode(customerId) {
    const customer = useAuthStore().customers.find(user => user.id === customerId)
    if (!customer) return null
    const existing = promoCodes.value.find(promo => promo.customerId === customerId && promo.status === 'tersedia')
    if (existing) return existing
    if (paidPurchasesSincePromo(customerId) < LOYALTY_PURCHASE_THRESHOLD) return null
    const promo = {
      code: generatePromoCode(),
      customerId,
      status: 'tersedia',
      createdAt: new Date().toISOString()
    }
    promoCodes.value.unshift(promo)
    persistPromoCodes()
    return promo
  }
  function loyaltyStatus(customerId) {
    const paidCount = items.value.filter(t => t.customerId === customerId && t.paymentStatus === 'lunas').length
    const promo = ensurePromoCode(customerId)
    const progress = Math.min(paidPurchasesSincePromo(customerId), LOYALTY_PURCHASE_THRESHOLD)
    return {
      paidCount,
      progress,
      remaining: Math.max(0, LOYALTY_PURCHASE_THRESHOLD - progress),
      threshold: LOYALTY_PURCHASE_THRESHOLD,
      availablePromos: promo ? 1 : 0,
      promoCode: promo?.code ?? null
    }
  }
  function validatePromoCode(code, customerId, subtotal) {
    const cleanCode = String(code ?? '').trim().toUpperCase()
    if (!cleanCode) return { ok: false, message: 'Masukkan kode promo.' }
    if (!customerId) return { ok: false, message: 'Pilih akun member pelanggan terlebih dahulu.' }
    const customer = useAuthStore().customers.find(user => user.id === customerId)
    if (!customer) return { ok: false, message: 'Akun member tidak ditemukan.' }
    if (!Number.isFinite(subtotal) || subtotal < MIN_TRANSACTION_SUBTOTAL) {
      return { ok: false, message: `Minimal belanja ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(MIN_TRANSACTION_SUBTOTAL)} untuk menggunakan kode promo.` }
    }
    const promo = promoCodes.value.find(item => item.code.toUpperCase() === cleanCode)
    if (!promo) return { ok: false, message: 'Kode promo tidak valid.' }
    if (promo.status !== 'tersedia') return { ok: false, message: 'Kode promo ini sudah pernah digunakan.' }
    if (promo.customerId !== customerId) return { ok: false, message: 'Kode promo ini milik akun member lain.' }
    return {
      ok: true,
      promo,
      discount: Math.min(Math.floor(subtotal * LOYALTY_DISCOUNT_PERCENT / 100), LOYALTY_DISCOUNT_CAP)
    }
  }
  function attachExistingOrder(code, customerId) {
    const auth = useAuthStore()
    if (auth.role !== 'pelanggan' || auth.session?.id !== customerId) {
      return { ok: false, message: 'Masuk ke akun member untuk menghubungkan pesanan.' }
    }
    const customer = auth.customers.find(user => user.id === customerId)
    if (!customer) return { ok: false, message: 'Akun member tidak ditemukan.' }
    const cleanCode = code.trim().toLowerCase()
    if (!cleanCode) return { ok: false, message: 'Kode transaksi wajib diisi.' }
    const order = items.value.find(transaction => transaction.code.toLowerCase() === cleanCode)
    if (!order) return { ok: false, message: 'Transaksi tidak ditemukan di perangkat ini.' }
    if (!(transactionSubtotal(order) >= MIN_TRANSACTION_SUBTOTAL)) {
      return { ok: false, message: `Nota hanya dapat dihubungkan jika subtotal minimal ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(MIN_TRANSACTION_SUBTOTAL)}.` }
    }
    if (order.customerId != null) return { ok: false, message: 'Kode transaksi ini sudah pernah digunakan dan tidak dapat dipakai ulang.' }
    const normalizeName = value => String(value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('id-ID')
    if (normalizeName(order.customerName) !== normalizeName(customer.name)) {
      return { ok: false, message: 'Nama pada transaksi tidak cocok dengan nama akun member.' }
    }
    order.customerId = customerId
    persist()
    return { ok: true, order }
  }
  function create({ cashierId, customerId = null, customerName, lines, promoCode = '' }) {
    if (!lines.length) return { ok: false, message: 'Keranjang masih kosong' }
    const customer = customerId === null ? null : useAuthStore().customers.find(user => user.id === customerId)
    if (customerId !== null && !customer) return { ok: false, message: 'Akun pelanggan tidak ditemukan.' }
    const products = useProductStore()
    for (const l of lines) {
      const p = products.items.find(x => x.id === l.productId)
      if (!p || l.qty < 1) return { ok: false, message: 'Jumlah tidak valid' }
      if (l.qty > p.stock) return { ok: false, message: `Stok ${p.name} tidak cukup (sisa ${p.stock})` }
    }
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0)
    const promoValidation = promoCode.trim()
      ? validatePromoCode(promoCode, customer?.id, subtotal)
      : null
    if (promoValidation && !promoValidation.ok) return { ok: false, message: promoValidation.message }
    const promoDiscount = promoValidation?.discount ?? 0
    let id = items.value.reduce((m, x) => Math.max(m, x.id), 0) + 1
    let code = `TRX-${String(id).padStart(4, '0')}`
    while (items.value.some(transaction => transaction.code.toLowerCase() === code.toLowerCase())) {
      id += 1
      code = `TRX-${String(id).padStart(4, '0')}`
    }
    const trx = { id, code, cashierId, customerId: customer?.id ?? null,
      customerName: (customer?.name ?? customerName?.trim()) || 'Umum',
      createdAt: new Date().toISOString(), paymentStatus: 'belum_bayar', orderStatus: 'diproses',
      subtotal, promoCode: promoValidation?.promo.code ?? null, promoDiscount,
      total: subtotal - promoDiscount, items: lines.map(l => ({ ...l })) }
    items.value.unshift(trx)
    products.reduceStock(lines)
    if (promoValidation) {
      promoValidation.promo.status = 'digunakan'
      promoValidation.promo.usedAt = trx.createdAt
      promoValidation.promo.usedTransactionId = trx.id
      persistPromoCodes()
    }
    persist(); return { ok: true, trx }
  }
  function setStatus(id, patch) {
    const t = items.value.find(x => x.id === id)
    if (t) {
      Object.assign(t, patch)
      persist()
      if (t.customerId != null && t.paymentStatus === 'lunas') ensurePromoCode(t.customerId)
    }
  }
  const findByCode = (code) => items.value.find(t => t.code.toLowerCase() === code.trim().toLowerCase())
  return { items, totalRevenue, countByStatus, loyaltyStatus, validatePromoCode, attachExistingOrder, create, setStatus, findByCode }
})
