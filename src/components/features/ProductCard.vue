<script setup>
import { computed } from 'vue'
import BaseButton from '../common/BaseButton.vue'
import { formatRupiah } from '../../utils/storage'
const props = defineProps({ product: { type: Object, required: true }, categoryName: String, showAdd: Boolean })
defineEmits(['add'])
const hue = computed(() => (props.product.categoryId * 67 + 120) % 360)
const initials = computed(() => props.product.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase())
</script>
<template>
  <div class="card item">
      <div v-if="product.image" class="tile photo"><img :src="product.image" :alt="`Gambar ${product.name}`" /><small>{{ categoryName }}</small></div>
      <div v-else class="tile" :style="{ background: `hsl(${hue} 38% 91%)`, color: `hsl(${hue} 42% 28%)` }"><span>{{ initials }}</span><small>{{ categoryName }}</small></div>
      <div class="item-info"><h2>{{ product.name }}</h2><div class="foot"><strong>{{ formatRupiah(product.price) }}</strong><span :class="['stock', product.stock < 10 ? 'low' : '']">Stok {{ product.stock }}</span></div></div>
      <BaseButton v-if="showAdd" class="add" :disabled="product.stock < 1" @click="$emit('add', product)"><span>+</span>{{ product.stock < 1 ? 'Stok habis' : 'Tambah' }}</BaseButton>
  </div>
</template>
<style scoped>
.item{margin:0;padding:12px;display:flex;flex-direction:column;gap:10px;border-radius:16px;transition:.18s ease}.item:hover{transform:translateY(-2px);box-shadow:0 12px 28px #1f413710;border-color:#cfd9d2}
h2{margin:0;font-size:15px}.tile{height:150px;border-radius:12px;position:relative;display:flex;align-items:flex-end;overflow:hidden;padding:12px}.tile>span{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:31px;font-weight:800;letter-spacing:-.04em}.tile small{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.tile.photo{padding:0;background:#e8ede8}.photo img{width:100%;height:100%;object-fit:cover}.photo small{position:absolute;bottom:9px;left:9px;padding:5px 8px;border-radius:20px;background:#ffffffdf;color:var(--moss-dark);backdrop-filter:blur(4px)}.item-info{display:flex;flex-direction:column;gap:8px}.foot{display:flex;justify-content:space-between;align-items:center}.foot strong{font-size:14px}.stock{font-size:10px;color:#587067;background:#edf4ef;padding:3px 7px;border-radius:20px}.stock.low{color:#9a6817;background:#fff4d8}.add{margin-top:auto;width:100%;display:flex;justify-content:center;align-items:center;gap:7px}.add span{font-size:18px;line-height:14px}
</style>
