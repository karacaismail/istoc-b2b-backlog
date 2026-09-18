<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  BarChart3, Boxes, CalendarRange, ChevronDown, Clipboard, Download, Filter,
  GitBranch, Grid2X2, KanbanSquare, LayoutDashboard, List, Menu, Moon, Network,
  PanelLeftClose, Search, SlidersHorizontal, Sun, Table2, Undo2, X,
} from 'lucide-vue-next'
import FilterPanel from './components/FilterPanel.vue'
import ChoiceSheet from './components/ChoiceSheet.vue'
import TaskCard from './components/TaskCard.vue'
import TaskDrawer from './components/TaskDrawer.vue'
import { useWorkspace } from './useWorkspace'
import { useSidebarLayout } from './useSidebarLayout'
import type { BacklogData, Filters, Task, TaskOverride, ViewType } from './types'

import { sortTasks, taskMarkdown, effortLabel, riskLabel, dateLabel, scopeLabel, phaseLabel, UNKNOWN, type ViewTask } from './planning'
const data = ref<BacklogData | null>(null)
const baseUrl = import.meta.env.BASE_URL
const loading = ref(true)
const loadError = ref('')
const view = ref<ViewType>('report')
const mobileFilters = ref(false)
const sidebarOpen = ref(true)
const sidebar = ref<HTMLElement | null>(null)
const pageHeader = ref<HTMLElement | null>(null)
const { headerHeight, stickyTop } = useSidebarLayout(sidebar, pageHeader)
const activeTaskId = ref<string | null>(null)
const toast = ref('')
const dark = ref(false)
const choiceSheet = ref<'sort' | 'group' | null>(null)
const { overrides, undoStack, update, batchUpdate, taskView, undo, reset, exportWorkspace } = useWorkspace()

const filters = reactive<Filters>({
  query: '', setIds: [], priorities: [], statuses: [], types: [], eisenhower: [], moscow: [],
  discovery: [], changes: [], scopes: [], phases: [], riskCell: '', riskUnknown: false, unestimated: false, showArchived: false,
  riskMin: 0, onlyStarred: false, onlySelected: false, showHidden: false,
  sort: 'b2b-priority', group: 'set',
})

