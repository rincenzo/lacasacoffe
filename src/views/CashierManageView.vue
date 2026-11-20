<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'

const auth = useAuthStore()
const name = ref('')
const username = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const selectedCashierId = ref(null)
const newPassword = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const cashiers = computed(() => auth.users.filter(user => user.role === 'kasir'))
const selectedCashier = computed(() => cashiers.value.find(user => user.id === selectedCashierId.value))

function submit() {
  error.value = ''
  success.value = ''
  const result = auth.addCashier({ name: name.value, username: username.value, password: password.value })
  if (!result.ok) {
    error.value = result.message
    return
  }
  success.value = `Akun kasir ${username.value.trim()} berhasil dibuat.`
  name.value = ''
  username.value = ''
  password.value = ''
}

function selectCashier(cashier) {
  selectedCashierId.value = cashier.id
  newPassword.value = ''
  passwordError.value = ''
  passwordSuccess.value = ''
}

function changePassword() {
  passwordError.value = ''
  passwordSuccess.value = ''
  const result = auth.updateCashierPassword(selectedCashierId.value, newPassword.value)
  if (!result.ok) {
    passwordError.value = result.message
    return
  }
  passwordSuccess.value = `Kata sandi ${selectedCashier.value.username} berhasil diubah.`
  newPassword.value = ''
}
</script>

<template>
  <div class="page staff-page">
    <div class="page-head">
      <div><span class="staff-eyebrow">Pengaturan akses</span><h1>Kelola kasir</h1><p>Buat akun karyawan agar dapat masuk ke halaman kasir.</p></div>
    </div>
    <div class="staff-layout">
      <form class="card staff-form" @submit.prevent="submit">
        <h2>Tambah karyawan kasir</h2>
        <p class="muted form-description">Karyawan dapat menggunakan username dan kata sandi ini untuk login.</p>
        <BaseInput v-model="name" label="Nama karyawan" placeholder="Contoh: Siti" />
        <BaseInput v-model="username" label="Username" placeholder="Contoh: siti.kasir" />
        <BaseInput v-model="password" label="Kata sandi" type="password" placeholder="Minimal 6 karakter" />
        <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
        <p v-if="success" class="form-message success-message" role="status">{{ success }}</p>
        <BaseButton type="submit" class="submit-button">Buat akun kasir</BaseButton>
      </form>

      <section class="card staff-list">
        <div class="list-heading"><div><h2>Akun kasir</h2><p class="muted">{{ cashiers.length }} karyawan terdaftar</p></div><span class="staff-count">{{ cashiers.length }}</span></div>
        <div v-if="cashiers.length" class="cashier-rows">
          <div v-for="cashier in cashiers" :key="cashier.id" class="cashier-row">
            <div class="avatar">{{ cashier.name.slice(0, 1).toUpperCase() }}</div>
            <div class="cashier-info"><strong>{{ cashier.name }}</strong><span>@{{ cashier.username }}</span></div>
            <div class="cashier-actions"><span class="role-badge">Kasir</span><BaseButton variant="ghost" class="change-button" @click="selectCashier(cashier)">Ubah sandi</BaseButton></div>
          </div>
        </div>
        <p v-else class="empty-list">Belum ada akun kasir.</p>
        <form v-if="selectedCashier" class="password-form" @submit.prevent="changePassword">
          <div class="password-heading"><div><h3>Ubah kata sandi</h3><p class="muted">Akun: <strong>{{ selectedCashier.name }}</strong> (@{{ selectedCashier.username }})</p></div><button type="button" class="cancel-button" @click="selectedCashierId = null; passwordError = ''; passwordSuccess = ''">Batal</button></div>
          <BaseInput v-model="newPassword" label="Kata sandi baru" type="password" placeholder="Minimal 6 karakter" />
          <p v-if="passwordError" class="form-message error" role="alert">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="form-message success-message" role="status">{{ passwordSuccess }}</p>
          <BaseButton type="submit" class="submit-button">Simpan kata sandi baru</BaseButton>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.staff-page{max-width:1100px}.staff-eyebrow{display:block;color:var(--moss);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin-bottom:3px}.staff-layout{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(320px,1.1fr);gap:18px;align-items:start}.staff-form,.staff-list{margin:0}.staff-form h2,.staff-list h2{margin-bottom:4px}.form-description,.list-heading p{font-size:12px;margin:0 0 18px}.submit-button{width:100%;margin-top:4px}.form-message{font-size:12px;margin:0 0 12px}.success-message{color:var(--success)}.list-heading{display:flex;justify-content:space-between;align-items:flex-start}.staff-count{min-width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--mint);color:var(--moss);font-weight:700;font-size:12px}.cashier-rows{display:flex;flex-direction:column}.cashier-row{display:flex;align-items:center;gap:12px;padding:13px 0;border-top:1px solid var(--line)}.avatar{width:38px;height:38px;flex:none;border-radius:12px;display:grid;place-items:center;background:var(--mint);color:var(--moss);font-weight:800}.cashier-info{display:flex;flex:1;min-width:0;flex-direction:column}.cashier-info strong{font-size:13px}.cashier-info span{font-size:12px;color:var(--muted)}.cashier-actions{display:flex;align-items:center;gap:8px}.role-badge{background:#f1f4f1;color:var(--muted);border-radius:20px;padding:4px 9px;font-size:10px;font-weight:700}.change-button{padding:7px 10px;font-size:11px}.empty-list{color:var(--muted);padding:24px 0;text-align:center;border-top:1px solid var(--line);font-size:13px}.password-form{margin-top:16px;padding:16px;border:1px solid var(--line);border-radius:12px;background:#fbfcfb}.password-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:14px}.password-heading h3{margin:0 0 3px;font-size:14px}.password-heading p{font-size:11px;margin:0}.password-heading p strong{color:var(--ink)}.cancel-button{border:0;background:none;color:var(--muted);font:600 12px inherit;cursor:pointer}
@media(max-width:760px){.staff-layout{grid-template-columns:1fr}}
</style>
