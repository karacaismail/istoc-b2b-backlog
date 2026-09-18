export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'İptal'
export type ViewType = 'report' | 'list' | 'table' | 'kanban' | 'timeline' | 'cards' | 'pivot' | 'matrix' | 'dependencies'

export interface Relationship {
  type: string
  target_id: string
  target_title?: string
  basis?: string
  reason?: string
}

export interface Criterion { id: string; text: string; source_label?: string }

export interface Planning {
  priority: Priority
  priority_score: number
  moscow: string
  horizon: string
  eisenhower: string
  risk_probability: number
  risk_impact: number
  risk_score: number
  effort_points: number
  dependency_count: number
  dependent_count: number
  centrality: number
  target_date: string
  rationale: string[]
}

export interface Task {
  id: string
  revision: number
  set_id: string
  title: string
  type: string
  source_type?: string
  status: string
  status_basis?: string
  wbs?: string[]
  source_wbs?: string
  phase?: string
  assignee?: string | null
  estimate?: string | null
  user_story?: { text?: string; role?: string; need?: string; benefit?: string }
  technical_objective?: string | null
  acceptance_criteria?: Criterion[]
  details?: unknown[]
  relationships?: Relationship[]
  context_ids?: string[]
  origin_section?: string
  child_ids?: string[]
  parent_id?: string | null
  discovery_labels: string[]
  acceptance_policy?: string
  planning: Planning
}

export interface TaskSet { id: string; name?: string; title?: string; description?: string; task_ids?: string[] }
export interface Edge { source: string; target: string; type: string; basis?: string }

export interface BacklogData {
  meta: { dataset_id: string; dataset_revision: number; generated_on: string; task_count: number; set_count: number; relation_count: number; task_to_task_relation_count: number; privacy: string }
  methodology: { default_sort: string; priority_model: string; bands: Record<string, string>; caveat: string }
  priority_counts: Record<string, number>
  archive_audit: {
    image_count: number
    contact_sheet_count: number
    classification_labels: string[]
    matched_task_count: number
    new_task_ids: string[]
    revised_task_ids: string[]
    context_only_findings: string[]
  }
  action_plan: { stage: string; task_count: number; set_ids: string[] }[]
  task_sets: TaskSet[]
  rules: Record<string, unknown>[]
  contexts: Record<string, unknown>[]
  cancelled_notes: Record<string, unknown>[]
  open_questions: Record<string, unknown>[]
  tasks: Task[]
  dependency_edges: Edge[]
  relation_edges: Edge[]
}

export interface TaskOverride {
  status?: string
  priority?: Priority
  assignee?: string
  dueDate?: string
  storyPoints?: number
  labels?: string[]
  notes?: string
  checklist?: { id: string; text: string; done: boolean }[]
  starred?: boolean
  selected?: boolean
  hidden?: boolean
}

export interface Filters {
  query: string
  setIds: string[]
  priorities: string[]
  statuses: string[]
  types: string[]
  eisenhower: string[]
  moscow: string[]
  discovery: string[]
  riskMin: number
  onlyStarred: boolean
  onlySelected: boolean
  showHidden: boolean
  sort: string
  group: string
}
