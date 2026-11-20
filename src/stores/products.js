import { defineStore } from 'pinia'
import { ref } from 'vue'
import productsSeed from '../seed/products.json'
import categoriesSeed from '../seed/categories.json'
import { loadOrSeed, save } from '../utils/storage'
const KEY = 'lcc_products'
const IMAGE_STORAGE_LIMIT = 2 * 1024 * 1024
export function validateProduct(p) {
  const errors = {}
  if (!p.name || !p.name.trim()) errors.name = 'Nama produk wajib diisi'
  if (!Number.isFinite(+p.price) || +p.price <= 0) errors.price = 'Harga harus lebih dari 0'
  if (!Number.isInteger(+p.stock) || +p.stock < 0) errors.stock = 'Stok harus bilangan bulat >= 0'
  if (!p.categoryId) errors.categoryId = 'Kategori wajib dipilih'
  if (p.image && !p.image.startsWith('data:image/jpeg;base64,')) errors.image = 'Format gambar menu tidak valid'
  return errors
}
export const useProductStore = defineStore('products', () => {
  const items = ref(loadOrSeed(KEY, productsSeed))
  const categories = ref(loadOrSeed('lcc_categories', categoriesSeed))
  const persist = () => save(KEY, items.value)
  const categoryName = (id) => categories.value.find(c => c.id === id)?.name ?? '-'
  const normalize = (id, p) => ({ id, name: p.name.trim(), price: +p.price, stock: +p.stock, categoryId: +p.categoryId, image: p.image || '' })
  const imageStorageError = (products) => products.reduce((total, product) => total + (product.image?.length ?? 0), 0) > IMAGE_STORAGE_LIMIT
    ? 'Penyimpanan gambar menu sudah penuh. Hapus gambar lama sebelum menambahkan gambar baru.'
    : ''
  function add(p) {
    const errors = validateProduct(p)
    if (Object.keys(errors).length) return { ok: false, errors }
    const product = normalize(items.value.reduce((m, x) => Math.max(m, x.id), 0) + 1, p)
    const storageError = imageStorageError([...items.value, product])
    if (storageError) return { ok: false, errors: { image: storageError } }
    items.value.push(product)
    persist(); return { ok: true }
  }
  function update(id, p) {
    const errors = validateProduct(p)
    if (Object.keys(errors).length) return { ok: false, errors }
    const i = items.value.findIndex(x => x.id === id)
    if (i < 0) return { ok: false, errors: { name: 'Produk tidak ditemukan' } }
    const product = normalize(id, p)
    const nextItems = items.value.map((item, index) => index === i ? product : item)
    const storageError = imageStorageError(nextItems)
    if (storageError) return { ok: false, errors: { image: storageError } }
    items.value[i] = product
    persist(); return { ok: true }
  }
  function remove(id) { items.value = items.value.filter(x => x.id !== id); persist() }
  function reduceStock(lines) {
    lines.forEach(l => { const p = items.value.find(x => x.id === l.productId); if (p) p.stock -= l.qty })
    persist()
  }
  return { items, categories, categoryName, add, update, remove, reduceStock }
})
