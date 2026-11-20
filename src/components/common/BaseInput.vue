<script setup>
defineProps({ modelValue: [String, Number], label: String, type: { type: String, default: 'text' }, error: String, placeholder: String, autocomplete: String })
defineEmits(['update:modelValue'])
</script>
<template>
  <label class="field"><span>{{ label }}</span>
    <input :type="type" :value="modelValue" :placeholder="placeholder" :autocomplete="autocomplete" @input="$emit('update:modelValue', $event.target.value)" />
    <small v-if="error" class="error">{{ error }}</small>
  </label>
</template>
<style scoped>
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}.field span{font-weight:600;font-size:13px}
input{padding:11px 14px;border:1px solid var(--line);border-radius:10px;font:inherit;background:#FBFCFB;transition:border-color .15s,box-shadow .15s}
input:focus{outline:0;border-color:var(--moss);box-shadow:0 0 0 3px var(--mint)}
</style>
