<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Clipboard, EyeOff, Plus, Trash2, X } from 'lucide-vue-next'
import type { Priority, Task, TaskOverride } from '../types'

const props = defineProps<{
  task: (Task & { workspace: TaskOverride; effectiveStatus: string; effectivePriority: string }) | null
  setName: string
  childTasks: Task[]
}>()
const emit = defineEmits<{
  close: []
  update: [id: string, patch: Partial<TaskOverride>]
  hideChildren: [task: Task]
  copy: [task: Task]
  openRelated: [id: string]
}>()
const checklistText = ref('')
const priorities: Priority[] = ['P0', 'P1', 'P2', 'P3']
const statuses = ['backlog', 'hazır', 'devam ediyor', 'incelemede', 'tamamlandı', 'beklemede']
const checklist = computed(() => props.task?.workspace.checklist || [])

function addChecklist() {
  if (!props.task || !checklistText.value.trim()) return
  emit('update', props.task.id, { checklist: [...checklist.value, { id: crypto.randomUUID(), text: checklistText.value.trim(), done: false }] })
  checklistText.value = ''
}
</script>

<template>
  <div v-if="task" class="fixed inset-0 z-[100]" role="dialog" aria-modal="true" :aria-labelledby="`title-${task.id}`">
    <button class="absolute inset-0 bg-black/55" aria-label="Görev ayrıntısını kapat" @click="emit('close')"></button>
    <section class="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto rounded-t-2xl bg-base-100 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[min(48rem,92vw)] md:rounded-none scrollbar-thin">
      <header class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-base-300 bg-base-100/95 p-4 backdrop-blur md:p-6">
        <div class="min-w-0">
          <div class="mono text-base font-semibold text-accent">{{ task.id }} · r{{ task.revision }}</div>
          <h2 :id="`title-${task.id}`" class="mt-1 text-xl font-bold leading-snug md:text-2xl">{{ task.title }}</h2>
          <p class="mt-1 text-base text-base-content/70">{{ setName }}</p>
          <div class="mt-2 flex flex-wrap gap-2"><span v-for="label in task.discovery_labels" :key="label" class="badge badge-accent badge-outline">{{ label }}</span></div>
        </div>
        <button class="btn btn-ghost btn-square touch shrink-0" aria-label="Kapat" @click="emit('close')"><X /></button>
      </header>

      <div class="space-y-7 p-4 pb-24 md:p-6">
        <div class="grid gap-5 sm:grid-cols-2">
          <fieldset><legend class="mb-2 font-bold">Durum</legend><div class="grid grid-cols-2 gap-2">
            <button v-for="status in statuses" :key="status" class="choice-chip min-h-12 rounded-xl border-2 px-3 text-left font-semibold" :class="task.effectiveStatus === status ? 'border-accent bg-accent/10 text-accent' : 'border-base-300 bg-base-100'" :aria-pressed="task.effectiveStatus === status" @click="emit('update', task.id, { status })">{{ status }}</button>
          </div></fieldset>
          <fieldset><legend class="mb-2 font-bold">Öncelik</legend><div class="grid grid-cols-2 gap-2">
            <button v-for="value in priorities" :key="value" class="choice-chip min-h-12 rounded-xl border-2 px-3 font-bold" :class="task.effectivePriority === value ? 'border-primary bg-primary text-primary-content' : 'border-base-300 bg-base-100'" :aria-pressed="task.effectivePriority === value" @click="emit('update', task.id, { priority: value })">{{ value }}</button>
          </div></fieldset>
          <label class="form-control block"><span class="label-text mb-2 block font-semibold">Sorumlu</span>
            <input name="assignee" autocomplete="off" class="input input-bordered min-h-12 w-full" :value="task.workspace.assignee || ''" placeholder="Örnek: Ahmet…" @change="emit('update', task.id, { assignee: ($event.target as HTMLInputElement).value })" />
          </label>
          <label class="form-control block"><span class="label-text mb-2 block font-semibold">Hedef tarih</span>
            <input name="due-date" autocomplete="off" type="date" class="input input-bordered min-h-12 w-full" :value="task.workspace.dueDate || task.planning.target_date" @change="emit('update', task.id, { dueDate: ($event.target as HTMLInputElement).value })" />
          </label>
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="stat rounded-xl border border-base-300 p-3"><div class="stat-title text-base">Puan</div><div class="stat-value text-2xl">{{ task.planning.priority_score }}</div></div>
          <div class="stat rounded-xl border border-base-300 p-3"><div class="stat-title text-base">Risk</div><div class="stat-value text-2xl">{{ task.planning.risk_score }}</div></div>
          <div class="stat rounded-xl border border-base-300 p-3"><div class="stat-title text-base">Efor</div><div class="stat-value text-2xl">{{ task.workspace.storyPoints || task.planning.effort_points }}</div></div>
          <div class="stat rounded-xl border border-base-300 p-3"><div class="stat-title text-base">Etkilediği</div><div class="stat-value text-2xl">{{ task.planning.dependent_count }}</div></div>
        </div>

        <section v-if="task.user_story?.text || task.technical_objective">
          <h3 class="mb-2 text-lg font-bold">Tanım ve amaç</h3>
          <p class="max-w-prose whitespace-pre-wrap leading-relaxed">{{ task.user_story?.text || task.technical_objective }}</p>
        </section>

        <section>
          <h3 class="mb-2 text-lg font-bold">Planlama gerekçesi</h3>
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-outline">{{ task.planning.moscow }}</span>
            <span class="badge badge-outline">{{ task.planning.horizon }}</span>
            <span class="badge badge-outline">{{ task.planning.eisenhower }}</span>
          </div>
          <ul class="mt-3 list-disc space-y-1 pl-6"><li v-for="reason in task.planning.rationale" :key="reason">{{ reason }}</li></ul>
        </section>

        <section v-if="task.acceptance_criteria?.length">
          <h3 class="mb-3 text-lg font-bold">Kabul kriterleri · {{ task.acceptance_criteria.length }}</h3>
          <ol class="space-y-2">
            <li v-for="criterion in task.acceptance_criteria" :key="criterion.id" class="flex gap-3 rounded-lg border border-base-300 p-3">
              <Check :size="20" class="mt-0.5 shrink-0 text-success" /><span>{{ criterion.text }}</span>
            </li>
          </ol>
        </section>

        <section>
          <h3 class="mb-3 text-lg font-bold">Kontrol listesi</h3>
          <div class="space-y-2">
            <label v-for="item in checklist" :key="item.id" class="flex min-h-11 items-center gap-3 rounded-lg border border-base-300 px-3">
              <input type="checkbox" class="checkbox checkbox-sm" :checked="item.done" @change="emit('update', task.id, { checklist: checklist.map(x => x.id === item.id ? { ...x, done: !x.done } : x) })" />
              <span :class="item.done ? 'line-through opacity-60' : ''">{{ item.text }}</span>
              <button class="btn btn-ghost btn-square btn-sm ml-auto" aria-label="Kontrol maddesini sil" @click="emit('update', task.id, { checklist: checklist.filter(x => x.id !== item.id) })"><Trash2 :size="17" /></button>
            </label>
          </div>
          <div class="mt-2 flex gap-2">
            <input v-model="checklistText" class="input input-bordered min-h-12 min-w-0 flex-1" placeholder="Yeni kontrol maddesi" @keyup.enter="addChecklist" />
            <button class="btn btn-neutral touch" aria-label="Kontrol maddesi ekle" @click="addChecklist"><Plus /></button>
          </div>
        </section>

        <section>
          <label class="form-control block"><span class="label-text mb-2 block text-lg font-bold">Notlar</span>
            <textarea class="textarea textarea-bordered min-h-32 w-full text-base" :value="task.workspace.notes || ''" placeholder="Karar, yorum veya takip notu…" @change="emit('update', task.id, { notes: ($event.target as HTMLTextAreaElement).value })"></textarea>
          </label>
        </section>

        <section v-if="task.relationships?.length">
          <h3 class="mb-3 text-lg font-bold">İlişkiler · {{ task.relationships.length }}</h3>
          <div class="space-y-2">
            <button v-for="rel in task.relationships" :key="`${rel.type}-${rel.target_id}`" class="flex min-h-12 w-full items-center gap-3 rounded-lg border border-base-300 p-3 text-left hover:bg-base-200" @click="emit('openRelated', rel.target_id)">
              <span class="badge badge-ghost shrink-0">{{ rel.type }}</span><span class="mono text-accent">{{ rel.target_id }}</span><span class="line-clamp-2">{{ rel.target_title }}</span>
            </button>
          </div>
        </section>

        <section v-if="childTasks.length" class="rounded-xl border border-warning/50 bg-warning/10 p-4">
          <h3 class="text-lg font-bold">Alt görev yönetimi · {{ childTasks.length }}</h3>
          <p class="mt-1 leading-relaxed">Bu ana görevin bütün alt görevlerini çalışma görünümünden tek işlemle kaldırabilirsiniz. İşlem geri alınabilir ve kanonik JSON’u değiştirmez.</p>
          <button class="btn btn-warning mt-3 min-h-12 gap-2" @click="emit('hideChildren', task)"><EyeOff :size="19" /> Alt görevleri kaldır</button>
        </section>
      </div>

      <footer class="sticky bottom-0 flex gap-2 border-t border-base-300 bg-base-100/95 p-4 backdrop-blur sticky-safe">
        <button class="btn btn-primary min-h-12 flex-1 gap-2" @click="emit('copy', task)"><Clipboard :size="19" /> Görevi kopyala</button>
        <button class="btn btn-error btn-outline min-h-12 gap-2" @click="emit('update', task.id, { hidden: true }); emit('close')"><EyeOff :size="19" /> Kaldır</button>
      </footer>
    </section>
  </div>
</template>
