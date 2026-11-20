<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTransactionStore, LOYALTY_DISCOUNT_CAP, LOYALTY_DISCOUNT_PERCENT } from '../stores/transactions'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import StatusBadge from '../components/common/StatusBadge.vue'
import { formatRupiah } from '../utils/storage'

const auth = useAuthStore()
const transactions = useTransactionStore()
const router = useRouter()
const mode = ref('login')
const name = ref('')
const phone = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const message = ref('')
const claimCode = ref('')
const claimMessage = ref('')
const claimSuccess = ref('')
const member = computed(() => auth.users.find(user => user.id === auth.session?.id && user.role === 'pelanggan' && user.phone))
const loyalty = computed(() => member.value ? transactions.loyaltyStatus(member.value.id) : null)
const progress = computed(() => loyalty.value ? loyalty.value.progress / loyalty.value.threshold * 100 : 0)
const recentTransactions = computed(() => member.value
  ? transactions.items.filter(order => order.customerId === member.value.id).slice(0, 5)
  : [])

function setMode(nextMode) {
  mode.value = nextMode
  message.value = ''
}

function submit() {
  message.value = ''
  if (mode.value === 'register') {
    if (password.value !== confirmPassword.value) {
      message.value = 'Konfirmasi kata sandi tidak sama.'
      return
    }
    const result = auth.addCustomer({ name: name.value, phone: phone.value, email: email.value, password: password.value })
    if (!result.ok) {
      message.value = result.message
      return
    }
    phone.value = result.phone
  }

  const result = auth.login(phone.value, password.value, 'pelanggan')
  if (!result.ok) {
    message.value = result.message
    return
  }
  password.value = ''
  confirmPassword.value = ''
  router.push('/akun-pelanggan')
}

function formatDate(value) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value))
}

function browseMenu() {
  router.push('/katalog')
}

function claimOrder() {
  claimMessage.value = ''
  claimSuccess.value = ''
  const result = transactions.attachExistingOrder(claimCode.value, member.value.id)
  if (!result.ok) {
    claimMessage.value = result.message
    return
  }
  claimSuccess.value = 'Transaksi berhasil dihubungkan. Jika sudah lunas, transaksi akan masuk ke progres promo.'
  claimCode.value = ''
}
</script>

