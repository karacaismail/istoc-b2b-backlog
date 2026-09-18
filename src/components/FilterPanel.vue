<script setup lang="ts">
import { ChevronDown, RotateCcw } from 'lucide-vue-next'
import type { Filters, TaskSet } from '../types'

defineProps<{ filters: Filters; sets: TaskSet[]; statusOptions: string[]; typeOptions: string[] }>()
const emit = defineEmits<{ reset: [] }>()
const moscowOptions = ['Must', 'Should', 'Could', "Won't/şimdilik"]

function toggle(list: string[], value: string) {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
  else list.push(value)
}
</script>

<template>
  <section aria-label="Filtreler" class="space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div><h2 class="text-xl font-bold">Filtreler</h2><p class="text-base text-base-content/70">Birden fazla seçim yapabilirsiniz.</p></div>
      <button class="btn btn-ghost touch gap-2" @click="emit('reset')"><RotateCcw :size="18" aria-hidden="true" /> Temizle</button>
    </div>

    <details class="filter-group rounded-xl border border-base-300 bg-base-100" open>
      <summary class="filter-summary"><span>Küme <span v-if="filters.setIds.length" class="count-dot">{{ filters.setIds.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary>
      <div class="max-h-72 space-y-2 overflow-y-auto border-t border-base-300 p-3 scrollbar-thin">
        <button class="filter-option" :aria-pressed="!filters.setIds.length" @click="filters.setIds=[]">Tüm kümeler</button>
        <button v-for="set in sets" :key="set.id" class="filter-option text-left" :aria-pressed="filters.setIds.includes(set.id)" @click="filters.setIds = filters.setIds.includes(set.id) ? [] : [set.id]"><span class="mono mr-2" translate="no">{{ set.id }}</span>{{ set.name || set.title }}</button>
      </div>
    </details>

    <details class="filter-group rounded-xl border border-base-300 bg-base-100" open><summary class="filter-summary"><span>Öncelik <span v-if="filters.priorities.length" class="count-dot">{{ filters.priorities.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid"><button v-for="value in ['P0','P1','P2','P3']" :key="value" class="filter-option" :aria-pressed="filters.priorities.includes(value)" @click="toggle(filters.priorities,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>Durum <span v-if="filters.statuses.length" class="count-dot">{{ filters.statuses.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid"><button v-for="value in statusOptions" :key="value" class="filter-option" :aria-pressed="filters.statuses.includes(value)" @click="toggle(filters.statuses,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>Keşif kaynağı <span v-if="filters.discovery.length" class="count-dot">{{ filters.discovery.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="grid gap-2 p-3"><button v-for="value in ['Önceden işlenen','Arşiv taramasında tespit edilen']" :key="value" class="filter-option text-left" :aria-pressed="filters.discovery.includes(value)" @click="toggle(filters.discovery,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>Görev türü <span v-if="filters.types.length" class="count-dot">{{ filters.types.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid max-h-72 overflow-y-auto"><button v-for="value in typeOptions" :key="value" class="filter-option break-all" :aria-pressed="filters.types.includes(value)" @click="toggle(filters.types,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>MoSCoW <span v-if="filters.moscow.length" class="count-dot">{{ filters.moscow.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid"><button v-for="value in moscowOptions" :key="value" class="filter-option" :aria-pressed="filters.moscow.includes(value)" @click="toggle(filters.moscow,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>Eisenhower <span v-if="filters.eisenhower.length" class="count-dot">{{ filters.eisenhower.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid"><button v-for="value in ['Yap','Planla','Devret','Ele/sonra']" :key="value" class="filter-option" :aria-pressed="filters.eisenhower.includes(value)" @click="toggle(filters.eisenhower,value)">{{ value }}</button></div></details>

    <label class="block rounded-xl border border-base-300 bg-base-100 p-4"><span class="mb-3 flex justify-between gap-3 font-bold"><span>En az risk</span><span>{{ filters.riskMin }}/25</span></span><input v-model.number="filters.riskMin" aria-label="En az risk puanı" type="range" min="0" max="25" step="1" class="range range-accent" /></label>
    <div class="grid gap-2"><label class="switch-row"><input v-model="filters.onlyStarred" type="checkbox" class="toggle" /> Yalnız yıldızlı</label><label class="switch-row"><input v-model="filters.onlySelected" type="checkbox" class="toggle" /> Yalnız seçili</label><label class="switch-row"><input v-model="filters.showHidden" type="checkbox" class="toggle" /> Kaldırılanları göster</label></div>
  </section>
</template>