const views: { id: ViewType; label: string; icon: typeof List }[] = [
  { id: 'report', label: 'Rapor', icon: LayoutDashboard },
  { id: 'list', label: 'Liste', icon: List },
  { id: 'table', label: 'Tablo', icon: Table2 },
  { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
  { id: 'timeline', label: 'Zaman', icon: CalendarRange },
  { id: 'cards', label: 'Kartlar', icon: Boxes },
  { id: 'pivot', label: 'Pivot', icon: BarChart3 },
  { id: 'matrix', label: 'Matrisler', icon: Grid2X2 },
  { id: 'dependencies', label: 'Bağımlılık', icon: Network },
]
const sortOptions = [
  { value: 'b2b-priority', label: 'B2B önceliği', hint: 'Temel ve engelleyici işler önce' },
  { value: 'centrality', label: 'Bağımlılık merkeziyeti', hint: 'En fazla işi etkileyenler önce' },
  { value: 'risk', label: 'Risk', hint: 'Yüksek riskten düşüğe' },
  { value: 'effort', label: 'Efor', hint: 'Küçük işlerden büyüğe' },
  { value: 'date', label: 'Hedef tarih', hint: 'Yakın tarihten uzağa' },
  { value: 'moscow', label: 'MoSCoW', hint: 'Must, Should, Could, ertele' },
  { value: 'eisenhower', label: 'Eisenhower', hint: 'Önem ve aciliyet seçimleri' },
  { value: 'id', label: 'Görev ID', hint: 'Sayısal görev sırası' },
  { value: 'title', label: 'Başlık', hint: 'Alfabetik sıra' },
]
const groupOptions = [
  { value: 'set', label: 'Küme', hint: 'Ürün alanlarına göre' },
  { value: 'priority', label: 'Öncelik', hint: 'P0–P3 bantlarına göre' },
  { value: 'status', label: 'Durum', hint: 'İş akışı aşamasına göre' },
  { value: 'eisenhower', label: 'Eisenhower', hint: 'Yap, planla, devret, ele' },
  { value: 'horizon', label: 'Planlama ufku', hint: 'Şimdi, sonraki, daha sonra' },
  { value: 'discovery', label: 'Keşif kaynağı', hint: 'Önceki kapsam veya arşiv taraması' },
  { value: 'change', label: 'Denetimdeki değişiklik', hint: 'Yeni iş, ilişki veya kapsam düzeltmesi' },
  { value: 'scope', label: 'Kapsam', hint: 'Teslimat, karar ve geçmiş kayıt' },
  { value: 'phase', label: 'Faz', hint: 'MVP, MVP sonrası ve araştırma' },
  { value: 'none', label: 'Kümeleme yok', hint: 'Tek sıralı liste' },
]
const selectedSortLabel = computed(() => sortOptions.find(option => option.value === filters.sort)?.label || 'Sıralama')
const selectedGroupLabel = computed(() => groupOptions.find(option => option.value === filters.group)?.label || 'Kümeleme')

onMounted(async () => {
  sidebarOpen.value = window.innerWidth >= 1024
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/backlog.json?revision=25`, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
    const parsed: BacklogData = await response.json()
    if (!parsed.completion || parsed.meta?.dataset_revision < 25) throw new Error('Görev verisi güncelleniyor. Lütfen sayfayı yenileyin.')
    data.value = parsed
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Veri yüklenemedi.'
  } finally { loading.value = false }
})

watch(dark, value => document.documentElement.setAttribute('data-theme', value ? 'night' : 'tradehub'))

const setMap = computed(() => new Map((data.value?.task_sets || []).map(set => [set.id, set.name || set.title || set.id])))
const taskMap = computed(() => new Map((data.value?.tasks || []).map(task => [task.id, task])))
const allViewTasks = computed<ViewTask[]>(() => (data.value?.tasks || []).map(taskView))
const statusOptions = computed(() => [...new Set(allViewTasks.value.map(t => t.effectiveStatus))].sort())
const typeOptions = computed(() => [...new Set(allViewTasks.value.map(t => t.type))].sort())
const activeTask = computed(() => { const task = taskMap.value.get(activeTaskId.value || ''); return task ? taskView(task) : null })
const activeChildren = computed(() => activeTask.value?.child_ids?.filter(id=>filters.showHidden || !overrides.value[id]?.hidden).map(id => taskMap.value.get(id)).filter(Boolean) as Task[] || [])

const filteredTasks = computed(() => {
  const q = filters.query.trim().toLocaleLowerCase('tr-TR')
  const rows = allViewTasks.value.filter(task => {
    if (!filters.showHidden && task.workspace.hidden) return false
    if (!filters.showArchived && !task.planning.active) return false
    if (filters.changes.length && !filters.changes.some(label => task.change_labels.includes(label))) return false
    if (filters.scopes.length && !filters.scopes.includes(task.planning.scope)) return false
    if (filters.phases.length && !filters.phases.includes(task.phase || 'unspecified')) return false
    if (filters.riskCell && filters.riskCell !== `${task.planning.risk_probability}-${task.planning.risk_impact}`) return false
    if (filters.riskUnknown && task.planning.risk_score != null) return false
    if (filters.unestimated && task.planning.effort_points != null) return false
    if (filters.setIds.length && !filters.setIds.includes(task.set_id)) return false
    if (filters.priorities.length && !filters.priorities.includes(task.effectivePriority)) return false
    if (filters.statuses.length && !filters.statuses.includes(task.effectiveStatus)) return false
    if (filters.types.length && !filters.types.includes(task.type)) return false
    if (filters.eisenhower.length && !filters.eisenhower.includes(task.planning.eisenhower)) return false
    if (filters.moscow.length && !filters.moscow.includes(task.planning.moscow)) return false
    if (filters.discovery.length && !filters.discovery.some(label => task.discovery_labels.includes(label))) return false
    if (filters.riskMin > 0 && (task.planning.risk_score == null || task.planning.risk_score < filters.riskMin)) return false
    if (filters.onlyStarred && !task.workspace.starred) return false
    if (filters.onlySelected && !task.workspace.selected) return false
    if (q) {
      const haystack = [task.id, task.title, task.user_story?.text, task.technical_objective, task.source_wbs, setMap.value.get(task.set_id), ...(task.context_ids || [])].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR')
      if (!haystack.includes(q)) return false
    }
    return true
  })
  return sortTasks(rows, filters.sort)
})

const groupedTasks = computed(() => {
  const groups = new Map<string, ViewTask[]>()
  for (const task of filteredTasks.value) {
    const key = filters.group === 'priority' ? task.effectivePriority
      : filters.group === 'status' ? task.effectiveStatus
      : filters.group === 'eisenhower' ? task.planning.eisenhower
      : filters.group === 'horizon' ? task.planning.horizon
      : filters.group === 'discovery' ? task.discovery_labels.join(' + ')
      : filters.group === 'change' ? task.change_labels.join(' + ') || 'Önceki kayıt'
      : filters.group === 'scope' ? scopeLabel(task.planning.scope)
      : filters.group === 'phase' ? phaseLabel(task.phase) || 'Faz seçilmedi'
      : filters.group === 'none' ? 'Tüm görevler'
      : `${task.set_id} · ${setMap.value.get(task.set_id)}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(task)
  }
  return [...groups.entries()]
})

const selectedCount = computed(() => Object.values(overrides.value).filter(x => x.selected).length)
const hiddenCount = computed(() => Object.values(overrides.value).filter(x => x.hidden).length)
const priorityCounts = computed(() => ['P0','P1','P2','P3'].map(p => ({ p, count: filteredTasks.value.filter(t => t.effectivePriority === p).length })))
const kanbanStatuses = computed(() => [...new Set(['backlog', 'hazır', 'devam ediyor', 'incelemede', 'tamamlandı', 'beklemede', ...filteredTasks.value.map(t=>t.effectiveStatus)])])
const eisenhowerCells = ['Yap', 'Planla', 'Devret', 'Ele/sonra', UNKNOWN]
const riskCells = [5,4,3,2,1].flatMap(impact => [1,2,3,4,5].map(probability => ({ impact, probability })))

const pivot = computed(() => (data.value?.task_sets || []).map(set => ({
  id: set.id, name: set.name || set.title || set.id,
  P0: filteredTasks.value.filter(t => t.set_id === set.id && t.effectivePriority === 'P0').length,
  P1: filteredTasks.value.filter(t => t.set_id === set.id && t.effectivePriority === 'P1').length,
  P2: filteredTasks.value.filter(t => t.set_id === set.id && t.effectivePriority === 'P2').length,
  P3: filteredTasks.value.filter(t => t.set_id === set.id && t.effectivePriority === 'P3').length,
  archived: filteredTasks.value.filter(t => t.set_id === set.id && !t.planning.active).length,
})).filter(row => row.P0 + row.P1 + row.P2 + row.P3 + row.archived > 0))

