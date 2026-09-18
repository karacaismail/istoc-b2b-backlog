import { computed, ref, watch } from 'vue'
import type { Task, TaskOverride } from './types'

const STORAGE_KEY = 'istoc-backlog-workspace-v1'

export function useWorkspace() {
  const overrides = ref<Record<string, TaskOverride>>({})
  const undoStack = ref<{ label: string; before: Record<string, TaskOverride> }[]>([])
  try { overrides.value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { overrides.value = {} }
  watch(overrides, value => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })

  function snapshot(label: string) {
    undoStack.value.push({ label, before: structuredClone(overrides.value) })
    if (undoStack.value.length > 20) undoStack.value.shift()
  }

  function update(id: string, patch: Partial<TaskOverride>) {
    overrides.value[id] = { ...(overrides.value[id] || {}), ...patch }
  }

  function batchUpdate(ids: string[], patch: Partial<TaskOverride>, label: string) {
    snapshot(label)
    for (const id of ids) update(id, patch)
  }

  function taskView(task: Task): Task & { workspace: TaskOverride; effectiveStatus: string; effectivePriority: string } {
    const workspace = overrides.value[task.id] || {}
    return Object.assign({}, task, {
      workspace,
      effectiveStatus: workspace.status || task.status,
      effectivePriority: workspace.priority || task.planning.priority,
    })
  }

  function undo() {
    const item = undoStack.value.pop()
    if (item) overrides.value = item.before
    return item?.label
  }

  function reset() {
    snapshot('Çalışma alanını sıfırla')
    overrides.value = {}
  }

  function exportWorkspace() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), overrides: overrides.value }, null, 2)
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `istoc-backlog-workspace-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return { overrides, undoStack: computed(() => undoStack.value), update, batchUpdate, taskView, undo, reset, exportWorkspace }
}
