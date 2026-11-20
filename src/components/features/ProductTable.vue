<script setup>
import BaseButton from '../common/BaseButton.vue'
import { formatRupiah } from '../../utils/storage'
defineProps({ products: Array, categoryName: Function })
defineEmits(['edit', 'remove'])
</script>
<template>
  <div class="table-wrap"><table><thead><tr><th>Gambar</th><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th /></tr></thead>
    <tbody><tr v-for="p in products" :key="p.id"><td><div class="thumb"><img v-if="p.image" :src="p.image" :alt="`Gambar ${p.name}`" /><span v-else>{{ p.name.slice(0, 1).toUpperCase() }}</span></div></td><td>{{ p.name }}</td><td>{{ categoryName(p.categoryId) }}</td>
      <td>{{ formatRupiah(p.price) }}</td><td>{{ p.stock }}</td>
      <td class="row"><BaseButton variant="ghost" @click="$emit('edit', p)">Ubah</BaseButton>
        <BaseButton variant="danger" @click="$emit('remove', p.id)">Hapus</BaseButton></td></tr></tbody></table></div>
</template>
<style scoped>.thumb{width:44px;height:40px;border-radius:8px;display:grid;place-items:center;overflow:hidden;background:var(--mint);color:var(--moss);font-weight:800}.thumb img{width:100%;height:100%;object-fit:cover}</style>
