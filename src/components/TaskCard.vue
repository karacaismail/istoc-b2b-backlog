<script setup lang="ts">
import { CheckSquare, Copy, EyeOff, Star, Users } from 'lucide-vue-next'
import { effortLabel, riskLabel, scopeLabel } from '../planning'
import type { Task, TaskOverride } from '../types'

defineProps<{ task: Task & { workspace: TaskOverride; effectiveStatus: string; effectivePriority: string }; setName: string }>()
const emit = defineEmits<{ open: [task: Task]; copy: [task: Task]; update: [id: string, patch: Partial<TaskOverride>] }>()

const priorityClass: Record<string, string> = {
  P0: 'badge-error', P1: 'badge-warning', P2: 'badge-info', P3: 'badge-ghost', 'İptal': 'badge-neutral',
}
</script>

<template>
  <article class="task-card rounded-2xl border border-base-300 bg-base-100 shadow-sm">
    <div class="space-y-4 p-4 sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <button class="min-w-0 flex-1 text-left" @click="emit('open', task)">
          <span class="mono text-base font-bold text-accent" translate="no">{{ task.id }}</span>
          <h3 class="mt-1 break-words text-lg font-bold leading-snug text-balance">{{ task.title }}</h3>
        </button>
        <button class="btn btn-ghost btn-square touch" :aria-label="task.workspace.starred ? 'Yıldızı kaldır' : 'Yıldızla'" @click="emit('update', task.id, { starred: !task.workspace.starred })">
          <Star :size="20" :class="task.workspace.starred ? 'fill-warning text-warning' : ''" />
        </button>
      </div>
      <p class="line-clamp-2 text-base text-base-content/75">{{ task.user_story?.text || task.technical_objective || task.source_wbs || 'Tanım görev ayrıntısında.' }}</p>
      <dl class="grid grid-cols-3 gap-2 rounded-xl bg-base-200 p-3">
        <div><dt>Öncelik</dt><dd class="mt-1 font-bold">{{ task.effectivePriority }}</dd></div>
        <div><dt>Risk</dt><dd class="mt-1 font-bold">{{ riskLabel(task.planning.risk_score) }}</dd></div>
        <div><dt>Efor</dt><dd class="mt-1 font-bold">{{ effortLabel(task.planning.effort_points) }}</dd></div>
      </dl>
      <div class="flex flex-wrap gap-2"><span class="metric-pill">{{ scopeLabel(task.planning.scope) }}</span><span v-for="label in task.change_labels" :key="label" class="metric-pill">{{ label }}</span><span v-for="label in task.discovery_labels" :key="label" class="metric-pill">{{ label }}</span></div>
      <div class="flex flex-wrap items-center gap-3 border-t border-base-300 pt-3 text-base">
        <button class="min-h-11 min-w-0 truncate text-left font-semibold text-accent underline decoration-2 underline-offset-4" @click="emit('open', task)">{{ setName }}</button>
        <div class="flex items-center gap-1">
          <span class="inline-flex min-h-11 items-center gap-1" :aria-label="`${task.acceptance_criteria?.length || 0} kabul kriteri`"><CheckSquare :size="18" aria-hidden="true" />{{ task.acceptance_criteria?.length || 0 }}</span>
          <span class="inline-flex min-h-11 items-center gap-1" :aria-label="`${task.planning.dependent_count} bağımlı görev`"><Users :size="18" aria-hidden="true" />{{ task.planning.dependent_count }}</span>
          <button class="btn btn-ghost btn-square touch" aria-label="Görevi kopyala" @click="emit('copy', task)"><Copy :size="19" /></button>
          <button class="btn btn-ghost btn-square touch text-error" aria-label="Görevi görünümden kaldır" @click="emit('update', task.id, { hidden: true })"><EyeOff :size="19" /></button>
        </div>
      </div>
    </div>
  </article>
</template>
