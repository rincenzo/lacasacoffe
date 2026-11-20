<script setup>
import BaseButton from '../common/BaseButton.vue'
import StatusBadge from '../common/StatusBadge.vue'
import { formatRupiah } from '../../utils/storage'
defineProps({ orders: Array, canEdit: Boolean })
defineEmits(['pay', 'finish', 'print'])
</script>
<template>
  <div class="table-wrap"><table><thead><tr><th>Kode</th><th>Pelanggan</th><th>Total</th><th>Bayar</th><th>Pesanan</th><th v-if="canEdit" /></tr></thead>
    <tbody><tr v-for="o in orders" :key="o.id"><td>{{ o.code }}</td><td>{{ o.customerName }}</td><td>{{ formatRupiah(o.total) }}</td>
      <td><StatusBadge :status="o.paymentStatus" /></td><td><StatusBadge :status="o.orderStatus" /></td>
      <td v-if="canEdit" class="row">
        <BaseButton v-if="o.paymentStatus !== 'lunas'" variant="success" @click="$emit('pay', o.id)">Lunas</BaseButton>
        <BaseButton v-if="o.orderStatus !== 'selesai'" variant="ghost" @click="$emit('finish', o.id)">Selesai</BaseButton>
        <BaseButton variant="ghost" @click="$emit('print', o)">Nota</BaseButton></td></tr></tbody></table></div>
</template>
