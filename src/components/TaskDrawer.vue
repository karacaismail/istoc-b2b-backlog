<script setup lang="ts">
import { computed, ref, watch, nextTick }  from 'vue'
import { Check, Clipboard, EyeOff, Plus, Trash2, X } from 'lucide-vue-next'
import { effortLabel, riskLabel, scopeLabel, phaseLabel, UNKNOWN } from '../planning'
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
const panel = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null
let previousOverflow = ''
watch(() => props.task?.id, async (id, oldId) => {
  if (id && !oldId) { previousFocus = document.activeElement as HTMLElement; previousOverflow=document.body.style.overflow; document.body.style.overflow='hidden' }
  await nextTick()
  if (id) { panel.value?.focus(); panel.value?.querySelector('[data-task-scroll]')?.scrollTo(0,0) }
  else { document.body.style.overflow=previousOverflow; previousFocus?.focus() }
})
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); emit('close'); return }
  if (event.key !== 'Tab') return
  const items = [...(panel.value?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),[tabindex="0"]') || [])].filter(el=>el.getClientRects().length)
  const first = items[0], last = items.at(-1)
  if (!first || !last) return
  if (event.shiftKey && (document.activeElement===first || document.activeElement===panel.value)) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && (document.activeElement===last || document.activeElement===panel.value)) { event.preventDefault(); first.focus() }
}
const truthChoices = [{value: null, label: 'Belirsiz'}, {value: true, label: 'Evet'}, {value: false, label: 'Hayır'}]
const checklistText = ref('')
const moscowOptions = ['Must','Should','Could',"Won't/şimdilik",UNKNOWN]
const priorities: Priority[] = ['P0', 'P1', 'P2', 'P3']
const statuses = ['backlog', 'hazır', 'devam ediyor', 'incelemede', 'tamamlandı', 'beklemede']
const checklist = computed(() => props.task?.workspace.checklist || [])

function hideChild(id:string) { emit('update',id,{hidden:true}); nextTick(()=>panel.value?.focus()) }
function hideAll() { if(props.task)emit('hideChildren',props.task); nextTick(()=>panel.value?.focus()) }

function addChecklist() {
  if (!props.task || !checklistText.value.trim()) return
  emit('update', props.task.id, { checklist: [...checklist.value, { id: crypto.randomUUID(), text: checklistText.value.trim(), done: false }] })
  checklistText.value = ''
}
</script>

