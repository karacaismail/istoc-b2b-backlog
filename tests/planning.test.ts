import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { effectiveTask, sortTasks, taskMarkdown } from '../src/planning.ts'
import type { Task } from '../src/types.ts'
const data=JSON.parse(readFileSync(new URL('../public/data/backlog.json',import.meta.url),'utf8'))
const byId=new Map<string,Task>(data.tasks.map((t:Task)=>[t.id,t]))
const original=byId.get('TASK-333')!

test('unknown estimates, risk and dates remain unknown, independent of priority',()=>{
 for(const task of data.tasks){
  const v=effectiveTask(task,{priority:'P0'})
  assert.equal(v.planning.risk_score,null); assert.equal(v.planning.effort_points,null)
  assert.equal(v.planning.target_date,null); assert.equal(v.planning.eisenhower,'Değerlendirilmedi')
 }
})
test('overrides reach all planning consumers, preserve zero and support clearing values',()=>{
 const v=effectiveTask(original,{priority:'P3',storyPoints:0,riskProbability:4,riskImpact:5,important:true,urgent:false,dueDate:'2026-11-12',moscow:'Could',status:'tamamlandı'})
 assert.equal(v.planning.effort_points,0);assert.equal(v.planning.risk_score,20)
 assert.equal(v.planning.eisenhower,'Planla');assert.equal(v.effectivePriority,'P3');assert.equal(v.effectiveStatus,'tamamlandı')
 const md=taskMarkdown(v,'Test')
 for(const text of ['**Efor:** 0 SP','**Risk:** 20/25','**Hedef:** 2026-11-12','**Öncelik:** P3','**Durum:** tamamlandı','**MoSCoW:** Could'])assert.ok(md.includes(text),text)
 const clear=effectiveTask(v,{storyPoints:null,riskProbability:null,dueDate:''})
 assert.equal(clear.planning.effort_points,null);assert.equal(clear.planning.risk_score,null);assert.equal(clear.planning.target_date,null)
})
test('superseded record cannot be revived by stale local overrides',()=>{
 const t=effectiveTask(byId.get('TASK-224')!,{priority:'P0',status:'hazır'})
 assert.equal(t.planning.active,false);assert.equal(t.effectivePriority,'Arşiv');assert.equal(t.effectiveStatus,'superseded')
})
test('B2B ordering places each included prerequisite before its dependent',()=>{
 const rows=sortTasks(data.tasks.filter((t:Task)=>t.planning.active).map((t:Task)=>effectiveTask(t)),'b2b-priority')
 const order=new Map(rows.map((t,i)=>[t.id,i]))
 for(const task of rows)for(const r of task.relationships||[])if(r.type==='depends_on'&&order.has(r.target_id))assert.ok(order.get(r.target_id)!<order.get(task.id)!,`${r.target_id} before ${task.id}`)
 assert.equal(rows.length,380)
})
test('known estimates, risks and dates sort before unknowns, using local values',()=>{
 const a=effectiveTask(original),b=effectiveTask(byId.get('TASK-334')!,{storyPoints:0,riskProbability:3,riskImpact:5,dueDate:'2026-12-01'})
 for(const sort of ['effort','risk','date'])assert.equal(sortTasks([a,b],sort)[0]!.id,b.id)
})
test('new records, action plan and all references remain complete and phase-safe',()=>{
 assert.equal(data.tasks.length,381);assert.equal(data.completion.new_task_ids.length,60)
 assert.equal(data.task_sets.length,43)
 assert.equal(new Set(data.action_plan.flatMap((s:any)=>s.set_ids)).size,43)
 assert.equal(data.action_plan.reduce((n:number,s:any)=>n+s.task_count,0),380)
 for(const t of data.tasks){
  if(t.phase==='post_mvp')assert.ok(!['P0','P1'].includes(t.planning.priority),t.id)
  for(const r of t.relationships)if(r.target_id.startsWith('TASK-'))assert.ok(byId.has(r.target_id),r.target_id)
 }
 assert.ok(!JSON.stringify(data).includes('/Users/'))
})
