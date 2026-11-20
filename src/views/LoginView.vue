<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, HOME_BY_ROLE, normalizeEmail, isValidEmail } from '../stores/auth'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'
import { requestOtp, verifyOtp } from '../utils/otp'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const roles = [
  { value: 'pemilik', label: 'Pemilik' },
  { value: 'kasir', label: 'Kasir' },
  { value: 'pelanggan', label: 'Pelanggan' }
]
const requestedRole = typeof route.query.role === 'string' ? route.query.role : ''
const selectedRole = ref(roles.some(role => role.value === requestedRole) ? requestedRole : 'pemilik')
const mode = ref('login')
const name = ref('')
const identifier = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const message = ref('')
const showRecoveryInfo = ref(false)
const forgotStep = ref(1)
const otpCode = ref('')
const busy = ref(false)
const resendIn = ref(0)
let resendTimer = null
const isCustomer = computed(() => selectedRole.value === 'pelanggan')
const roleLabel = computed(() => roles.find(role => role.value === selectedRole.value)?.label ?? 'akun')
const recoveryInfo = computed(() => {
  if (selectedRole.value === 'kasir') return 'Pemulihan melalui OTP email hanya untuk pelanggan. Minta pemilik mereset kata sandi melalui menu Kelola Kasir.'
  return 'Pemulihan melalui OTP email hanya untuk pelanggan. Hubungi pengelola aplikasi untuk memulihkan akun pemilik.'
})

function resetForm() {
  name.value = ''
  identifier.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  otpCode.value = ''
  forgotStep.value = 1
  message.value = ''
  showRecoveryInfo.value = false
  clearInterval(resendTimer)
  resendIn.value = 0
}

function chooseRole(role) {
  selectedRole.value = role
  mode.value = 'login'
  resetForm()
}

function setMode(nextMode) {
  mode.value = nextMode
  resetForm()
}

function startCountdown(seconds) {
  clearInterval(resendTimer)
  resendIn.value = seconds
  resendTimer = setInterval(() => {
    resendIn.value -= 1
    if (resendIn.value <= 0) clearInterval(resendTimer)
  }, 1000)
}

function openForgot() {
  if (!isCustomer.value) {
    showRecoveryInfo.value = !showRecoveryInfo.value
    return
  }
  setMode('forgot')
}

async function sendOtp() {
  const address = normalizeEmail(identifier.value)
  if (!isValidEmail(address)) {
    message.value = 'Masukkan alamat email yang valid, contoh nama@gmail.com.'
    return false
  }
  identifier.value = address
  if (!auth.hasCustomerEmail(address)) {
    startCountdown(60)
    return true
  }
  const result = await requestOtp(address)
  if (!result.ok) {
    message.value = result.message ?? 'Gagal mengirim kode.'
    if (result.retryAfter) startCountdown(result.retryAfter)
    return false
  }
  startCountdown(result.cooldown ?? 60)
  return true
}

async function resendOtp() {
  if (busy.value || resendIn.value > 0) return
  message.value = ''
  busy.value = true
  const sent = await sendOtp()
  busy.value = false
  if (sent) message.value = 'Kode baru dikirim jika email terdaftar.'
}

async function submitForgot() {
  if (busy.value) return
  message.value = ''
  busy.value = true
  try {
    if (forgotStep.value === 1) {
      if (await sendOtp()) forgotStep.value = 2
      return
    }
    if (forgotStep.value === 2) {
      if (!/^\d{6}$/.test(otpCode.value.trim())) {
        message.value = 'Kode OTP terdiri dari 6 angka.'
        return
      }
      const result = await verifyOtp(identifier.value, otpCode.value.trim())
      if (!result.ok) {
        message.value = result.message ?? 'Kode salah atau sudah kedaluwarsa.'
        return
      }
      forgotStep.value = 3
      return
    }
    if (password.value !== confirmPassword.value) {
      message.value = 'Konfirmasi kata sandi tidak sama.'
      return
    }
    const result = auth.resetCustomerPassword(identifier.value, password.value)
    if (!result.ok) {
      message.value = result.message
      return
    }
    const address = identifier.value
    setMode('login')
    identifier.value = address
    message.value = 'Kata sandi berhasil diubah. Silakan masuk.'
  } finally {
    busy.value = false
  }
}

