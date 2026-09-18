import type { Task, TaskOverride } from './types'

export const UNKNOWN = 'Değerlendirilmedi'
export type ViewTask = Task & { workspace: TaskOverride; effectiveStatus: string; effectivePriority: string }
const priorityRank: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3, Arşiv: 4, İptal: 4 }
const score: Record<string, number> = { P0: 95, P1: 80, P2: 65, P3: 40, Arşiv: 0, İptal: 0 }
const statuses: Record<string,string> = { in_progress: 'devam ediyor', done: 'tamamlandı', blocked: 'beklemede' }
const own = (o: object, k: string) => Object.prototype.hasOwnProperty.call(o, k)

export function effectiveTask(task: Task, workspace: TaskOverride = {}): ViewTask {
  const active = !['cancelled', 'superseded'].includes(task.status)
  const priority = active ? workspace.priority ?? task.planning.priority : 'Arşiv'
  const nullable = <K extends keyof TaskOverride>(key: K, fallback: TaskOverride[K]) => own(workspace,key) ? workspace[key] ?? null : fallback
  const probability = nullable('riskProbability', task.planning.risk_probability) as number | null
  const impact = nullable('riskImpact', task.planning.risk_impact) as number | null
  const important = nullable('important',task.planning.important) as boolean | null
  const urgent = nullable('urgent',task.planning.urgent) as boolean | null
  const eisenhower = important == null || urgent == null ? UNKNOWN : important ? urgent ? 'Yap' : 'Planla' : urgent ? 'Devret' : 'Ele/sonra'
  const points = nullable('storyPoints',task.planning.effort_points) as number | null
  return { ...task, workspace, effectivePriority: priority,
    effectiveStatus: active ? statuses[workspace.status || task.status] || workspace.status || task.status : task.status,
    planning: { ...task.planning, active, priority, priority_score: score[priority] ?? 0,
      risk_probability: probability, risk_impact: impact, risk_score: probability != null && impact != null ? probability * impact : null,
      risk_reason: workspace.riskReason ?? task.planning.risk_reason,
      important, urgent, eisenhower, moscow: workspace.moscow || task.planning.moscow,
      effort_points: points, estimate_source: own(workspace,'storyPoints') && points != null ? 'Çalışma alanı tahmini' : task.planning.estimate_source,
      target_date: own(workspace,'dueDate') ? workspace.dueDate || null : task.planning.target_date,
    },
  }
}

export const effortLabel = (v: number | null) => v == null ? 'Tahmin yok' : `${v} SP`
export const riskLabel = (v: number | null) => v == null ? 'Belirsiz' : `${v}/25`
export const dateLabel = (v: string | null) => v || 'Tarih yok'
export const scopeLabel = (v: string) => ({ delivery: 'Teslimat', decision: 'Karar gerektiren', historical: 'Geçmiş kayıt' }[v] || v)
export const phaseLabel = (v?: string) => ({ mvp: 'MVP', post_mvp: 'MVP sonrası', research: 'Araştırma', unspecified: 'Faz seçilmedi' }[v || 'unspecified'] || v)

function nullableCompare(a: number | string | null, b: number | string | null, desc = false) {
  if (a == null) return b == null ? 0 : 1
  if (b == null) return -1
  const result = typeof a === 'number' && typeof b === 'number' ? a-b : String(a).localeCompare(String(b))
  return desc ? -result : result
}

export function sortTasks(tasks: ViewTask[], sort: string): ViewTask[] {
  const tie = (a: ViewTask,b: ViewTask) => (priorityRank[a.effectivePriority] ?? 4)-(priorityRank[b.effectivePriority] ?? 4) || a.id.localeCompare(b.id,undefined,{numeric:true})
  const compare = (a: ViewTask,b: ViewTask) => {
    if (sort==='id') return a.id.localeCompare(b.id,undefined,{numeric:true})
    if (sort==='title') return a.title.localeCompare(b.title,'tr')
    if (sort==='risk') return nullableCompare(a.planning.risk_score,b.planning.risk_score,true) || tie(a,b)
    if (sort==='effort') return nullableCompare(a.planning.effort_points,b.planning.effort_points) || tie(a,b)
    if (sort==='date') return nullableCompare(a.planning.target_date,b.planning.target_date) || tie(a,b)
    if (sort==='centrality') return b.planning.centrality-a.planning.centrality || tie(a,b)
    if (sort==='moscow') return ['Must','Should','Could',"Won't/şimdilik",UNKNOWN].indexOf(a.planning.moscow)-['Must','Should','Could',"Won't/şimdilik",UNKNOWN].indexOf(b.planning.moscow) || tie(a,b)
    if (sort==='eisenhower') return ['Yap','Planla','Devret','Ele/sonra',UNKNOWN].indexOf(a.planning.eisenhower)-['Yap','Planla','Devret','Ele/sonra',UNKNOWN].indexOf(b.planning.eisenhower) || tie(a,b)
    return tie(a,b)
  }
  const sorted = [...tasks].sort(compare)
  if (sort!=='b2b-priority') return sorted
  // Stable Kahn order: prerequisites present in the result precede dependents.
  // Filtering out a prerequisite does not imply it was completed.
  const ids = new Set(tasks.map(t=>t.id))
  const remaining = new Map(tasks.map(t=>[t.id,new Set((t.relationships||[]).filter(r=>r.type==='depends_on'&&ids.has(r.target_id)).map(r=>r.target_id))]))
  const emitted = new Set<string>(), output: ViewTask[] = []
  while (output.length<sorted.length) {
    const next = sorted.find(t=>!emitted.has(t.id)&&[...remaining.get(t.id)!].every(id=>emitted.has(id)))
    if (!next) return [...output,...sorted.filter(t=>!emitted.has(t.id))] // retain data if a user-supplied graph is invalid
    emitted.add(next.id); output.push(next)
  }
  return output
}

export function taskMarkdown(task: ViewTask, setName: string): string {
  const p=task.planning
  const deps=(task.relationships||[]).filter(r=>r.type==='depends_on').map(r=>`- ${r.target_id} — ${r.target_title || ''}\n  ${r.reason || ''}`).join('\n') || 'Kayıtlı önkoşul yok; bağımsızlık doğrulanmış sayılmaz.'
  return `# ${task.id} — ${task.title}\n\n**Küme:** ${setName}\n**Durum:** ${task.effectiveStatus}\n**Öncelik:** ${task.effectivePriority}\n**Kapsam:** ${scopeLabel(p.scope)}\n**Faz:** ${phaseLabel(task.phase)}\n**MoSCoW:** ${p.moscow}\n**Eisenhower:** ${p.eisenhower}\n**Risk:** ${riskLabel(p.risk_score)}\n**Risk gerekçesi:** ${p.risk_reason || 'Girilmedi'}\n**Efor:** ${effortLabel(p.effort_points)}\n**Tahmin kaynağı:** ${p.estimate_source}\n**Hedef:** ${dateLabel(p.target_date)}\n**Sorumlu:** ${task.workspace.assignee || task.assignee || 'Atanmadı'}\n**Keşif:** ${task.discovery_labels.join(', ')}\n**Değişiklik:** ${task.change_labels.join(', ') || 'Önceki kayıt'}\n\n## Tanım\n${task.user_story?.text || task.technical_objective || task.source_wbs || ''}\n\n## Önkoşullar\n${deps}\n\n## Kabul kriterleri\n${(task.acceptance_criteria||[]).map(c=>`- [ ] ${c.text}`).join('\n')}\n\n## Çalışma alanı notu\n${task.workspace.notes || 'Not yok'}\n`
}