<template>
  <div class="page member-page">
    <template v-if="member && loyalty">
      <div class="page-head"><div><span class="member-eyebrow">MEMBER LA CASA</span><h1>Akun Saya</h1><p>Belanja, kumpulkan transaksi, dan nikmati promo spesial.</p></div><BaseButton variant="ghost" @click="browseMenu">Lihat menu</BaseButton></div>
      <section class="member-welcome">
        <div><span class="welcome-kicker">SELAMAT DATANG KEMBALI</span><h2>{{ member.name }}</h2><p>{{ member.phone }}</p></div>
        <div class="member-emblem">LC</div>
      </section>

      <section class="reward-card">
        <div class="reward-top">
          <div><span class="reward-kicker">LA CASA REWARDS</span><h2>Hadiah untuk pelanggan setia</h2></div>
          <span class="reward-tag">{{ loyalty.progress }} / {{ loyalty.threshold }} transaksi</span>
        </div>
        <div v-if="loyalty.availablePromos > 0" class="promo-ready">
          <div class="promo-icon">%</div>
          <div><strong>Kode promo Anda</strong><span>Tunjukkan kode ini kepada kasir untuk diskon {{ LOYALTY_DISCOUNT_PERCENT }}% hingga {{ formatRupiah(LOYALTY_DISCOUNT_CAP) }}.</span><code>{{ loyalty.promoCode }}</code></div>
        </div>
        <template v-else>
          <div class="progress-label"><span>Progres menuju promo berikutnya</span><strong>{{ loyalty.progress }} / {{ loyalty.threshold }}</strong></div>
          <div class="progress-track"><span :style="{ width: `${progress}%` }"></span></div>
          <p class="progress-note">Lunasi {{ loyalty.remaining }} transaksi lagi untuk mendapat kode promo diskon {{ LOYALTY_DISCOUNT_PERCENT }}%.</p>
        </template>
        <small class="reward-rule">Setiap {{ loyalty.threshold }} transaksi lunas mendapat satu kode. Setelah dipakai, progres dimulai kembali.</small>
      </section>

      <form class="card claim-card" @submit.prevent="claimOrder">
        <div class="claim-copy"><span class="member-eyebrow">TRANSAKSI BELUM TERTAUT?</span><h2>Hubungkan nota lama</h2><p>Masukkan kode nota. Nama pelanggan pada transaksi harus sama dengan nama akun Anda.</p></div>
        <div class="claim-controls"><BaseInput v-model="claimCode" label="Kode transaksi" placeholder="Contoh: TRX-0003" /><BaseButton type="submit">Hubungkan</BaseButton></div>
        <p v-if="claimMessage" class="form-message error" role="alert">{{ claimMessage }}</p>
        <p v-if="claimSuccess" class="form-message claim-success" role="status">{{ claimSuccess }}</p>
        <small class="claim-note">Hanya nota dengan subtotal minimal Rp50.000 sebelum diskon yang dapat dihubungkan dan dihitung untuk promo. Transaksi harus tersimpan di perangkat yang sama.</small>
      </form>

      <section class="card history-card">
        <div class="history-heading"><div><span class="member-eyebrow">RIWAYAT MEMBER</span><h2>Belanja terbaru</h2></div><span class="history-count">{{ recentTransactions.length }}</span></div>
        <div v-if="recentTransactions.length" class="history-list">
          <div v-for="order in recentTransactions" :key="order.id" class="history-row">
            <div class="history-code"><strong>{{ order.code }}</strong><span>{{ formatDate(order.createdAt) }}</span></div>
            <div class="history-total"><strong>{{ formatRupiah(order.total) }}</strong><StatusBadge :status="order.paymentStatus" /></div>
          </div>
        </div>
        <div v-else class="history-empty">Belum ada transaksi member. Pilih menu dan minta kasir mencatat transaksi menggunakan nomor HP akun ini.</div>
      </section>
    </template>

    <template v-else>
      <div class="page-head"><div><span class="member-eyebrow">LA CASA REWARDS</span><h1>Gabung jadi member</h1><p>Catat transaksi dengan nomor HP dan kumpulkan promo belanja.</p></div></div>
      <div class="member-auth-layout">
        <section class="member-pitch">
          <div class="pitch-emblem">LC</div>
          <span class="welcome-kicker">COFFEE · COMMUNITY · REWARDS</span>
          <h2>Setiap kunjungan<br />lebih berarti.</h2>
          <p>Lunasi 5 transaksi sebagai member untuk mendapatkan kode diskon 10% hingga Rp20.000.</p>
          <div class="pitch-perk"><span>01</span> Tunjukkan kode promo kepada kasir</div>
          <div class="pitch-perk"><span>02</span> Kode hanya bisa dipakai satu kali</div>
        </section>
        <form class="card member-form" @submit.prevent="submit">
          <div class="mode-switch"><button type="button" :class="{ active: mode === 'login' }" @click="setMode('login')">Masuk</button><button type="button" :class="{ active: mode === 'register' }" @click="setMode('register')">Daftar</button></div>
          <h2>{{ mode === 'login' ? 'Masuk ke akun member' : 'Buat akun member' }}</h2>
          <p class="muted form-description">{{ mode === 'login' ? 'Gunakan nomor HP atau email yang terdaftar.' : 'Daftar sekali untuk mulai mengumpulkan promo.' }}</p>
          <BaseInput v-if="mode === 'register'" v-model="name" label="Nama lengkap" placeholder="Nama Anda" autocomplete="name" />
          <BaseInput v-model="phone" :label="mode === 'register' ? 'Nomor HP' : 'Nomor HP atau email'" :type="mode === 'register' ? 'tel' : 'text'" :placeholder="mode === 'register' ? '08xxxxxxxxxx' : '08xxxxxxxxxx atau email'" :autocomplete="mode === 'register' ? 'tel' : 'username'" />
          <BaseInput v-if="mode === 'register'" v-model="email" label="Email (untuk reset kata sandi)" type="email" placeholder="nama@gmail.com" autocomplete="email" />
          <BaseInput v-model="password" label="Kata sandi" type="password" placeholder="Minimal 8 karakter" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" />
          <BaseInput v-if="mode === 'register'" v-model="confirmPassword" label="Ulangi kata sandi" type="password" placeholder="Masukkan ulang kata sandi" autocomplete="new-password" />
          <p v-if="message" class="form-message error" role="alert">{{ message }}</p>
          <BaseButton type="submit" class="member-submit">{{ mode === 'login' ? 'Masuk sebagai member' : 'Daftar member' }}</BaseButton>
          <p class="member-footnote">Promo hanya dihitung dari transaksi yang dicatat kasir menggunakan akun member Anda.</p>
        </form>
      </div>
    </template>
  </div>