function submit() {
  if (mode.value === 'forgot') return submitForgot()
  message.value = ''
  if (mode.value === 'register') {
    if (!isCustomer.value) return
    if (password.value !== confirmPassword.value) {
      message.value = 'Konfirmasi kata sandi tidak sama.'
      return
    }
    const result = auth.addCustomer({ name: name.value, phone: identifier.value, email: email.value, password: password.value })
    if (!result.ok) {
      message.value = result.message
      return
    }
    identifier.value = result.phone
  }

  const result = auth.login(identifier.value.trim(), password.value, selectedRole.value)
  if (!result.ok) {
    message.value = result.message
    return
  }
  password.value = ''
  confirmPassword.value = ''
  router.push(HOME_BY_ROLE[result.role])
}
</script>

<template>
  <div class="login">
    <section class="hero"><span class="logo">LC</span><h1>La Casa<br />Coffee & Space</h1><p>Masuk sesuai peran untuk mengakses layanan La Casa.</p></section>
    <section class="panel">
      <form @submit.prevent="submit">
        <div class="role-switch" role="group" aria-label="Pilih jenis akun">
          <button v-for="role in roles" :key="role.value" type="button" :class="{ active: selectedRole === role.value }" :aria-pressed="selectedRole === role.value" @click="chooseRole(role.value)">{{ role.label }}</button>
        </div>
        <h2>{{ mode === 'register' ? 'Daftar sebagai pelanggan' : mode === 'forgot' ? 'Atur ulang kata sandi' : `Masuk sebagai ${roleLabel.toLowerCase()}` }}</h2>
        <p class="muted form-hint">{{ mode === 'register' ? 'Buat akun pelanggan dengan nomor HP dan email.' : mode === 'forgot' ? (forgotStep === 1 ? 'Masukkan email akun Anda. Kode OTP dikirim ke email tersebut.' : forgotStep === 2 ? `Masukkan 6 angka kode OTP yang dikirim ke ${identifier}. Cek juga folder spam.` : 'Buat kata sandi baru, minimal 8 karakter.') : isCustomer ? 'Gunakan nomor HP atau email dan kata sandi akun pelanggan.' : 'Gunakan username dan kata sandi akun Anda.' }}</p>
        <BaseInput v-if="mode === 'register'" v-model="name" label="Nama lengkap" placeholder="Nama Anda" autocomplete="name" />
        <BaseInput v-if="mode !== 'forgot' || forgotStep === 1" v-model="identifier" :label="mode === 'forgot' ? 'Email' : isCustomer ? (mode === 'register' ? 'Nomor HP' : 'Nomor HP atau email') : 'Username'" :type="mode === 'forgot' ? 'email' : isCustomer && mode === 'register' ? 'tel' : 'text'" :placeholder="mode === 'forgot' ? 'nama@gmail.com' : isCustomer ? (mode === 'register' ? '08xxxxxxxxxx' : '08xxxxxxxxxx atau email') : 'Masukkan username'" :autocomplete="mode === 'forgot' ? 'email' : isCustomer && mode === 'register' ? 'tel' : 'username'" />
        <BaseInput v-if="mode === 'register'" v-model="email" label="Email" type="email" placeholder="nama@gmail.com" autocomplete="email" />
        <BaseInput v-if="mode !== 'forgot' || forgotStep === 3" v-model="password" :label="mode === 'forgot' ? 'Kata sandi baru' : 'Kata sandi'" type="password" :placeholder="mode === 'register' ? 'Minimal 8 karakter' : 'Masukkan kata sandi'" :autocomplete="mode === 'register' ? 'new-password' : 'current-password'" />
        <BaseInput v-if="mode === 'register' || (mode === 'forgot' && forgotStep === 3)" v-model="confirmPassword" label="Ulangi kata sandi" type="password" placeholder="Masukkan ulang kata sandi" autocomplete="new-password" />
        <BaseInput v-if="mode === 'forgot' && forgotStep === 2" v-model="otpCode" label="Kode OTP" type="text" placeholder="6 angka" autocomplete="one-time-code" />
        <p v-if="message" class="error form-message" role="alert">{{ message }}</p>
        <BaseButton type="submit" class="full" :disabled="busy">{{ mode === 'register' ? 'Daftar pelanggan' : mode === 'forgot' ? (forgotStep === 1 ? 'Kirim kode OTP' : forgotStep === 2 ? 'Verifikasi kode' : 'Simpan kata sandi') : 'Masuk' }}</BaseButton>
        <div class="account-actions">
          <button v-if="mode === 'login'" type="button" class="text-action" @click="openForgot">Lupa password?</button>
          <button v-if="mode === 'forgot' && forgotStep === 2" type="button" class="text-action" :disabled="resendIn > 0 || busy" @click="resendOtp">{{ resendIn > 0 ? `Kirim ulang kode (${resendIn} dtk)` : 'Kirim ulang kode' }}</button>
          <button v-if="mode === 'forgot'" type="button" class="text-action" @click="setMode('login')">Kembali ke login</button>
          <button v-if="isCustomer && mode !== 'forgot'" type="button" class="text-action" @click="setMode(mode === 'register' ? 'login' : 'register')">{{ mode === 'register' ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Segera daftar' }}</button>
        </div>
        <div v-if="showRecoveryInfo" class="recovery-info" role="status">{{ recoveryInfo }}</div>
        <p v-if="!isCustomer" class="muted form-hint role-note">Akun pemilik dan kasir dibuat atau dikelola oleh pemilik.</p>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login{display:grid;grid-template-columns:1.1fr 1fr;min-height:100vh;background:#f7f8f5}
.hero{position:relative;isolation:isolate;overflow:hidden;background:radial-gradient(ellipse at 75% 18%,#ffffff15,transparent 35%),linear-gradient(145deg,#244d41,#17362e);color:#fff;padding:64px;display:flex;flex-direction:column;justify-content:flex-end;gap:16px}
.hero:before,.hero:after{content:"";position:absolute;z-index:-1;border:1px solid #ffffff12;border-radius:50%;pointer-events:none}
.hero:before{width:460px;height:460px;right:-170px;top:-130px;box-shadow:0 0 0 44px #ffffff08,0 0 0 92px #ffffff05}
.hero:after{width:220px;height:220px;left:-125px;bottom:-130px;box-shadow:0 0 0 28px #ffffff07}
.hero h1{font-size:52px;line-height:1.05;letter-spacing:-.03em}.hero p{max-width:34ch;opacity:.75;font-size:16px;margin:0}
.logo{width:52px;height:52px;border-radius:17px;background:linear-gradient(145deg,#f3bd54,#dd982e);color:var(--moss-dark);display:grid;place-items:center;font-weight:800;margin-bottom:auto;box-shadow:0 10px 24px #10281e44}
.panel{display:grid;place-items:center;padding:32px}form{width:100%;max-width:420px;padding:34px;background:#fff;border:1px solid #e8ece7;border-radius:22px;box-shadow:0 20px 55px #20372a0d}.panel h2{font-size:22px;margin:20px 0 6px;letter-spacing:-.03em}.full{width:100%}.form-hint{font-size:12px;line-height:1.6;margin:0 0 17px}.role-switch{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border-radius:12px;background:#f1f4f1}.role-switch button{min-height:38px;border:0;border-radius:9px;background:transparent;color:var(--muted);font:600 12px inherit;cursor:pointer}.role-switch button.active{background:#fff;color:var(--moss-dark);box-shadow:0 2px 6px #20372a12}.account-actions{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:14px}.text-action{padding:0;border:0;background:none;color:var(--moss);font:600 11px inherit;text-align:left;cursor:pointer}.text-action:hover{text-decoration:underline}.text-action:disabled{opacity:.5;cursor:not-allowed;text-decoration:none}.recovery-info{margin-top:12px;padding:11px 12px;border:1px solid #f0dfb6;border-radius:10px;background:#fff8e9;color:#755421;font-size:11px;line-height:1.6}.role-note{margin-top:15px;margin-bottom:0}.form-message{margin:0 0 12px;font-size:12px}
@media(max-width:860px){.login{grid-template-columns:1fr}.hero{padding:32px;min-height:220px}.hero h1{font-size:34px}}
@media(max-width:480px){.panel{padding:20px 14px}form{padding:26px 20px}.hero{min-height:205px}}
</style>
