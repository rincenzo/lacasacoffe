<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import BaseInput from '../components/common/BaseInput.vue'
import BaseButton from '../components/common/BaseButton.vue'

const auth = useAuthStore()
const owner = auth.users.find(user => user.id === auth.session.id && user.role === 'pemilik')
const username = ref(owner?.username ?? '')
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref('')

function submit() {
  error.value = ''
  success.value = ''
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Konfirmasi kata sandi baru tidak sama.'
    return
  }
  const result = auth.updateOwnerCredentials({
    currentPassword: currentPassword.value,
    username: username.value,
    password: newPassword.value
  })
  if (!result.ok) {
    error.value = result.message
    return
  }
  username.value = username.value.trim()
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  success.value = 'Username dan kata sandi berhasil diperbarui.'
}
</script>

<template>
  <div class="page account-page">
    <div class="page-head">
      <div><span class="account-eyebrow">Pengaturan pemilik</span><h1>Keamanan akun</h1><p>Perbarui kredensial untuk mengurangi risiko penggunaan kata sandi bawaan.</p></div>
    </div>
    <form class="card account-form" @submit.prevent="submit">
      <div class="security-icon" aria-hidden="true">LC</div>
      <h2>Ubah username dan kata sandi</h2>
      <p class="muted description">Masukkan kata sandi saat ini untuk mengonfirmasi perubahan. Gunakan kata sandi baru yang unik dan tidak digunakan di tempat lain.</p>
      <BaseInput v-model="username" label="Username baru" placeholder="Username pemilik" autocomplete="username" />
      <BaseInput v-model="currentPassword" label="Kata sandi saat ini" type="password" placeholder="Kata sandi yang sedang digunakan" />
      <div class="password-fields">
        <BaseInput v-model="newPassword" label="Kata sandi baru" type="password" placeholder="Minimal 8 karakter" />
        <BaseInput v-model="confirmPassword" label="Ulangi kata sandi baru" type="password" placeholder="Masukkan ulang kata sandi" />
      </div>
      <p v-if="error" class="form-message error" role="alert">{{ error }}</p>
      <p v-if="success" class="form-message success-message" role="status">{{ success }}</p>
      <BaseButton type="submit" class="save-button">Simpan perubahan</BaseButton>
      <p class="security-note">Setelah diperbarui, login berikutnya menggunakan username dan kata sandi baru.</p>
    </form>
  </div>
</template>

<style scoped>
.account-page{max-width:820px}.account-eyebrow{display:block;color:var(--moss);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin-bottom:3px}.account-form{max-width:660px;margin:0 auto}.security-icon{width:42px;height:42px;margin-bottom:14px;border-radius:13px;display:grid;place-items:center;background:var(--mint);color:var(--moss);font-weight:800}.account-form h2{margin-bottom:5px}.description{font-size:13px;margin:0 0 20px;max-width:62ch}.password-fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-message{font-size:12px;margin:0 0 12px}.success-message{color:var(--success)}.save-button{width:100%;margin-top:3px}.security-note{text-align:center;color:var(--muted);font-size:11px;margin:13px 0 0}
@media(max-width:600px){.password-fields{grid-template-columns:1fr;gap:0}}
</style>
