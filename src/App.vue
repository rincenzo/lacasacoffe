<script setup>
import AppNavbar from './components/common/AppNavbar.vue'
import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
</script>
<template>
  <div :class="{ shell: auth.isLoggedIn || $route.meta.public }"><AppNavbar /><main><RouterView /></main></div>
</template>
<style>
.shell{display:grid;grid-template-columns:248px 1fr;min-height:100vh}.shell main{min-width:0;min-height:100vh}
@media(max-width:860px){.shell{grid-template-columns:1fr}}
</style>
