import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import usersSeed from '../seed/users.json'
import { loadOrSeed, save } from '../utils/storage'
export const HOME_BY_ROLE = { pemilik: '/pemilik', kasir: '/kasir', pelanggan: '/akun-pelanggan' }
export function normalizePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.startsWith('62') ? `0${digits.slice(2)}` : digits
}
export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase()
}
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value)) && normalizeEmail(value).length <= 254
export const useAuthStore = defineStore('auth', () => {
  const users = ref(loadOrSeed('lcc_users', usersSeed))
  const session = ref(JSON.parse(localStorage.getItem('lcc_session') || 'null'))
  const role = computed(() => session.value?.role ?? null)
  const isLoggedIn = computed(() => !!session.value)
  const customers = computed(() => users.value.filter(user => user.role === 'pelanggan' && user.phone))
  function login(identifier, password, expectedRole = null) {
    if (!identifier || !password) return { ok: false, message: 'Username/nomor HP/email dan kata sandi wajib diisi' }
    const cleanIdentifier = identifier.trim()
    const normalizedPhone = normalizePhone(cleanIdentifier)
    const normalizedEmail = normalizeEmail(cleanIdentifier)
    const u = users.value.find(user => {
      const usernameMatches = user.username.toLowerCase() === cleanIdentifier.toLowerCase()
      const phoneMatches = user.phone && normalizePhone(user.phone) === normalizedPhone
      const emailMatches = user.email && normalizeEmail(user.email) === normalizedEmail
      return (usernameMatches || phoneMatches || emailMatches) && user.password === password
    })
    if (!u) return { ok: false, message: 'Kredensial salah' }
    if (expectedRole && u.role !== expectedRole) {
      const message = expectedRole === 'pelanggan'
        ? 'Akun member tidak ditemukan. Periksa nomor HP/email dan kata sandi.'
        : `Akun ini tidak memiliki akses sebagai ${expectedRole}. Pilih jenis akun yang sesuai.`
      return { ok: false, message }
    }
    if (u.role === 'pelanggan' && !u.phone) return { ok: false, message: 'Silakan daftar melalui menu akun pelanggan untuk menjadi member.' }
    session.value = { id: u.id, name: u.name, role: u.role }
    save('lcc_session', session.value)
    return { ok: true, role: u.role }
  }
  function addCustomer({ name, phone, email, password }) {
    const cleanName = name.trim()
    const cleanPhone = normalizePhone(phone)
    const cleanEmail = normalizeEmail(email)
    if (!cleanName || !cleanPhone || !cleanEmail || !password) return { ok: false, message: 'Semua kolom wajib diisi.' }
    if (!isValidEmail(cleanEmail)) return { ok: false, message: 'Masukkan alamat email yang valid, contoh nama@gmail.com.' }
    if (!/^08\d{8,11}$/.test(cleanPhone)) return { ok: false, message: 'Masukkan nomor HP Indonesia yang valid, contoh 081234567890.' }
    if (password.length < 8) return { ok: false, message: 'Kata sandi minimal 8 karakter.' }
    if (users.value.some(user => user.username.toLowerCase() === cleanPhone || (user.phone && normalizePhone(user.phone) === cleanPhone))) {
      return { ok: false, message: 'Nomor HP sudah terdaftar.' }
    }
    if (users.value.some(user => user.email && normalizeEmail(user.email) === cleanEmail)) {
      return { ok: false, message: 'Email sudah terdaftar.' }
    }
    const customer = {
      id: users.value.reduce((max, user) => Math.max(max, user.id), 0) + 1,
      name: cleanName,
      username: cleanPhone,
      phone: cleanPhone,
      email: cleanEmail,
      password,
      role: 'pelanggan'
    }
    users.value.push(customer)
    save('lcc_users', users.value)
    return { ok: true, phone: cleanPhone }
  }
  function hasCustomerEmail(email) {
    const cleanEmail = normalizeEmail(email)
    return !!cleanEmail && users.value.some(user => user.role === 'pelanggan' && user.email && normalizeEmail(user.email) === cleanEmail)
  }
  function resetCustomerPassword(email, password) {
    if (!password || password.length < 8) return { ok: false, message: 'Kata sandi minimal 8 karakter.' }
    const cleanEmail = normalizeEmail(email)
    const customer = users.value.find(user => user.role === 'pelanggan' && user.email && normalizeEmail(user.email) === cleanEmail)
    if (!customer) return { ok: false, message: 'Akun tidak ditemukan.' }
    if (customer.password === password) return { ok: false, message: 'Kata sandi baru harus berbeda dari yang lama.' }
    customer.password = password
    save('lcc_users', users.value)
    return { ok: true }
  }
  function addCashier({ name, username, password }) {
    if (session.value?.role !== 'pemilik') return { ok: false, message: 'Hanya pemilik yang dapat menambahkan akun kasir.' }
    const cleanName = name.trim()
    const cleanUsername = username.trim()
    if (!cleanName || !cleanUsername || !password) return { ok: false, message: 'Semua kolom wajib diisi.' }
    if (password.length < 6) return { ok: false, message: 'Kata sandi minimal 6 karakter.' }
    if (users.value.some(user => user.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { ok: false, message: 'Username sudah digunakan. Pilih username lain.' }
    }
    const cashier = {
      id: users.value.reduce((max, user) => Math.max(max, user.id), 0) + 1,
      name: cleanName,
      username: cleanUsername,
      password,
      role: 'kasir'
    }
    users.value.push(cashier)
    save('lcc_users', users.value)
    return { ok: true }
  }
  function updateCashierPassword(id, password) {
    if (session.value?.role !== 'pemilik') return { ok: false, message: 'Hanya pemilik yang dapat mengubah kata sandi kasir.' }
    if (!password || password.length < 6) return { ok: false, message: 'Kata sandi baru minimal 6 karakter.' }
    const cashier = users.value.find(user => user.id === id && user.role === 'kasir')
    if (!cashier) return { ok: false, message: 'Akun kasir tidak ditemukan.' }
    cashier.password = password
    save('lcc_users', users.value)
    return { ok: true }
  }
  function updateOwnerCredentials({ currentPassword, username, password }) {
    if (session.value?.role !== 'pemilik') return { ok: false, message: 'Hanya pemilik yang dapat mengubah kredensial akun ini.' }
    const owner = users.value.find(user => user.id === session.value.id && user.role === 'pemilik')
    if (!owner || owner.password !== currentPassword) return { ok: false, message: 'Kata sandi saat ini tidak sesuai.' }
    const cleanUsername = username.trim()
    if (!cleanUsername) return { ok: false, message: 'Username wajib diisi.' }
    if (users.value.some(user => user.id !== owner.id && user.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return { ok: false, message: 'Username sudah digunakan. Pilih username lain.' }
    }
    if (!password || password.length < 8) return { ok: false, message: 'Kata sandi baru minimal 8 karakter.' }
    if (password === owner.password) return { ok: false, message: 'Kata sandi baru harus berbeda dari kata sandi saat ini.' }
    owner.username = cleanUsername
    owner.password = password
    save('lcc_users', users.value)
    return { ok: true }
  }
  function logout() { session.value = null; localStorage.removeItem('lcc_session') }
  return { users, customers, session, role, isLoggedIn, login, addCustomer, hasCustomerEmail, resetCustomerPassword, addCashier, updateCashierPassword, updateOwnerCredentials, logout }
})
