<script setup lang="ts">
import { ChevronDown, RotateCcw } from 'lucide-vue-next'
import { scopeLabel, phaseLabel, UNKNOWN } from '../planning'
import type { Filters, TaskSet } from '../types'

defineProps<{ filters: Filters; sets: TaskSet[]; statusOptions: string[]; typeOptions: string[] }>()
const emit = defineEmits<{ reset: [] }>()
const moscowOptions = ['Must', 'Should', 'Could', "Won't/şimdilik", UNKNOWN]

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
        <button v-for="set in sets" :key="set.id" class="filter-option text-left" :aria-pressed="filters.setIds.includes(set.id)" @click="toggle(filters.setIds,set.id)"><span class="mono mr-2" translate="no">{{ set.id }}</span>{{ set.name || set.title }}</button>
      </div>
    </details>

    <details class="filter-group rounded-xl border border-base-300 bg-base-100" open><summary class="filter-summary"><span>Öncelik <span v-if="filters.priorities.length" class="count-dot">{{ filters.priorities.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid"><button v-for="value in ['P0','P1','P2','P3']" :key="value" class="filter-option" :aria-pressed="filters.priorities.includes(value)" @click="toggle(filters.priorities,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>Durum <span v-if="filters.statuses.length" class="count-dot">{{ filters.statuses.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid"><button v-for="value in statusOptions" :key="value" class="filter-option" :aria-pressed="filters.statuses.includes(value)" @click="toggle(filters.statuses,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>Keşif kaynağı <span v-if="filters.discovery.length" class="count-dot">{{ filters.discovery.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="grid gap-2 p-3"><button v-for="value in ['Önceden işlenen','Arşiv taramasında tespit edilen','Tamamlama denetiminde eklenen']" :key="value" class="filter-option text-left" :aria-pressed="filters.discovery.includes(value)" @click="toggle(filters.discovery,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>Görev türü <span v-if="filters.types.length" class="count-dot">{{ filters.types.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid max-h-72 overflow-y-auto"><button v-for="value in typeOptions" :key="value" class="filter-option break-all" :aria-pressed="filters.types.includes(value)" @click="toggle(filters.types,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>MoSCoW <span v-if="filters.moscow.length" class="count-dot">{{ filters.moscow.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid"><button v-for="value in moscowOptions" :key="value" class="filter-option" :aria-pressed="filters.moscow.includes(value)" @click="toggle(filters.moscow,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary"><span>Eisenhower <span v-if="filters.eisenhower.length" class="count-dot">{{ filters.eisenhower.length }}</span></span><ChevronDown :size="20" aria-hidden="true" /></summary><div class="filter-grid"><button v-for="value in ['Yap','Planla','Devret','Ele/sonra',UNKNOWN]" :key="value" class="filter-option" :aria-pressed="filters.eisenhower.includes(value)" @click="toggle(filters.eisenhower,value)">{{ value }}</button></div></details>

    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary">Denetimdeki değişiklik<ChevronDown :size="20" /></summary><div class="grid gap-2 p-3"><button v-for="value in ['İlişki tamamlandı','Alt işlere ayrıldı','Yeni ortak iş','Karar gerektiren aday','Kapsam tamamlandı','Kayıt uzlaştırıldı','Planlama düzeltildi']" :key="value" class="filter-option text-left" :aria-pressed="filters.changes.includes(value)" @click="toggle(filters.changes,value)">{{ value }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary">Kapsam<ChevronDown :size="20" /></summary><div class="grid gap-2 p-3"><button v-for="value in ['delivery','decision','historical']" :key="value" class="filter-option" :aria-pressed="filters.scopes.includes(value)" @click="toggle(filters.scopes,value)">{{ scopeLabel(value) }}</button></div></details>
    <details class="filter-group rounded-xl border border-base-300 bg-base-100"><summary class="filter-summary">Faz<ChevronDown :size="20" /></summary><div class="filter-grid"><button v-for="value in ['mvp','post_mvp','research','unspecified']" :key="value" class="filter-option" :aria-pressed="filters.phases.includes(value)" @click="toggle(filters.phases,value)">{{ phaseLabel(value) }}</button></div></details>
    <button v-if="filters.riskCell" class="btn btn-outline min-h-12 w-full" @click="filters.riskCell=''">Risk hücresi {{ filters.riskCell }} · Temizle</button>
    <label class="switch-row"><input v-model="filters.riskUnknown" type="checkbox" class="toggle" /> Risk değerlendirmesi bekleyen</label>
    <label class="switch-row"><input v-model="filters.unestimated" type="checkbox" class="toggle" /> Efor tahmini bekleyen</label>
    <label class="switch-row"><input v-model="filters.showArchived" type="checkbox" class="toggle" /> Geçmiş kayıtları da göster</label>
    <label class="block rounded-xl border border-base-300 bg-base-100 p-4"><span class="mb-3 flex justify-between gap-3 font-bold"><span>En az risk</span><span>{{ filters.riskMin }}/25</span></span><input v-model.number="filters.riskMin" aria-label="En az risk puanı" type="range" min="0" max="25" step="1" class="range range-accent" /></label>
    <div class="grid gap-2"><label class="switch-row"><input v-model="filters.onlyStarred" type="checkbox" class="toggle" /> Yalnız yıldızlı</label><label class="switch-row"><input v-model="filters.onlySelected" type="checkbox" class="toggle" /> Yalnız seçili</label><label class="switch-row"><input v-model="filters.showHidden" type="checkbox" class="toggle" /> Kaldırılanları göster</label></div>
  </section>
</template>
