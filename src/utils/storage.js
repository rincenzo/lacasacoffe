export function loadOrSeed(key, seed) {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (e) { console.warn('Storage rusak, memuat seed:', key, e) }
  localStorage.setItem(key, JSON.stringify(seed))
  return structuredClone(seed)
}
export function save(key, data) { localStorage.setItem(key, JSON.stringify(data)) }
export const formatRupiah = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
