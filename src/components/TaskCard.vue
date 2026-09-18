<script setup lang="ts">
import { CheckSquare, Copy, EyeOff, Star, Users } from 'lucide-vue-next'
import type { Task, TaskOverride } from '../types'

defineProps<{ task: Task & { workspace: TaskOverride; effectiveStatus: string; effectivePriority: string }; setName: string }>()
const emit = defineEmits<{ open: [task: Task]; copy: [task: Task]; update: [id: string, patch: Partial<TaskOverride>] }>()

const priorityClass: Record<string, string> = {
  P0: 'badge-error', P1: 'badge-warning', P2: 'badge-info', P3: 'badge-ghost', 'İptal': 'badge-neutral',
}
</script>

<template>
  <article class="card border border-base-300 bg-base-100 shadow-sm transition-shadow duration-200 hover:shadow-md">
    <div class="card-body gap-3 p-4">
      <div class="flex items-start justify-between gap-3">
        <button class="min-w-0 flex-1 text-left" @click="emit('open', task)">
          <span class="mono text-base font-semibold text-accent">{{ task.id }}</span>
          <h3 class="mt-1 text-lg font-semibold leading-snug">{{ task.title }}</h3>
        </button>
        <button class="btn btn-ghost btn-square touch" :aria-label="task.workspace.starred ? 'Yıldızı kaldır' : 'Yıldızla'" @click="emit('update', task.id, { starred: !task.workspace.starred })">
          <Star :size="20" :class="task.workspace.starred ? 'fill-warning text-warning' : ''" />
        </button>
      </div>
      <p class="line-clamp-2 text-base text-base-content/75">{{ task.user_story?.text || task.technical_objective || task.source_wbs || 'Tanım görev ayrıntısında.' }}</p>
      <div class="flex flex-wrap gap-2">
        <span class="badge" :class="priorityClass[task.effectivePriority]">{{ task.effectivePriority }} · {{ task.planning.priority_score }}</span>
        <span class="badge badge-outline">{{ task.planning.moscow }}</span>
        <span class="badge badge-outline">{{ task.planning.eisenhower }}</span>
        <span class="badge badge-ghost">Risk {{ task.planning.risk_score }}/25</span>
        <span v-for="label in task.discovery_labels" :key="label" class="badge badge-accent badge-outline">{{ label }}</span>
      </div>
      <div class="flex items-center justify-between gap-3 border-t border-base-300 pt-3 text-base">
        <button class="min-w-0 truncate text-left text-base-content/70 hover:text-accent" @click="emit('open', task)">{{ setName }}</button>
        <div class="flex items-center gap-1">
          <span class="inline-flex items-center gap-1" :title="`${task.acceptance_criteria?.length || 0} kabul kriteri`"><CheckSquare :size="18" />{{ task.acceptance_criteria?.length || 0 }}</span>
          <span class="inline-flex items-center gap-1" :title="`${task.planning.dependent_count} bağımlı görev`"><Users :size="18" />{{ task.planning.dependent_count }}</span>
          <button class="btn btn-ghost btn-square touch" aria-label="Görevi kopyala" @click="emit('copy', task)"><Copy :size="19" /></button>
          <button class="btn btn-ghost btn-square touch text-error" aria-label="Görevi görünümden kaldır" @click="emit('update', task.id, { hidden: true })"><EyeOff :size="19" /></button>
        </div>
      </div>
    </div>
  </article>
</template>