const dependencyRows = computed(() => filteredTasks.value.flatMap(task => (task.relationships || []).filter(r => r.type === 'depends_on').map(rel => ({ task, rel, outside: !filteredTasks.value.some(t=>t.id===rel.target_id) }))))
const timelineGroups = computed(() => {
  const groups = new Map<string,ViewTask[]>()
  for (const task of filteredTasks.value) {
    const month = task.planning.target_date?.slice(0,7) || 'Tarih yok'
    groups.set(month,[...(groups.get(month)||[]),task])
  }
  return [...groups.entries()].sort(([a],[b])=>a==='Tarih yok'?1:b==='Tarih yok'?-1:a.localeCompare(b))
})
const visiblePlan = computed(() => (data.value?.action_plan || []).map(stage => {
  const tasks = filteredTasks.value.filter(t=>t.planning.stage===stage.stage && t.planning.active)
  return { stage: stage.stage, task_count: tasks.length, set_ids: [...new Set(tasks.map(t=>t.set_id))] }
}).filter(stage=>stage.task_count>0))

function resetFilters() {
  Object.assign(filters, { query: '', setIds: [], priorities: [], statuses: [], types: [], eisenhower: [], moscow: [], discovery: [], changes: [], scopes: [], phases: [], riskCell: '', riskUnknown: false, unestimated: false, showArchived: false, riskMin: 0, onlyStarred: false, onlySelected: false, showHidden: false, sort: 'b2b-priority', group: 'set' })
}

function flash(message: string) {
  toast.value = message
  window.setTimeout(() => { if (toast.value === message) toast.value = '' }, 3500)
}

function markdown(task: Task) {
  return taskMarkdown(taskView(taskMap.value.get(task.id) || task), setMap.value.get(task.set_id) || task.set_id)
}

async function copyTask(task: Task) {
  await navigator.clipboard.writeText(markdown(task))
  flash(`${task.id} Markdown olarak kopyalandı.`)
}

function openTask(task: Task) { activeTaskId.value = task.id }
function openRelated(id: string) { if (taskMap.value.has(id)) activeTaskId.value = id }
function hideChildren(task: Task) {
  const seen = new Set<string>()
  function visit(id: string) { for (const child of taskMap.value.get(id)?.child_ids || []) { if (!seen.has(child)) { seen.add(child); visit(child) } } }
  visit(task.id)
  const ids = [...seen]
  batchUpdate(ids, { hidden: true }, `${task.id} alt görevlerini kaldır`)
  flash(`${ids.length} alt görev görünümden kaldırıldı. Geri alabilirsiniz.`)
}

function doUndo() {
  const label = undo()
  flash(label ? `Geri alındı: ${label}` : 'Geri alınacak işlem yok.')
}

function exportMarkdown() {
  const text = filteredTasks.value.map(markdown).join('\n---\n\n')
  const url = URL.createObjectURL(new Blob([text], {type:'text/markdown;charset=utf-8'}))
  const link = document.createElement('a'); link.href=url; link.download='istoc-backlog-filtre.md'; link.click(); URL.revokeObjectURL(url)
}