<template>
  <div v-if="task" class="fixed inset-0 z-[100]" @keydown="onKey" role="dialog" aria-modal="true" :aria-labelledby="`title-${task.id}`">
    <button class="absolute inset-0 bg-black/55" aria-label="Görev ayrıntısını kapat" @click="emit('close')"></button>
    <section ref="panel" tabindex="-1" class="absolute inset-x-0 bottom-0 flex h-[92dvh] max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl bg-base-100 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-[min(48rem,92vw)] md:rounded-none scrollbar-thin">
      <header class="z-10 flex shrink-0 items-start justify-between gap-4 border-b border-base-300 bg-base-100/95 p-4 backdrop-blur md:p-6">
        <div class="min-w-0">
          <div class="mono text-base font-semibold text-accent">{{ task.id }} · r{{ task.revision }}</div>
          <h2 :id="`title-${task.id}`" class="mt-1 text-xl font-bold leading-snug md:text-2xl">{{ task.title }}</h2>
          <p class="mt-1 text-base text-base-content/70">{{ setName }}</p>
          <div class="mt-2 flex flex-wrap gap-2"><span v-for="label in task.discovery_labels" :key="label" class="badge badge-accent badge-outline">{{ label }}</span></div>
        </div>
        <button class="btn btn-ghost btn-square touch shrink-0" aria-label="Kapat" @click="emit('close')"><X /></button>
      </header>

      <div data-task-scroll class="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain p-4 md:p-6">
        <p v-if="!task.planning.active" class="rounded-xl bg-base-200 p-4">Bu geçmiş kayıt aktif teslimat planına dahil edilmez. Güncel kayda ilişkiler bölümünden ulaşabilirsiniz.</p>
        <div class="grid gap-5 sm:grid-cols-2">
          <fieldset :disabled="!task.planning.active"><legend class="mb-2 font-bold">Durum</legend><div class="grid grid-cols-2 gap-2">
            <button v-for="status in statuses" :key="status" class="choice-chip min-h-12 rounded-xl border-2 px-3 text-left font-semibold" :class="task.effectiveStatus === status ? 'border-accent bg-accent/10 text-accent' : 'border-base-300 bg-base-100'" :aria-pressed="task.effectiveStatus === status" @click="emit('update', task.id, { status })">{{ status }}</button>
          </div></fieldset>
          <fieldset :disabled="!task.planning.active"><legend class="mb-2 font-bold">Öncelik</legend><div class="grid grid-cols-2 gap-2">
            <button v-for="value in priorities" :key="value" class="choice-chip min-h-12 rounded-xl border-2 px-3 font-bold" :class="task.effectivePriority === value ? 'border-primary bg-primary text-primary-content' : 'border-base-300 bg-base-100'" :aria-pressed="task.effectivePriority === value" @click="emit('update', task.id, { priority: value })">{{ value }}</button>
          </div></fieldset>
          <label class="form-control block"><span class="label-text mb-2 block font-semibold">Sorumlu</span>
            <input name="assignee" autocomplete="off" class="input input-bordered min-h-12 w-full" :value="task.workspace.assignee ?? task.assignee ?? ''" placeholder="Örnek: Ahmet…" @change="emit('update', task.id, { assignee: ($event.target as HTMLInputElement).value })" />
          </label>
          <label class="form-control block"><span class="label-text mb-2 block font-semibold">Hedef tarih</span>
            <input name="due-date" autocomplete="off" type="date" class="input input-bordered min-h-12 w-full" :value="task.planning.target_date || ''" @change="emit('update', task.id, { dueDate: ($event.target as HTMLInputElement).value })" />
          </label>
        </div>

        <section class="space-y-5 rounded-2xl border border-base-300 bg-base-200 p-4" aria-label="Planlama değerlendirmesi">
          <h3 class="text-lg font-bold">Ekip değerlendirmesi</h3>
          <p>Öncelik, risk, önem ve aciliyet farklı kararlardır. Seçimleriniz bu tarayıcıda saklanır; bütün görünümlere, sıralamaya ve dışa aktarıma yansır.</p>
          <fieldset><legend class="mb-2 font-bold">Efor · {{ effortLabel(task.planning.effort_points) }}</legend><p class="mb-3">Story point göreli büyüklüktür. Saat dönüşümü veya kişi performans puanı değildir.</p><div class="grid grid-cols-3 gap-2 sm:grid-cols-5"><button v-for="value in [null,0,1,2,3,5,8,13,21]" :key="String(value)" class="filter-option min-h-12 px-4" :aria-pressed="task.planning.effort_points===value" @click="emit('update',task.id,{storyPoints:value})">{{ effortLabel(value) }}</button></div></fieldset>
          <fieldset><legend class="mb-2 font-bold">Risk olasılığı · 1 düşük, 5 yüksek</legend><div class="grid grid-cols-3 gap-2 sm:grid-cols-5"><button v-for="value in [null,1,2,3,4,5]" :key="String(value)" class="filter-option min-h-12 px-4" :aria-pressed="task.planning.risk_probability===value" @click="emit('update',task.id,{riskProbability:value})">{{ value ?? 'Belirsiz' }}</button></div></fieldset>
          <fieldset><legend class="mb-2 font-bold">Risk etkisi · 1 düşük, 5 yüksek</legend><div class="grid grid-cols-3 gap-2 sm:grid-cols-5"><button v-for="value in [null,1,2,3,4,5]" :key="String(value)" class="filter-option min-h-12 px-4" :aria-pressed="task.planning.risk_impact===value" @click="emit('update',task.id,{riskImpact:value})">{{ value ?? 'Belirsiz' }}</button></div></fieldset>
          <p class="font-bold" role="status">Risk sonucu: {{ riskLabel(task.planning.risk_score) }}</p>
          <label class="block"><span class="mb-2 block font-bold">Risk gerekçesi</span><textarea class="textarea textarea-bordered min-h-24 w-full text-base" :value="task.planning.risk_reason" placeholder="Ne olabilir, kimi etkiler, hangi kanıta dayanıyor?" @change="emit('update',task.id,{riskReason:($event.target as HTMLTextAreaElement).value})"></textarea></label>
          <div class="grid gap-4 sm:grid-cols-2">
            <fieldset><legend class="mb-2 font-bold">Önemli mi?</legend><div class="grid gap-2"><button v-for="option in truthChoices" :key="String(option.value)" class="filter-option" :aria-pressed="task.planning.important===option.value" @click="emit('update',task.id,{important:option.value})">{{ option.label }}</button></div></fieldset>
            <fieldset><legend class="mb-2 font-bold">Acil mi?</legend><div class="grid gap-2"><button v-for="option in truthChoices" :key="String(option.value)" class="filter-option" :aria-pressed="task.planning.urgent===option.value" @click="emit('update',task.id,{urgent:option.value})">{{ option.label }}</button></div></fieldset>
          </div>
          <p class="font-bold">Eisenhower: {{ task.planning.eisenhower }}</p>
          <fieldset><legend class="mb-2 font-bold">MoSCoW · teslimat zorunluluğu</legend><div class="grid grid-cols-2 gap-2"><button v-for="value in moscowOptions" :key="value" class="filter-option" :aria-pressed="task.planning.moscow===value" @click="emit('update',task.id,{moscow:value})">{{ value }}</button></div></fieldset>
        </section>

        <section v-if="task.user_story?.text || task.technical_objective">
          <h3 class="mb-2 text-lg font-bold">Tanım ve amaç</h3>
          <p class="max-w-prose whitespace-pre-wrap leading-relaxed">{{ task.user_story?.text || task.technical_objective }}</p>
        </section>

        <section>
          <h3 class="mb-2 text-lg font-bold">Planlama gerekçesi</h3>
          <div class="flex flex-wrap gap-2">
            <span class="metric-pill">{{ scopeLabel(task.planning.scope) }}</span><span class="metric-pill">{{ phaseLabel(task.phase) }}</span><span v-for="label in task.change_labels" :key="label" class="metric-pill">{{ label }}</span>
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
              <span class="mt-1 shrink-0" aria-hidden="true">○</span><span>{{ criterion.text }}</span>
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
            <input v-model="checklistText" class="input input-bordered min-h-12 min-w-0 flex-1" aria-label="Yeni kontrol maddesi" placeholder="Yeni kontrol maddesi" @keyup.enter="addChecklist" />
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
            <button v-for="rel in task.relationships" :key="`${rel.type}-${rel.target_id}`" class="block min-h-12 w-full rounded-lg border border-base-300 p-3 text-left hover:bg-base-200" @click="emit('openRelated', rel.target_id)">
              <span class="flex flex-wrap gap-2"><span class="badge badge-ghost">{{ rel.type }}</span><span class="mono text-accent">{{ rel.target_id }}</span></span><span class="mt-2 block font-bold">{{ rel.target_title }}</span><span class="mt-2 block">{{ rel.reason || 'Gerekçe belirtilmemiş.' }}</span><span class="mt-2 block text-base-content/70">{{ rel.basis==='explicit' ? 'Kaynakta açık ilişki' : 'Analizle önerilen ilişki' }}</span>
            </button>
          </div>
        </section>

        <section v-if="childTasks.length" class="rounded-xl border border-warning/50 bg-warning/10 p-4">
          <h3 class="text-lg font-bold">Alt görev yönetimi · {{ childTasks.length }}</h3>
          <p class="mt-1 leading-relaxed">Bu ana görevin bütün alt görevlerini çalışma görünümünden tek işlemle kaldırabilirsiniz. İşlem geri alınabilir ve kanonik JSON’u değiştirmez.</p>
          <div class="mt-3 grid gap-2"><div v-for="child in childTasks" :key="child.id" class="flex gap-2 rounded-xl border border-base-300 bg-base-100 p-2"><button class="min-h-12 flex-1 text-left" @click="emit('openRelated',child.id)">{{ child.id }} · {{ child.title }}</button><button class="btn btn-ghost btn-square touch" :aria-label="`${child.id} alt görevini kaldır`" @click="hideChild(child.id)"><EyeOff :size="20" /></button></div></div>
          <button class="btn btn-warning mt-3 min-h-12 gap-2" @click="hideAll"><EyeOff :size="19" /> Alt görevleri kaldır</button>
        </section>
      </div>

      <footer class="flex shrink-0 gap-2 border-t border-base-300 bg-base-100/95 p-4 backdrop-blur sticky-safe">
        <button class="btn btn-primary min-h-12 flex-1 gap-2" @click="emit('copy', task)"><Clipboard :size="19" /> Görevi kopyala</button>
        <button class="btn btn-error btn-outline min-h-12 gap-2" @click="emit('update', task.id, { hidden: !task.workspace.hidden }); emit('close')"><EyeOff :size="19" /> {{ task.workspace.hidden ? 'Geri getir' : 'Kaldır' }}</button>
      </footer>
    </section>
  </div>
</template>
