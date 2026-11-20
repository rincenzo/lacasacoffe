<script setup>
import { reactive, ref, watch } from 'vue'
import BaseInput from '../common/BaseInput.vue'
import BaseButton from '../common/BaseButton.vue'
const props = defineProps({ categories: { type: Array, required: true }, initial: Object, errors: { type: Object, default: () => ({}) } })
const emit = defineEmits(['submit', 'cancel'])
const blank = () => ({ name: '', price: '', stock: '', categoryId: '', image: '' })
const form = reactive(blank())
const fileInput = ref(null)
const imageError = ref('')
watch(() => props.initial, (v) => {
  Object.assign(form, blank(), v ?? {})
  imageError.value = ''
}, { immediate: true })

async function selectImage(event) {
  const file = event.target.files?.[0]
  if (!file) return
  imageError.value = ''
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    imageError.value = 'Pilih gambar JPG, PNG, atau WebP.'
    event.target.value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    imageError.value = 'Ukuran gambar maksimal 5 MB.'
    event.target.value = ''
    return
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Gambar tidak dapat dibuka.'))
      image.src = objectUrl
    })
    const scale = Math.min(1, 800 / Math.max(image.naturalWidth, image.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Gambar tidak dapat diproses.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const compressedImage = canvas.toDataURL('image/jpeg', 0.72)
    if (compressedImage.length > 250000) {
      imageError.value = 'Gambar terlalu besar setelah diproses. Pilih gambar lain.'
      return
    }
    form.image = compressedImage
  } catch (error) {
    imageError.value = error.message || 'Gambar gagal diproses.'
  } finally {
    URL.revokeObjectURL(objectUrl)
    event.target.value = ''
  }
}
</script>
<template>
  <form class="card" @submit.prevent="emit('submit', { ...form })">
    <h2>{{ initial ? 'Ubah Produk' : 'Tambah Produk' }}</h2>
    <BaseInput v-model="form.name" label="Nama Produk" :error="errors.name" />
    <BaseInput v-model="form.price" label="Harga (Rp)" type="number" :error="errors.price" />
    <BaseInput v-model="form.stock" label="Stok" type="number" :error="errors.stock" />
    <label class="sel"><span>Kategori</span>
      <select v-model="form.categoryId"><option value="">-- pilih --</option>
        <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option></select>
    </label>
    <div v-if="errors.categoryId" class="error">{{ errors.categoryId }}</div>
    <div class="image-field">
      <div class="image-heading"><div><strong>Gambar menu</strong><small>JPG, PNG, atau WebP · maksimal 5 MB</small></div>
        <button v-if="form.image" type="button" class="remove-image" @click="form.image = ''; imageError = ''">Hapus gambar</button></div>
      <div class="image-control">
        <div v-if="form.image" class="image-preview"><img :src="form.image" alt="Pratinjau gambar menu" /></div>
        <div v-else class="image-placeholder"><span>+</span><small>Belum ada gambar</small></div>
        <div class="image-upload">
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" @change="selectImage" />
          <BaseButton type="button" variant="ghost" @click="fileInput?.click()">{{ form.image ? 'Ganti gambar' : 'Pilih gambar' }}</BaseButton>
          <small>Gambar otomatis diperkecil agar hemat penyimpanan.</small>
        </div>
      </div>
      <div v-if="imageError || errors.image" class="error image-error" role="alert">{{ imageError || errors.image }}</div>
    </div>
    <div class="row" style="margin-top:12px"><BaseButton type="submit">Simpan</BaseButton>
      <BaseButton v-if="initial" variant="ghost" @click="emit('cancel')">Batal</BaseButton></div>
  </form>
</template>
<style scoped>.sel{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;font-weight:600;font-size:13px}select{padding:11px 14px;border:1px solid var(--line);border-radius:10px;font:inherit;background:#FBFCFB}select:focus{outline:0;border-color:var(--moss);box-shadow:0 0 0 3px var(--mint)}.image-field{margin-top:16px}.image-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}.image-heading>div{display:flex;flex-direction:column;gap:2px}.image-heading strong{font-size:13px}.image-heading small,.image-upload small{font-size:11px;color:var(--muted)}.remove-image{border:0;background:none;color:var(--danger);font:600 11px inherit;cursor:pointer}.image-control{display:flex;align-items:center;gap:14px;padding:12px;border:1px dashed #cfd9d2;border-radius:12px;background:#fafbf9}.image-preview,.image-placeholder{width:102px;height:76px;flex:none;border-radius:9px;overflow:hidden}.image-preview img{width:100%;height:100%;object-fit:cover}.image-placeholder{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;background:var(--mint);color:var(--moss)}.image-placeholder span{font-size:23px;line-height:20px}.image-placeholder small{font-size:9px}.image-upload{display:flex;flex-direction:column;align-items:flex-start;gap:6px}.image-upload input{display:none}.image-error{margin-top:7px}</style>