function exportCsv() {
  const header = ['ID','Başlık','Küme','Durum','Öncelik','MoSCoW','Eisenhower','Olasılık','Etki','Risk','Risk gerekçesi','Efor SP','Hedef','Sorumlu','Keşif','Değişiklik','Kapsam','Faz','Önkoşullar']
  const rows = filteredTasks.value.map(t => [t.id,t.title,setMap.value.get(t.set_id),t.effectiveStatus,t.effectivePriority,t.planning.moscow,t.planning.eisenhower,t.planning.risk_probability,t.planning.risk_impact,t.planning.risk_score,t.planning.risk_reason,t.planning.effort_points,t.planning.target_date,t.workspace.assignee ?? t.assignee,t.discovery_labels.join('; '),t.change_labels.join('; '),scopeLabel(t.planning.scope),phaseLabel(t.phase),(t.relationships||[]).filter(r=>r.type==='depends_on').map(r=>r.target_id).join('; ')])
  const csv = [header, ...rows].map(row => row.map(x => `"${String(x ?? '').replaceAll('"','""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = 'istoc-backlog-filtre.csv'; a.click(); URL.revokeObjectURL(url)
}

function updateAndSnapshot(id: string, patch: Partial<TaskOverride>) { batchUpdate([id], patch, `${id} değişikliğini geri al`) }
function dateFor(task: ViewTask) { return dateLabel(task.planning.target_date) }
function printPage() { window.print() }
function selectView(id: ViewType) { view.value = id; if (window.innerWidth < 1024) sidebarOpen.value = false }
function chooseSheet(value: string) {
  if (choiceSheet.value === 'sort') filters.sort = value
  if (choiceSheet.value === 'group') filters.group = value
  choiceSheet.value = null
  if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(8)
}
</script>

<template>
  <div class="min-h-dvh bg-base-200 pb-20 lg:pb-0" :style="{ '--workspace-header-height': `${headerHeight}px`, '--sidebar-sticky-top': `${stickyTop}px` }">
    <header ref="pageHeader" class="sticky top-0 z-40 border-b border-base-300 bg-base-100/95 backdrop-blur">
      <div class="mx-auto flex min-h-16 max-w-[1800px] items-center gap-1 px-3 sm:gap-2 sm:px-5">
        <button class="btn btn-ghost btn-square touch lg:hidden" aria-label="Menüyü aç" @click="sidebarOpen = !sidebarOpen"><Menu /></button>
        <button class="btn btn-ghost btn-square touch hidden lg:inline-flex" :aria-label="sidebarOpen ? 'Kenar çubuğunu kapat' : 'Kenar çubuğunu aç'" @click="sidebarOpen = !sidebarOpen"><PanelLeftClose /></button>
        <div class="hidden min-w-0 sm:block">
          <h1 class="hidden truncate text-lg font-bold md:block sm:text-xl">İstoç B2B Backlog</h1>
          <p v-if="data" class="hidden text-base text-base-content/65 sm:block">r{{ data.meta.dataset_revision }} · {{ data.meta.task_count }} kayıt · {{ data.meta.active_task_count }} aktif · {{ data.meta.set_count }} küme</p>
        </div>
        <nav class="ml-1 flex rounded-lg border border-base-300 bg-base-200 p-1 md:ml-5" aria-label="Ana sayfalar">
          <a class="btn btn-sm min-h-10 bg-base-100 font-bold" :href="baseUrl" aria-current="page">Tasks</a>
          <a class="btn btn-ghost btn-sm min-h-10" :href="`${baseUrl}efor/`">Efor</a>
        </nav>
        <div class="ml-auto flex items-center gap-1 sm:gap-2">
          <button class="btn btn-ghost btn-square touch" :aria-label="dark ? 'Açık tema' : 'Koyu tema'" @click="dark = !dark"><Sun v-if="dark" /><Moon v-else /></button>
          <button class="btn btn-ghost btn-square touch hidden sm:inline-flex" :disabled="!undoStack.length" aria-label="Son işlemi geri al" @click="doUndo"><Undo2 /></button>
          <div class="dropdown dropdown-end">
            <button tabindex="0" class="btn btn-neutral min-h-12 w-12 shrink-0 gap-2 px-0 sm:w-auto sm:px-4" aria-label="Dışa aktar"><Download :size="19" /><span class="hidden sm:inline">Dışa aktar</span><ChevronDown :size="16" class="hidden sm:block" /></button>
            <ul tabindex="0" class="menu dropdown-content z-50 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl">
              <li><button :disabled="!undoStack.length" @click="doUndo">Son değişikliği geri al</button></li>
              <li><button @click="exportMarkdown">Filtreleneni Markdown indir</button></li>
              <li><button @click="exportCsv">Filtreleneni CSV indir</button></li>
              <li><button @click="exportWorkspace">İşaret ve değişiklikleri JSON indir</button></li>
              <li><button @click="printPage">Raporu yazdır / PDF</button></li>
              <li><button class="text-error" @click="reset(); flash('Çalışma alanı sıfırlandı.')">Yerel değişiklikleri sıfırla</button></li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <div v-if="loading" class="grid min-h-[70dvh] place-items-center"><span class="loading loading-spinner loading-lg text-accent" aria-label="Yükleniyor"></span></div>
    <div v-else-if="loadError" class="mx-auto mt-16 max-w-xl p-5"><div class="alert alert-error"><span>Veri yüklenemedi: {{ loadError }}</span></div></div>

    <div v-else-if="data" class="mx-auto flex max-w-[1800px]">
      <aside ref="sidebar" v-show="sidebarOpen" class="workspace-sidebar border-r border-base-300 bg-base-100 p-4 shadow-xl lg:shadow-none scrollbar-thin">
        <div class="mb-4 flex justify-end lg:hidden"><button class="btn btn-ghost btn-square touch" aria-label="Menüyü kapat" @click="sidebarOpen = false"><X /></button></div>
        <nav aria-label="Görünümler" class="mb-6">
          <h2 class="mb-2 px-3 text-base font-bold">Görünümler</h2>
          <ul class="menu w-full gap-1 p-0">
            <li v-for="item in views" :key="item.id"><button :class="view === item.id ? 'active font-semibold' : ''" @click="selectView(item.id)"><component :is="item.icon" :size="20" />{{ item.label }}</button></li>
          </ul>
        </nav>
        <FilterPanel :filters="filters" :sets="data.task_sets" :status-options="statusOptions" :type-options="typeOptions" @reset="resetFilters" />
      </aside>
      <button v-if="sidebarOpen" class="fixed inset-0 top-16 z-20 bg-black/40 lg:hidden" aria-label="Menüyü kapat" @click="sidebarOpen = false"></button>

      <main id="main" class="min-w-0 flex-1 p-3 sm:p-5 lg:p-6 bottom-safe" tabindex="-1">
        <section class="mb-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto]">
          <label class="input input-bordered flex min-h-14 items-center gap-3 rounded-xl bg-base-100 shadow-sm">
            <Search :size="20" class="text-base-content/60" />
            <input v-model="filters.query" type="search" class="min-w-0 grow text-base" placeholder="Görev, ID, küme, bağlam veya tanım ara" aria-label="Görevlerde ara" />
            <kbd class="kbd hidden sm:inline-flex">/</kbd>
          </label>
          <div class="grid grid-cols-2 gap-2 sm:flex">
            <button class="btn col-span-2 min-h-14 gap-2 rounded-xl border-2 border-primary bg-base-100 sm:col-span-1 lg:hidden" @click="mobileFilters = true"><Filter :size="20" aria-hidden="true" /> Filtrele</button>
            <button class="control-button min-h-14 min-w-0 rounded-xl border-2 border-base-300 bg-base-100 px-3 text-left shadow-sm" aria-haspopup="dialog" @click="choiceSheet='sort'">
              <span class="block text-base text-base-content/70">Sırala</span><strong class="block truncate">{{ selectedSortLabel }}</strong>
            </button>
            <button class="control-button min-h-14 min-w-0 rounded-xl border-2 border-base-300 bg-base-100 px-3 text-left shadow-sm" aria-haspopup="dialog" @click="choiceSheet='group'">
              <span class="block text-base text-base-content/70">Grupla</span><strong class="block truncate">{{ selectedGroupLabel }}</strong>
            </button>
          </div>
        </section>

        <section class="mb-5 flex flex-wrap items-center gap-2" aria-label="Sonuç özeti">
          <span class="badge badge-lg badge-neutral">{{ filteredTasks.length }} sonuç</span>
          <span v-for="item in priorityCounts" :key="item.p" class="badge badge-lg badge-outline">{{ item.p }} · {{ item.count }}</span>
          <span v-if="selectedCount" class="badge badge-lg badge-accent">{{ selectedCount }} seçili</span>
          <button v-if="hiddenCount" class="badge badge-lg badge-error cursor-pointer" @click="filters.showHidden = !filters.showHidden">{{ hiddenCount }} kaldırıldı</button>
        </section>

        <section v-if="view === 'report'" class="space-y-6">
          <div class="rounded-2xl bg-primary p-5 text-primary-content shadow-lg sm:p-7">
            <p class="mono text-base opacity-80">B2B PAZARYERİ EYLEM PLANI</p>
            <h2 class="mt-2 max-w-4xl text-2xl font-bold leading-tight sm:text-3xl">Önce güvenli ticaret omurgası, sonra operasyon, ardından büyüme</h2>
            <p class="mt-3 max-w-4xl text-lg leading-relaxed opacity-90">Kimlik, yetki, katalog, fiyat, stok, sipariş ve ödeme ticaretin temelidir. Risk, efor ve tarihleri ekip belirler; karar bekleyen kapsam ayrıca filtrelenir.</p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div v-for="item in priorityCounts" :key="item.p" class="stat rounded-xl border border-base-300 bg-base-100 shadow-sm">
              <div class="stat-title text-base">{{ item.p }}</div><div class="stat-value text-3xl">{{ item.count }}</div><div class="stat-desc text-base">{{ data.methodology.bands[item.p] }}</div>
            </div>
          </div>
          <div class="grid gap-4 xl:grid-cols-2">
            <section class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-5"><h3 class="card-title text-xl">Aşamalı eylem planı</h3><p>Aktif filtrelere göre bütün kümeler. Ana görev ve alt görev sayıları birlikte gösterilir; bunlar toplanabilir efor tahminleri değildir.</p>
              <ol class="mt-2 space-y-4"><li v-for="stage in visiblePlan" :key="stage.stage" class="rounded-xl border border-base-300 p-4"><div class="flex justify-between gap-3"><strong>{{ stage.stage }}</strong><span class="badge badge-neutral">{{ stage.task_count }} görev</span></div><details class="mt-3"><summary class="min-h-12 py-3 font-semibold">{{ stage.set_ids.length }} kümeyi göster</summary><ul class="space-y-2"><li v-for="id in stage.set_ids" :key="id"><button class="min-h-12 w-full rounded-lg border border-base-300 p-3 text-left text-accent" @click="filters.setIds=[id]; view='list'">{{ id }} · {{ setMap.get(id) }}</button></li></ul></details></li></ol>
            </div></section>
            <section class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-5"><h3 class="card-title text-xl">Puanlama ve kullanım</h3>
              <p class="leading-relaxed">{{ data.methodology.priority_model }}</p>
              <p class="leading-relaxed">{{ data.methodology.default_sort }}</p>
              <div class="alert alert-info mt-3"><SlidersHorizontal class="shrink-0" /><span>{{ data.methodology.caveat }}</span></div>
              <p class="mt-3 text-base-content/70">{{ data.meta.privacy }}</p>
            </div></section>
          </div>
          <section class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-5"><h3 class="card-title text-xl">r{{ data.completion.revision }} · Kapsam ve ilişki tamamlama</h3><p>{{ data.completion.new_task_ids.length }} yeni kayıt · {{ data.meta.leaf_task_count }} aktif alt işi olmayan kayıt. Karar gerektiren işler teslimat taahhüdü sayılmaz.</p><ul class="list-disc space-y-2 pl-6"><li v-for="change in data.completion.changes" :key="change">{{ change }}</li></ul><button class="btn btn-primary mt-3 min-h-12" @click="resetFilters(); filters.discovery=['Tamamlama denetiminde eklenen']; view='list'">60 yeni kaydı incele</button><a class="btn btn-outline min-h-12" :href="`${baseUrl}reports/r25.md`" download>Detaylı raporu indir</a></div></section>
          <section class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-5"><h3 class="card-title text-xl">Görsel arşivi · kanıt durumu</h3><p>{{ data.completion.verification_note }}</p>
            <div class="grid gap-3 sm:grid-cols-3"><div class="stat rounded-xl bg-base-200 p-3"><div class="stat-title text-base">Görsel</div><div class="stat-value text-2xl">{{ data.archive_audit.image_count }}</div></div><div class="stat rounded-xl bg-base-200 p-3"><div class="stat-title text-base">Eşleşen görev</div><div class="stat-value text-2xl">{{ data.archive_audit.matched_task_count }}</div></div><div class="stat rounded-xl bg-base-200 p-3"><div class="stat-title text-base">Yeni görev</div><div class="stat-value text-2xl">{{ data.archive_audit.new_task_ids.length }}</div></div></div>
            <div class="mt-4 flex flex-wrap gap-2"><button v-for="label in data.archive_audit.classification_labels" :key="label" class="btn btn-outline min-h-11" @click="filters.discovery=[label]; view='list'">{{ label }}</button></div>
            <ul class="mt-4 list-disc space-y-2 pl-6"><li v-for="finding in data.archive_audit.context_only_findings" :key="finding">{{ finding }}</li></ul>
          </div></section>
          <section><div class="mb-3 flex items-center justify-between"><h3 class="text-xl font-bold">En yüksek öncelikli işler</h3><button class="btn btn-ghost" @click="view='list'">Tümünü aç</button></div>
            <div class="grid gap-3 xl:grid-cols-2"><TaskCard v-for="task in filteredTasks.slice(0,8)" :key="task.id" :task="task" :set-name="setMap.get(task.set_id) || task.set_id" @open="openTask" @copy="copyTask" @update="updateAndSnapshot" /></div>
          </section>
        </section>

        <section v-else-if="view === 'cards'" class="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          <TaskCard v-for="task in filteredTasks" :key="task.id" :task="task" :set-name="setMap.get(task.set_id) || task.set_id" @open="openTask" @copy="copyTask" @update="updateAndSnapshot" />
        </section>

        <section v-else-if="view === 'list'" class="space-y-6">
          <div v-for="[group, tasks] in groupedTasks" :key="group">
            <div class="sticky top-16 z-10 mb-2 flex items-center gap-3 border-b border-base-300 bg-base-200/95 py-2 backdrop-blur"><h2 class="text-lg font-bold">{{ group }}</h2><span class="badge badge-neutral">{{ tasks.length }}</span></div>
            <div class="divide-y divide-base-300 rounded-xl border border-base-300 bg-base-100">
              <article v-for="task in tasks" :key="task.id" class="grid gap-2 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                <label class="flex min-h-11 items-center gap-2"><input type="checkbox" class="checkbox" :checked="task.workspace.selected" :aria-label="`${task.id} seç`" @change="update(task.id, { selected: !task.workspace.selected })" /><span class="mono font-semibold text-accent">{{ task.id }}</span></label>
                <button class="min-w-0 text-left" @click="openTask(task)"><h3 class="font-semibold leading-snug">{{ task.title }}</h3><p class="mt-1 line-clamp-2 text-base text-base-content/65">{{ task.user_story?.text || task.source_wbs }}</p></button>
                <div class="flex items-center gap-2 sm:justify-end"><span class="badge badge-outline">{{ task.effectivePriority }}</span><button class="btn btn-ghost btn-square touch" aria-label="Görevi kopyala" @click="copyTask(task)"><Clipboard :size="19" /></button></div>
              </article>
            </div>
          </div>
        </section>

        <section v-else-if="view === 'table'" class="space-y-3">
          <div class="grid gap-3 md:hidden">
            <article v-for="task in filteredTasks" :key="task.id" class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
              <div class="flex items-start gap-3"><input type="checkbox" class="checkbox mt-1 h-6 w-6" :checked="task.workspace.selected" :aria-label="`${task.id} seç`" @change="update(task.id, { selected: !task.workspace.selected })" /><button class="min-w-0 flex-1 text-left" @click="openTask(task)"><span class="mono font-bold text-accent" translate="no">{{ task.id }}</span><h2 class="mt-1 break-words text-lg font-bold leading-snug">{{ task.title }}</h2></button></div>
              <dl class="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-base-200 p-3"><div><dt>Durum</dt><dd class="font-bold">{{ task.effectiveStatus }}</dd></div><div><dt>Öncelik</dt><dd class="font-bold whitespace-nowrap">{{ task.effectivePriority }}</dd></div><div><dt>Risk / Efor</dt><dd class="font-bold">{{ riskLabel(task.planning.risk_score) }} · {{ effortLabel(task.planning.effort_points) }}</dd></div><div><dt>Hedef</dt><dd class="mono font-bold whitespace-nowrap">{{ dateFor(task) }}</dd></div></dl>
              <button class="btn btn-primary mt-3 min-h-12 w-full" @click="openTask(task)">Görevi aç</button>
            </article>
          </div>
          <div class="hidden overflow-x-auto rounded-2xl border border-base-300 bg-base-100 md:block scrollbar-thin"><table class="table table-zebra text-base"><thead><tr><th>Seç</th><th>ID</th><th>Görev</th><th>Küme</th><th>Durum</th><th>Öncelik</th><th>Risk</th><th>Efor</th><th>Hedef</th></tr></thead>
            <tbody><tr v-for="task in filteredTasks" :key="task.id"><td><input type="checkbox" class="checkbox" :aria-label="`${task.id} seç`" :checked="task.workspace.selected" @change="update(task.id, { selected: !task.workspace.selected })" /></td><td class="mono font-semibold text-accent">{{ task.id }}</td><td><button class="min-w-64 max-w-xl text-left font-semibold hover:underline" @click="openTask(task)">{{ task.title }}</button></td><td>{{ setMap.get(task.set_id) }}</td><td>{{ task.effectiveStatus }}</td><td><span class="badge badge-outline">{{ task.effectivePriority }}</span></td><td>{{ riskLabel(task.planning.risk_score) }}</td><td>{{ effortLabel(task.planning.effort_points) }}</td><td class="mono">{{ dateFor(task) }}</td></tr></tbody>
          </table></div>
        </section>

        <section v-else-if="view === 'kanban'" class="grid snap-x snap-mandatory auto-cols-[min(88vw,22rem)] grid-flow-col gap-3 overflow-x-auto pb-4 xl:auto-cols-[22rem] scrollbar-thin">
          <div v-for="status in kanbanStatuses" :key="status" class="snap-start rounded-xl border border-base-300 bg-base-300/40 p-3">
            <div class="mb-3 flex items-center justify-between"><h2 class="font-bold">{{ status }}</h2><span class="badge">{{ filteredTasks.filter(t => t.effectiveStatus === status).length }}</span></div>
            <div class="space-y-3"><article v-for="task in filteredTasks.filter(t => t.effectiveStatus === status)" :key="task.id" class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"><button class="w-full text-left" @click="openTask(task)"><span class="mono font-bold text-accent" translate="no">{{ task.id }}</span><h3 class="mt-1 break-words font-bold leading-snug">{{ task.title }}</h3><span class="mt-3 inline-flex min-h-8 items-center rounded-full bg-base-200 px-3 font-bold">{{ task.effectivePriority }} · {{ effortLabel(task.planning.effort_points) }}</span><span class="mt-3 block text-accent underline decoration-2 underline-offset-4">Ayrıntı ve durum değiştir</span></button></article></div>
          </div>
        </section>

        <section v-else-if="view === 'timeline'" class="space-y-6">
          <div v-for="[month, tasks] in timelineGroups" :key="month">
            <h2 class="sticky top-16 z-10 border-b border-base-300 bg-base-200/95 py-2 text-lg font-bold mono">{{ month }}</h2>
            <div class="relative ml-3 border-l-2 border-accent/40 pl-5"><article v-for="task in tasks" :key="task.id" class="relative mb-3 rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm"><span class="absolute -left-[1.72rem] top-5 h-3 w-3 rounded-full bg-accent ring-4 ring-base-200"></span><div class="flex flex-wrap justify-between gap-2"><button class="text-left font-semibold" @click="openTask(task)"><span class="mono mr-2 text-accent">{{ task.id }}</span>{{ task.title }}</button><span class="mono">{{ dateFor(task) }}</span></div><p class="mt-2 text-base-content/65">{{ setMap.get(task.set_id) }} · {{ task.effectivePriority }} · {{ effortLabel(task.planning.effort_points) }}</p></article></div>
          </div>
        </section>

        <section v-else-if="view === 'pivot'" class="space-y-4">
          <div class="alert alert-info"><BarChart3 class="shrink-0" /><span>Satırlar kümeleri, sütunlar öncelik bantlarını gösterir. Aktif filtreler pivotu da daraltır.</span></div>
          <div class="overflow-x-auto rounded-xl border border-base-300 bg-base-100"><table class="table text-base"><thead><tr><th>Küme</th><th>P0</th><th>P1</th><th>P2</th><th>P3</th><th>Geçmiş</th><th>Toplam</th></tr></thead><tbody><tr v-for="row in pivot" :key="row.id"><td><button class="text-left font-semibold hover:underline" @click="filters.setIds=[row.id]; view='list'">{{ row.id }} · {{ row.name }}</button></td><td>{{ row.P0 }}</td><td>{{ row.P1 }}</td><td>{{ row.P2 }}</td><td>{{ row.P3 }}</td><td>{{ row.archived }}</td><td class="font-bold">{{ row.P0+row.P1+row.P2+row.P3+row.archived }}</td></tr></tbody></table></div>
        </section>

        <section v-else-if="view === 'matrix'" class="space-y-7">
          <div><h2 class="mb-3 text-xl font-bold">Eisenhower matrisi</h2><div class="grid gap-3 md:grid-cols-2"><section v-for="cell in eisenhowerCells" :key="cell" class="matrix-cell rounded-xl border border-base-300 bg-base-100 p-4"><div class="mb-3 flex justify-between"><h3 class="font-bold">{{ cell }}</h3><span class="badge badge-neutral">{{ filteredTasks.filter(t => t.planning.eisenhower === cell).length }}</span></div><button v-for="task in filteredTasks.filter(t => t.planning.eisenhower === cell).slice(0,8)" :key="task.id" class="mb-2 block w-full rounded-lg bg-base-200 p-2 text-left hover:bg-base-300" @click="openTask(task)"><span class="mono text-accent">{{ task.id }}</span> {{ task.title }}</button><button v-if="filteredTasks.filter(t => t.planning.eisenhower === cell).length > 8" class="btn btn-ghost" @click="filters.eisenhower=[cell]; view='list'">Tümünü göster</button></section></div></div>
          <div><h2 class="mb-3 text-xl font-bold">Olasılık × etki matrisi</h2><p class="mb-3">Belirsiz risk düşük risk değildir. Her iki değeri görev ayrıntısında seçin.</p><button class="btn btn-outline mb-4 min-h-12" @click="filters.riskMin=0; filters.riskCell=''; filters.riskUnknown=true; view='list'">{{ filteredTasks.filter(t=>t.planning.risk_score==null).length }} risk değerlendirmesi bekleyen kaydı aç</button><div class="overflow-x-auto"><div class="grid min-w-[760px] grid-cols-5 gap-2"><section v-for="cell in riskCells" :key="`${cell.probability}-${cell.impact}`" class="matrix-cell rounded-lg border border-base-300 p-2" :class="cell.probability*cell.impact >= 16 ? 'bg-error/20' : cell.probability*cell.impact >= 10 ? 'bg-warning/25' : 'bg-success/15'"><div class="mono mb-1 font-bold">O{{ cell.probability }} × E{{ cell.impact }} · {{ cell.probability*cell.impact }}</div><button class="btn btn-outline my-2 min-h-12 w-full" @click="filters.riskCell=`${cell.probability}-${cell.impact}`; filters.riskUnknown=false; filters.riskMin=0; view='list'">{{ filteredTasks.filter(t=>t.planning.risk_probability===cell.probability && t.planning.risk_impact===cell.impact).length }} kayıt · Aç</button><button v-for="task in filteredTasks.filter(t => t.planning.risk_probability===cell.probability && t.planning.risk_impact===cell.impact).slice(0,4)" :key="task.id" class="mb-1 block w-full truncate text-left text-base hover:underline" @click="openTask(task)">{{ task.id }} {{ task.title }}</button></section></div></div></div>
        </section>

        <section v-else-if="view === 'dependencies'" class="space-y-5">
          <div class="alert alert-info"><GitBranch class="shrink-0" /><span>Önce önkoşul → sonra bağlı iş. {{ dependencyRows.length }} kayıtlı bağımlılık gösteriliyor. Filtre dışında kalan önkoşullar da görünür; eksik bağlantı bir işin bağımsız olduğunu kanıtlamaz. Alt iş ve konu ilişkileri görev ayrıntısındadır.</span></div>
          <div class="grid gap-4 xl:grid-cols-2"><article v-for="{task,rel,outside} in dependencyRows" :key="`${task.id}-${rel.target_id}`" class="rounded-xl border border-base-300 bg-base-100 p-4">
            <p class="mb-2 font-bold">Önce · önkoşul <span v-if="outside" class="metric-pill">Filtre dışında</span></p>
            <button class="min-h-12 text-left font-semibold text-accent underline" @click="openRelated(rel.target_id)">{{ rel.target_id }} · {{ rel.target_title || taskMap.get(rel.target_id)?.title }}</button>
            <p class="my-2 font-bold">↓ Sonra · bağlı iş</p><button class="min-h-12 text-left font-semibold text-accent underline" @click="openTask(task)">{{ task.id }} · {{ task.title }}</button>
            <p class="mt-3 leading-relaxed">{{ rel.reason || 'Gerekçe kayda geçirilmemiş.' }}</p><p class="mt-2 text-base-content/70">{{ rel.basis === 'explicit' ? 'Kaynakta açık ilişki' : 'Analizle önerilen ilişki' }}</p>
          </article></div>
        </section>
        <p v-if="!filteredTasks.length" class="rounded-xl border border-base-300 bg-base-100 p-6" role="status">Bu filtrelerle eşleşen kayıt yok. <button class="btn btn-outline ml-2 min-h-12" @click="resetFilters">Filtreleri temizle</button></p>
      </main>
    </div>

    <nav v-if="data" class="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-base-300 bg-base-100/95 px-1 backdrop-blur sticky-safe lg:hidden" aria-label="Mobil görünümler">
      <button v-for="item in views.slice(0,4)" :key="item.id" class="flex min-h-16 flex-col items-center justify-center gap-1 text-base" :class="view===item.id ? 'font-bold text-accent' : ''" @click="view=item.id"><component :is="item.icon" :size="21" /><span>{{ item.label }}</span></button>
      <button class="flex min-h-16 flex-col items-center justify-center gap-1 text-base" @click="sidebarOpen=true"><Menu :size="21" /><span>Daha</span></button>
    </nav>

    <div v-if="mobileFilters && data" class="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Filtreler"><button class="absolute inset-0 bg-black/55" aria-label="Filtreleri kapat" @click="mobileFilters=false"></button><section class="absolute inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-base-100 p-5 pb-24"><div class="mb-4 flex justify-between"><h2 class="text-xl font-bold">Filtrele</h2><button class="btn btn-ghost btn-square" @click="mobileFilters=false"><X /></button></div><FilterPanel :filters="filters" :sets="data.task_sets" :status-options="statusOptions" :type-options="typeOptions" @reset="resetFilters" /><button class="btn btn-primary mt-6 min-h-12 w-full" @click="mobileFilters=false">{{ filteredTasks.length }} sonucu göster</button></section></div>

    <TaskDrawer :task="activeTask" :set-name="activeTask ? (setMap.get(activeTask.set_id) || activeTask.set_id) : ''" :child-tasks="activeChildren" @close="activeTaskId=null" @update="updateAndSnapshot" @hide-children="hideChildren" @copy="copyTask" @open-related="openRelated" />
    <ChoiceSheet v-if="choiceSheet" :title="choiceSheet === 'sort' ? 'Görevleri sırala' : 'Görevleri grupla'" :value="choiceSheet === 'sort' ? filters.sort : filters.group" :options="choiceSheet === 'sort' ? sortOptions : groupOptions" @close="choiceSheet=null" @select="chooseSheet" />
    <div v-if="toast" class="toast toast-center toast-top z-[200] mt-16" aria-live="polite"><div class="alert alert-success shadow-lg"><span>{{ toast }}</span></div></div>
  </div>
</template>
