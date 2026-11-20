<script setup>
import { computed, ref } from 'vue'
import BaseButton from '../common/BaseButton.vue'
import BaseInput from '../common/BaseInput.vue'
import { normalizePhone } from '../../stores/auth'
import { formatRupiah } from '../../utils/storage'
const props = defineProps({
  lines: { type: Array, required: true },
  customerName: String,
  customers: { type: Array, default: () => [] },
  selectedCustomerId: [String, Number],
  promoCode: { type: String, default: '' },
  promoValidation: { type: Object, default: null },
  memberDiscount: { type: Number, default: 0 },
  loyaltyStatus: { type: Object, default: null },
  message: String
})
const emit = defineEmits(['update:customerName', 'update:selectedCustomerId', 'update:promoCode', 'inc', 'dec', 'submit', 'clear'])
const subtotal = computed(() => props.lines.reduce((s, l) => s + l.price * l.qty, 0))
const total = computed(() => Math.max(0, subtotal.value - props.memberDiscount))
const phoneQuery = ref('')
const lookupMessage = ref('')
const selectedCustomer = computed(() => props.customers.find(customer => customer.id === props.selectedCustomerId))
function updatePhoneQuery(value) {
  phoneQuery.value = value
  lookupMessage.value = ''
  if (props.selectedCustomerId != null) emit('update:selectedCustomerId', null)
}
function searchCustomer() {
  const phone = normalizePhone(phoneQuery.value)
  if (!phone) {
    lookupMessage.value = 'Masukkan nomor HP pelanggan.'
    return
  }
  const customer = props.customers.find(item => normalizePhone(item.phone) === phone)
  if (!customer) {
    emit('update:selectedCustomerId', null)
    lookupMessage.value = 'Akun pelanggan tidak ditemukan. Periksa nomor HP atau lanjutkan sebagai pelanggan umum.'
    return
  }
  lookupMessage.value = ''
  emit('update:selectedCustomerId', customer.id)
}
</script>
<template>
  <aside class="card cart-card sticky">
    <div class="cart-head"><div><span class="cart-kicker">Pesanan saat ini</span><h2>Keranjang <b v-if="lines.length">{{ lines.length }}</b></h2></div><button v-if="lines.length" class="clear" @click="emit('clear')">Hapus</button></div>
    <div class="member-lookup">
      <BaseInput :model-value="phoneQuery" label="Cari akun pelanggan dengan nomor HP" type="tel" placeholder="Contoh: 0823..." @update:model-value="updatePhoneQuery" />
      <BaseButton type="button" class="lookup-button" @click="searchCustomer">Cari</BaseButton>
    </div>
    <p v-if="lookupMessage" class="customer-lookup-message">{{ lookupMessage }}</p>
    <div v-if="selectedCustomer" class="selected-member"><div><strong>{{ selectedCustomer.name }}</strong><span>{{ selectedCustomer.phone }}</span></div><span class="selected-tag">Member dipilih</span></div>
    <BaseInput v-if="!selectedCustomerId" :model-value="customerName" label="Nama Pelanggan" placeholder="Umum" @update:model-value="emit('update:customerName', $event)" />
    <div v-if="selectedCustomerId && loyaltyStatus" class="member-reward">
      <strong v-if="loyaltyStatus.promoCode">Pelanggan memiliki kode promo</strong>
      <span v-if="loyaltyStatus.promoCode">Tanyakan kodenya, lalu masukkan di bawah.</span>
      <strong v-else>{{ loyaltyStatus.progress }} / {{ loyaltyStatus.threshold }} transaksi lunas</strong>
      <span v-if="!loyaltyStatus.promoCode">Kurang {{ loyaltyStatus.remaining }} transaksi untuk mendapat kode promo.</span>
    </div>
    <p v-if="customers.length && !selectedCustomerId" class="member-hint">Cari nomor HP akun member agar transaksi masuk ke progres promo pelanggan.</p>
    <template v-if="selectedCustomerId">
      <BaseInput :model-value="promoCode" label="Kode promo (opsional)" placeholder="Masukkan kode dari pelanggan" @update:model-value="emit('update:promoCode', $event)" />
      <p v-if="promoCode.trim() && promoValidation" :class="['promo-validation', promoValidation.ok ? 'valid' : 'invalid']">{{ promoValidation.ok ? `Kode valid · diskon ${formatRupiah(promoValidation.discount)}` : promoValidation.message }}</p>
    </template>
    <div class="cart-lines">
      <div v-for="l in lines" :key="l.productId" class="cart-line">
        <div class="cart-item"><strong>{{ l.name }}</strong><span>{{ formatRupiah(l.price) }}</span></div>
        <div class="quantity"><button aria-label="Kurangi" @click="emit('dec', l.productId)">−</button><strong>{{ l.qty }}</strong><button aria-label="Tambah" @click="emit('inc', l.productId)">+</button></div>
        <strong class="line-total">{{ formatRupiah(l.price * l.qty) }}</strong>
      </div>
    </div>
    <div v-if="!lines.length" class="cart-empty">
      <div class="cart-empty-icon">+</div><strong>Keranjang masih kosong</strong><span>Pilih menu untuk mulai pesanan.</span>
    </div>
    <div class="cart-summary"><div><span>Subtotal</span><strong>{{ formatRupiah(subtotal) }}</strong></div><div v-if="memberDiscount" class="discount-row"><span>Promo {{ promoValidation?.promo?.code ?? 'member' }}</span><strong>−{{ formatRupiah(memberDiscount) }}</strong></div><div class="grand-total"><span>Total bayar</span><strong>{{ formatRupiah(total) }}</strong></div></div>
    <div v-if="message" class="error">{{ message }}</div>
    <BaseButton variant="success" class="checkout" :disabled="!lines.length" @click="emit('submit')"><span>Simpan & cetak</span><strong>{{ formatRupiah(total) }}</strong></BaseButton>
  </aside>
