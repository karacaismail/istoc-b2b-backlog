<script setup lang="ts">
import { nextTick, onMounted, onBeforeUnmount, ref } from 'vue'
import { Check, X } from 'lucide-vue-next'

defineProps<{ title: string; value: string; options: { value: string; label: string; hint?: string }[] }>()
const emit = defineEmits<{ close: []; select: [value: string] }>()
const closeButton = ref<HTMLButtonElement | null>(null)
const sheet = ref<HTMLElement|null>(null)
let previousFocus: HTMLElement|null = null
let previousOverflow = ''
onMounted(() => { previousFocus=document.activeElement as HTMLElement; previousOverflow=document.body.style.overflow; document.body.style.overflow='hidden'; nextTick(() => closeButton.value?.focus()) })
onBeforeUnmount(() => { document.body.style.overflow=previousOverflow; previousFocus?.focus() })
function onKey(event:KeyboardEvent) {
  if(event.key==='Escape') { event.preventDefault(); emit('close'); return }
  if(event.key!=='Tab')return
  const buttons=[...(sheet.value?.querySelectorAll<HTMLButtonElement>('button')||[])]
  const first=buttons[0],last=buttons.at(-1)
  if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus()}
  if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus()}
}
</script>

<template>
  <div class="fixed inset-0 z-[120]" role="dialog" aria-modal="true" :aria-label="title" @keydown="onKey">
    <button class="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" :aria-label="`${title} panelini kapat`" @click="emit('close')"></button>
    <section ref="sheet" class="choice-sheet absolute inset-x-0 bottom-0 max-h-[82dvh] overflow-y-auto rounded-t-[1.75rem] border border-base-300 bg-base-100 p-4 pb-safe shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:w-[32rem] md:max-w-[calc(100vw-2rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:p-5">
      <div class="mx-auto mb-3 h-1.5 w-12 rounded-full bg-base-300 md:hidden"></div>
      <header class="mb-4 flex items-center justify-between gap-3">
        <h2 class="text-xl font-bold text-balance">{{ title }}</h2>
        <button ref="closeButton" class="btn btn-ghost btn-square touch" aria-label="Kapat" @click="emit('close')"><X aria-hidden="true" /></button>
      </header>
      <div class="grid gap-2">
        <button v-for="option in options" :key="option.value" class="choice-row flex min-h-14 w-full items-center gap-3 rounded-xl border-2 p-3 text-left" :class="value === option.value ? 'border-accent bg-accent/10' : 'border-base-300 bg-base-100'" :aria-pressed="value === option.value" @click="emit('select', option.value)">
          <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full" :class="value === option.value ? 'bg-accent text-accent-content' : 'bg-base-200'"><Check v-if="value === option.value" :size="18" aria-hidden="true" /></span>
          <span class="min-w-0"><strong class="block break-words">{{ option.label }}</strong><span v-if="option.hint" class="mt-0.5 block text-base text-base-content/75">{{ option.hint }}</span></span>
        </button>
      </div>
    </section>
  </div>
</template>
