<script setup>
defineProps({ title: { type: String, required: true }, value: { type: [String, Number], required: true } })
</script>
<template><div class="card stat"><div class="muted">{{ title }}</div><div class="val">{{ value }}</div></div></template>
<style scoped>.stat{margin:0;position:relative;overflow:hidden;padding:22px;border-color:#e6ebe6;transition:transform .18s,box-shadow .18s}.stat:hover{transform:translateY(-3px);box-shadow:0 12px 26px #20372a10}.stat:after{content:"";position:absolute;right:-21px;top:-25px;width:82px;height:82px;border-radius:50%;background:var(--mint);opacity:.65}.stat .muted{position:relative;z-index:1;font-size:12px;font-weight:600}.val{position:relative;z-index:1;font-size:27px;font-weight:800;letter-spacing:-.04em;margin-top:9px;color:var(--moss-dark)}</style>