</template>
<style scoped>
.cart-card{padding:18px}.cart-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}.cart-kicker{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.cart-head h2{margin:2px 0 0}.cart-head h2 b{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--moss);color:#fff;font-size:11px;margin-left:5px}.clear{border:0;background:none;color:var(--danger);font:600 12px inherit;cursor:pointer}.cart-lines{display:flex;flex-direction:column;gap:8px}.cart-line{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:10px 0;border-bottom:1px solid var(--line)}.cart-item{display:flex;flex-direction:column}.cart-item span{font-size:12px;color:var(--muted)}.quantity{grid-row:2;display:flex;align-items:center;gap:8px}.quantity button{width:26px;height:26px;border:1px solid var(--line);border-radius:8px;background:#fff;color:var(--moss);cursor:pointer;font-weight:700}.quantity strong{min-width:16px;text-align:center;font-size:12px}.line-total{grid-column:2;grid-row:1;text-align:right;font-size:13px}.cart-empty{min-height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:var(--muted);gap:3px}.cart-empty strong{color:var(--ink)}.cart-empty span{font-size:12px}.cart-empty-icon{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:var(--mint);color:var(--moss);font-size:22px;margin-bottom:5px}.cart-summary{margin-top:14px}.cart-summary>div{display:flex;justify-content:space-between;color:var(--muted);font-size:13px}.grand-total{margin-top:8px;padding-top:12px;border-top:1px dashed var(--line);color:var(--ink)!important;align-items:center}.grand-total strong{font-size:20px}.checkout{width:100%;margin-top:14px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}.checkout strong{font-size:14px}
.member-lookup{display:flex;align-items:flex-end;gap:8px}.member-lookup :deep(.field){flex:1;margin-bottom:12px}.lookup-button{margin-bottom:12px;padding-inline:14px}.customer-lookup-message{margin:-7px 0 12px;color:var(--danger);font-size:10px;line-height:1.45}.selected-member{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 12px;padding:10px;border-radius:10px;background:#eaf4ec;color:#286245}.selected-member>div{display:flex;flex-direction:column;gap:3px}.selected-member strong{font-size:12px}.selected-member span{font-size:10px}.selected-member .selected-tag{padding:5px 8px;border-radius:20px;background:#d6eadb;font-weight:700}.member-reward{display:flex;flex-direction:column;gap:3px;margin:0 0 12px;padding:10px;border-radius:10px;background:#eaf4ec;color:#286245;font-size:11px}.member-reward span{color:#5d7866;font-size:10px}.member-hint{margin:-5px 0 12px;color:var(--muted);font-size:10px;line-height:1.5}.promo-validation{margin:-8px 0 12px;font-size:10px}.promo-validation.valid{color:var(--success)}.promo-validation.invalid{color:var(--danger)}.discount-row{color:var(--success)!important}
</style>
