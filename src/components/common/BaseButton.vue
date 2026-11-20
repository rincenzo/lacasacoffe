<script setup>
defineProps({ variant: { type: String, default: 'primary' }, type: { type: String, default: 'button' }, disabled: Boolean })
defineEmits(['click'])
</script>
<template><button :type="type" :disabled="disabled" :class="['btn', variant]" @click="$emit('click', $event)"><slot /></button></template>
<style scoped>
.btn{border:0;border-radius:11px;padding:10px 16px;cursor:pointer;font:inherit;font-weight:700;color:#fff;transition:filter .15s,transform .15s,box-shadow .15s;box-shadow:0 3px 8px #18372f12}
.btn:hover:not(:disabled){filter:brightness(1.06);transform:translateY(-1px);box-shadow:0 6px 14px #18372f1c}.btn:active:not(:disabled){transform:translateY(0)}
.primary{background:var(--moss)}.success{background:var(--success)}.danger{background:#FBEAE8;color:var(--danger)}.ghost{background:var(--mint);color:var(--moss-dark)}
.btn:disabled{opacity:.45;cursor:not-allowed}
</style>