</template>

<style scoped>
.member-page{max-width:1120px}.member-eyebrow{display:block;color:var(--moss);font-size:10px;font-weight:800;letter-spacing:.13em;margin-bottom:5px}.member-auth-layout{display:grid;grid-template-columns:1fr minmax(330px,.82fr);gap:20px;align-items:stretch}.member-pitch{position:relative;overflow:hidden;padding:32px;border-radius:20px;background:radial-gradient(ellipse at 90% 10%,#ffffff18,transparent 35%),linear-gradient(145deg,#2c594a,#1b3d33);color:#fff;box-shadow:0 12px 30px #1f41371c}.pitch-emblem{width:48px;height:48px;margin-bottom:42px;border-radius:15px;display:grid;place-items:center;background:var(--amber);color:var(--moss-dark);font-weight:800;box-shadow:0 8px 18px #122b2140}.welcome-kicker{font-size:9px;font-weight:800;letter-spacing:.14em;color:#d9e7de}.member-pitch h2{margin:8px 0 10px;font-size:30px;line-height:1.12;letter-spacing:-.04em}.member-pitch>p{max-width:42ch;color:#d9e7de;font-size:13px;line-height:1.7}.pitch-perk{display:flex;align-items:center;gap:10px;margin-top:12px;color:#eff5f0;font-size:12px}.pitch-perk span{width:25px;height:25px;border:1px solid #ffffff40;border-radius:8px;display:grid;place-items:center;font-size:9px}.member-form{margin:0;padding:24px}.mode-switch{display:grid;grid-template-columns:1fr 1fr;padding:4px;margin-bottom:20px;border-radius:11px;background:#f1f4f1}.mode-switch button{height:34px;border:0;border-radius:8px;background:transparent;color:var(--muted);font:600 12px inherit;cursor:pointer}.mode-switch button.active{background:#fff;color:var(--moss-dark);box-shadow:0 2px 6px #20372a12}.member-form h2{margin-bottom:4px}.form-description{font-size:12px;margin:0 0 17px}.member-submit{width:100%;margin-top:3px}.form-message{font-size:12px;margin:0 0 12px}.member-footnote{text-align:center;color:var(--muted);font-size:10px;line-height:1.6;margin:13px 0 0}.member-welcome{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:-4px 0 18px;padding:24px 28px;border-radius:18px;background:linear-gradient(115deg,#315f50,#24493e);color:#fff;box-shadow:0 12px 26px #1f41371c}.member-welcome h2{margin:4px 0 2px;font-size:23px}.member-welcome p{margin:0;color:#e0eae4;font-size:12px}.member-emblem{width:58px;height:58px;flex:none;border-radius:19px;background:var(--amber);color:var(--moss-dark);display:grid;place-items:center;font-weight:800;box-shadow:0 7px 16px #18372f30}.reward-card{margin-bottom:18px;padding:22px;border:1px solid #dfe8df;border-radius:16px;background:linear-gradient(135deg,#fff,#f3f8f3);box-shadow:0 8px 22px #20372a08}.reward-top,.history-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.reward-kicker{color:var(--moss);font-size:9px;font-weight:800;letter-spacing:.15em}.reward-top h2{margin:4px 0 0;font-size:17px}.reward-tag,.history-count{padding:6px 10px;border-radius:20px;background:var(--mint);color:var(--moss);font-size:10px;font-weight:700}.progress-label{display:flex;justify-content:space-between;margin-top:18px;color:var(--muted);font-size:11px}.progress-label strong{color:var(--moss-dark)}.progress-track{height:9px;margin-top:8px;border-radius:10px;background:#e6ece6;overflow:hidden}.progress-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#4c856d,#e3a23b);transition:width .25s}.progress-note{margin:8px 0 0;color:var(--muted);font-size:11px}.reward-rule{display:block;margin-top:16px;color:var(--muted);font-size:10px}.promo-ready{display:flex;align-items:center;gap:12px;margin-top:16px;padding:13px;border-radius:12px;background:#e8f4eb;color:#246246}.promo-icon{width:38px;height:38px;flex:none;border-radius:12px;display:grid;place-items:center;background:#d2ead8;font-size:20px;font-weight:800}.promo-ready>div:nth-child(2){display:flex;flex:1;flex-direction:column;gap:3px}.promo-ready strong{font-size:13px}.promo-ready span{font-size:10px;color:#557663}.promo-ready code{align-self:flex-start;margin-top:5px;padding:6px 9px;border:1px dashed #7eac88;border-radius:7px;background:#f5fbf6;color:#22563b;font:800 13px ui-monospace,monospace;letter-spacing:.12em}.claim-card{display:grid;grid-template-columns:minmax(0,1fr) minmax(230px,.72fr);gap:4px 18px;align-items:end;margin-bottom:18px}.claim-copy h2{margin:0 0 4px;font-size:15px}.claim-copy p{margin:0;color:var(--muted);font-size:11px;line-height:1.5}.claim-controls{display:flex;align-items:flex-end;gap:8px}.claim-controls label{flex:1;margin-bottom:0}.claim-controls button{margin-bottom:14px;white-space:nowrap}.claim-note{grid-column:1/-1;color:var(--muted);font-size:9px}.claim-success{grid-column:1/-1;margin:4px 0 0;color:var(--success);font-size:11px}.claim-card .form-message{grid-column:1/-1}.history-card{margin:0}.history-heading{align-items:center;margin-bottom:12px}.history-heading h2{margin:0}.history-list{display:flex;flex-direction:column}.history-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-top:1px solid var(--line)}.history-code,.history-total{display:flex;flex-direction:column;gap:3px}.history-code strong,.history-total>strong{font-size:12px}.history-code span{color:var(--muted);font-size:10px}.history-total{align-items:flex-end}.history-empty{padding:22px 10px;text-align:center;color:var(--muted);font-size:12px;line-height:1.7;border-top:1px solid var(--line)}
@media(max-width:820px){.member-auth-layout{grid-template-columns:1fr}.member-pitch{padding:24px}.pitch-emblem{margin-bottom:24px}.member-pitch h2{font-size:26px}}
@media(max-width:720px){.claim-card{grid-template-columns:1fr}.claim-note,.claim-success,.claim-card .form-message{grid-column:1}.claim-controls{align-items:flex-start;flex-direction:column}.claim-controls button{width:100%;margin-bottom:0}}
@media(max-width:540px){.member-form{padding:19px}.member-welcome{padding:20px}.reward-card{padding:18px}.reward-top{flex-direction:column}.promo-ready{align-items:flex-start}.promo-ready>b{margin-left:auto}}
</style>
