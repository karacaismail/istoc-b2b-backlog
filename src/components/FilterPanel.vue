<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import type { Filters, TaskSet } from '../types'

defineProps<{ filters: Filters; sets: TaskSet[]; statusOptions: string[]; typeOptions: string[] }>()
const emit = defineEmits<{ reset: [] }>()
const moscowOptions = ['Must', 'Should', 'Could', "Won't/şimdilik"]

function toggle(list: string[], value: string) {
  const i = list.indexOf(value)
  if (i >= 0) list.splice(i, 1)
  else list.push(value)
}
</script>

<template>
  <section aria-label="Filtreler" class="space-y-5">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold">Filtreler</h2>
      <button class="btn btn-ghost touch gap-2" @click="emit('reset')"><RotateCcw :size="18" /> Sıfırla</button>
    </div>
    <label class="form-control block">
      <span class="label-text mb-2 block font-semibold">Küme</span>
      <select class="select select-bordered min-h-12 w-full" :value="filters.setIds[0] || ''" @change="filters.setIds = ($event.target as HTMLSelectElement).value ? [($event.target as HTMLSelectElement).value] : []">
        <option value="">Tüm kümeler</option>
        <option v-for="set in sets" :key="set.id" :value="set.id">{{ set.id }} · {{ set.name || set.title }}</option>
      </select>
    </label>
    <fieldset>
      <legend class="mb-2 font-semibold">Öncelik</legend>
      <div class="grid grid-cols-2 gap-2">
        <label v-for="value in ['P0','P1','P2','P3']" :key="value" class="label min-h-11 cursor-pointer justify-start gap-3 rounded-lg border border-base-300 px-3">
          <input type="checkbox" class="checkbox checkbox-sm" :checked="filters.priorities.includes(value)" @change="toggle(filters.priorities, value)" />
          <span>{{ value }}</span>
        </label>
      </div>
    </fieldset>
    <fieldset>
      <legend class="mb-2 font-semibold">Durum</legend>
      <div class="space-y-1">
        <label v-for="value in statusOptions" :key="value" class="label min-h-11 cursor-pointer justify-start gap-3 rounded-lg px-2 hover:bg-base-200">
          <input type="checkbox" class="checkbox checkbox-sm" :checked="filters.statuses.includes(value)" @change="toggle(filters.statuses, value)" />
          <span>{{ value }}</span>
        </label>
      </div>
    </fieldset>
    <fieldset>
      <legend class="mb-2 font-semibold">Keşif kaynağı</legend>
      <div class="space-y-1">
        <label v-for="value in ['Önceden işlenen','Arşiv taramasında tespit edilen']" :key="value" class="label min-h-11 cursor-pointer justify-start gap-3 rounded-lg px-2 hover:bg-base-200">
          <input type="checkbox" class="checkbox checkbox-sm" :checked="filters.discovery.includes(value)" @change="toggle(filters.discovery, value)" />
          <span>{{ value }}</span>
        </label>
      </div>
    </fieldset>
    <fieldset>
      <legend class="mb-2 font-semibold">Görev türü</legend>
      <div class="max-h-56 space-y-1 overflow-y-auto pr-1 scrollbar-thin">
        <label v-for="value in typeOptions" :key="value" class="label min-h-11 cursor-pointer justify-start gap-3 rounded-lg px-2 hover:bg-base-200">
          <input type="checkbox" class="checkbox checkbox-sm" :checked="filters.types.includes(value)" @change="toggle(filters.types, value)" />
          <span>{{ value }}</span>
        </label>
      </div>
    </fieldset>
    <fieldset>
      <legend class="mb-2 font-semibold">MoSCoW</legend>
      <div class="space-y-1">
        <label v-for="value in moscowOptions" :key="value" class="label min-h-11 cursor-pointer justify-start gap-3 rounded-lg px-2 hover:bg-base-200">
          <input type="checkbox" class="checkbox checkbox-sm" :checked="filters.moscow.includes(value)" @change="toggle(filters.moscow, value)" />
          <span>{{ value }}</span>
        </label>
      </div>
    </fieldset>
    <fieldset>
      <legend class="mb-2 font-semibold">Eisenhower</legend>
      <div class="space-y-1">
        <label v-for="value in ['Yap','Planla','Devret','Ele/sonra']" :key="value" class="label min-h-11 cursor-pointer justify-start gap-3 rounded-lg px-2 hover:bg-base-200">
          <input type="checkbox" class="checkbox checkbox-sm" :checked="filters.eisenhower.includes(value)" @change="toggle(filters.eisenhower, value)" />
          <span>{{ value }}</span>
        </label>
      </div>
    </fieldset>
    <label class="form-control block">
      <span class="label-text mb-2 block font-semibold">En az risk: {{ filters.riskMin }}/25</span>
      <input v-model.number="filters.riskMin" type="range" min="0" max="25" step="1" class="range range-accent" />
    </label>
    <div class="space-y-1">
      <label class="label min-h-11 cursor-pointer justify-start gap-3"><input v-model="filters.onlyStarred" type="checkbox" class="toggle toggle-sm" /> Yalnız yıldızlı</label>
      <label class="label min-h-11 cursor-pointer justify-start gap-3"><input v-model="filters.onlySelected" type="checkbox" class="toggle toggle-sm" /> Yalnız seçili</label>
      <label class="label min-h-11 cursor-pointer justify-start gap-3"><input v-model="filters.showHidden" type="checkbox" class="toggle toggle-sm" /> Kaldırılanları göster</label>
    </div>
  </section>
</template>
