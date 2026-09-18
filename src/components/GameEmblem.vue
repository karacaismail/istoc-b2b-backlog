<script setup lang="ts">
defineProps<{kind?:string}>()
</script>
<template>
<svg class="game-emblem" viewBox="0 0 120 100" fill="none" aria-hidden="true">
 <circle cx="60" cy="49" r="35" fill="currentColor" opacity=".08"/>
 <path d="M15 75 35 64M86 30l19-11M20 23l7 2M98 73l5 4" stroke="currentColor" opacity=".4" stroke-width="2"/>
 <g stroke="currentColor" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
 <template v-if="kind==='box'"><path d="m60 19 31 17v34L60 87 29 70V36Z" fill="currentColor" fill-opacity=".1"/><path d="m29 36 31 18 31-18M60 54v33M44 27l32 17v14"/><path d="m35 61 12 7"/></template>
 <template v-else-if="kind==='layers'"><path d="m23 64 37 21 37-21M23 49l37 21 37-21"/><path d="m60 15 37 21-37 22-37-22Z" fill="currentColor" fill-opacity=".15"/><path d="m47 36 9 5 18-11"/></template>
 <template v-else-if="kind==='flag'"><path d="M36 84V18M36 23c20-18 30 19 52 0v37C66 79 56 41 36 59" fill="currentColor" fill-opacity=".12"/><path d="M26 85h22M45 30v16"/></template>
 <template v-else-if="kind==='bell'"><path d="M60 18c-20 0-23 21-23 34l-9 15h64l-9-15c0-13-3-34-23-34Z" fill="currentColor" fill-opacity=".12"/><path d="M49 76c4 11 18 11 22 0M60 18v-7M23 29l-5 9M97 29l5 9"/></template>
 <template v-else-if="kind==='shield'"><path d="m60 14 31 12v26c0 20-31 36-31 36S29 72 29 52V26Z" fill="currentColor" fill-opacity=".12"/><path d="m44 48 12 12 23-24"/></template>
 <template v-else-if="kind==='spark'"><path d="m60 13 9 25 26 12-26 9-9 27-10-27-25-9 25-12Z" fill="currentColor" fill-opacity=".12"/><path d="M94 15v15M87 22h14M25 76v13M19 82h12"/></template>
 <template v-else><circle cx="60" cy="50" r="33"/><circle cx="60" cy="50" r="25" opacity=".4"/><path d="m76 29-8 30-24 12 8-30Z" fill="currentColor" fill-opacity=".15"/><path d="m52 41 16 18M60 9v8M60 83v8M19 50h8M93 50h8"/></template>
 </g>
</svg>
</template>
