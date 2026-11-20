<script setup>
import { ref } from 'vue'
import { useProductStore } from '../stores/products'
import ProductForm from '../components/features/ProductForm.vue'
import ProductTable from '../components/features/ProductTable.vue'
const store = useProductStore()
const editing = ref(null); const errors = ref({})
function onSubmit(data) {
  const r = editing.value ? store.update(editing.value.id, data) : store.add(data)
  errors.value = r.ok ? {} : r.errors
  if (r.ok) editing.value = null
}
function onRemove(id) { if (confirm('Hapus produk ini?')) store.remove(id) }
</script>
<template>
  <div class="page"><div class="page-head"><div><h1>Kelola produk</h1><p>Tambah menu, atur stok, dan pasang gambar produk.</p></div></div>
    <ProductForm :categories="store.categories" :initial="editing" :errors="errors" :key="editing?.id ?? 'new'" @submit="onSubmit" @cancel="editing = null; errors = {}" />
    <div class="card"><ProductTable :products="store.items" :category-name="store.categoryName" @edit="editing = $event" @remove="onRemove" /></div></div>
</template>
