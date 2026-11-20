<script setup>
import { computed } from 'vue'
const props = defineProps({ status: { type: String, required: true } })
const MAP = { lunas: ['Lunas', 'ok'], belum_bayar: ['Belum bayar', 'wait'], diproses: ['Diproses', 'wait'], selesai: ['Selesai', 'ok'], batal: ['Batal', 'bad'] }
const view = computed(() => MAP[props.status] ?? [props.status, 'wait'])
</script>
<template><span :class="['badge', view[1]]">{{ view[0] }}</span></template>
<style scoped>
.badge{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600}
.badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor}
.ok{background:#E3F3EA;color:var(--success)}.wait{background:#FBF1DC;color:var(--warning)}.bad{background:#FBEAE8;color:var(--danger)}
</style>
