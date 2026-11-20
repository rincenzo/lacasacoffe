<script setup>
import { computed } from 'vue'
import { useProductStore } from '../stores/products'
import ProductCard from '../components/features/ProductCard.vue'
const products = useProductStore()
const categoryGroups = computed(() => products.categories
  .map(category => ({
    ...category,
    items: products.items.filter(product => product.categoryId === category.id)
  }))
  .filter(category => category.items.length))
</script>
<template>
  <div class="page catalog-page"><div class="page-head"><div><span class="catalog-kicker">DIBUAT DENGAN HATI</span><h1>Menu kami</h1><p>Pilihan kopi, non-kopi, dan makanan untuk menemani harimu.</p></div><span class="catalog-open"><i></i> Buka hari ini</span></div>
    <div class="menu-banner"><div><span>LA CASA FAVORITES</span><strong>Temukan teman untuk waktu santaimu.</strong></div><div class="menu-stamp">LC<br><small>COFFEE</small></div></div>
    <section v-for="(category, index) in categoryGroups" :key="category.id" class="menu-section">
      <div class="section-head">
        <div class="section-title"><span class="section-number">{{ String(index + 1).padStart(2, '0') }}</span><div><span class="section-kicker">PILIHAN MENU</span><h2>{{ category.name }}</h2></div></div>
        <span class="section-count">{{ category.items.length }} menu</span>
      </div>
      <div class="grid"><ProductCard v-for="p in category.items" :key="p.id" :product="p" :category-name="category.name" /></div>
    </section>
    <div v-if="!categoryGroups.length" class="card empty-menu">Menu belum tersedia.</div>
  </div>
</template>
<style scoped>
.catalog-page{max-width:1320px}.catalog-kicker{display:block;color:var(--moss);font-size:10px;font-weight:800;letter-spacing:.13em;margin-bottom:5px}.catalog-open{display:flex;align-items:center;gap:8px;padding:9px 13px;border:1px solid #e1e9e2;border-radius:30px;background:#fff;color:var(--moss);font-size:11px;font-weight:700}.catalog-open i{width:7px;height:7px;border-radius:50%;background:#48a86d;box-shadow:0 0 0 4px #48a86d18}.menu-banner{position:relative;overflow:hidden;display:flex;justify-content:space-between;align-items:center;min-height:118px;margin:-4px 0 30px;padding:22px 26px;border-radius:18px;background:linear-gradient(110deg,#ede5d7,#f4efe6 58%,#e6ede7);color:var(--moss-dark)}.menu-banner:after{content:"";position:absolute;width:220px;height:220px;right:60px;top:-150px;border:1px solid #315d5018;border-radius:50%;box-shadow:0 0 0 24px #315d5008,0 0 0 50px #315d5006}.menu-banner>div:first-child{display:flex;flex-direction:column;gap:7px;position:relative;z-index:1}.menu-banner span{font-size:9px;font-weight:800;letter-spacing:.15em;color:#72857a}.menu-banner strong{font-family:Georgia,serif;font-size:20px;font-weight:500;letter-spacing:-.02em}.menu-stamp{position:relative;z-index:1;width:60px;height:60px;flex:none;border:1px solid #315d5040;border-radius:50%;display:grid;place-content:center;text-align:center;font-weight:800;font-size:16px;line-height:1.1;transform:rotate(8deg)}.menu-stamp small{font-size:7px;letter-spacing:.12em}.menu-section+.menu-section{margin-top:30px}.section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px;padding-bottom:11px;border-bottom:1px solid #e2e8e2}.section-title{display:flex;align-items:center;gap:11px}.section-number{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:var(--mint);color:var(--moss);font-size:11px;font-weight:800}.section-kicker{display:block;color:var(--muted);font-size:8px;font-weight:800;letter-spacing:.13em;margin-bottom:1px}.section-title h2{margin:0;font-size:18px;letter-spacing:-.02em}.section-count{padding:5px 9px;border-radius:20px;background:#fff;color:var(--muted);font-size:10px;font-weight:700;border:1px solid var(--line)}.empty-menu{text-align:center;color:var(--muted);margin:0}
@media(max-width:560px){.catalog-open{font-size:0;padding:10px}.catalog-open i{margin:0}.menu-banner{min-height:100px;padding:18px}.menu-banner strong{font-size:16px;max-width:230px}.menu-stamp{width:50px;height:50px}.section-title h2{font-size:16px}}
</style>
