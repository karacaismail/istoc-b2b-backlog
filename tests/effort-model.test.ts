import test from 'node:test'
import assert from 'node:assert/strict'
import { capacity, cardsFor, mayEnter, newGame, planCheck, report, restoreGame, score } from '../src/game/model.ts'
const ready=()=>{const s=newGame();s.capacityConfirmed=true;s.votes=[3,3,5,3];s.revealed=true;s.agreed=3;s.selected=['cart','summary','order','status'];s.done=[true,true,true];return s}
test('monthly hours and SP remain separate; apply buffer exactly once',()=>{
 const c=capacity(newGame());assert.equal(c.gross,792);assert.equal(c.velocity,20);assert.equal(c.sprintHours,257.4);assert.equal(c.budget,17)
})
test('hours loss and one-time disruption lower forecast, never create negative resources',()=>{
 const s=newGame();s.unavailable=[198,198,198,198];s.eventDrawn=true;assert.equal(capacity(s).sprintHours,0);assert.equal(capacity(s).budget,0)
 const t=newGame();t.eventDrawn=true;assert.equal(capacity(t).disruption,16);assert.equal(capacity(t).budget,15)
})
test('zero Done sprint is part of velocity',()=>{const s=newGame();s.history=[0,10,20];assert.equal(capacity(s).velocity,10)})
test('cannot skip capacity, voting or Done gates',()=>{
 const s=newGame();assert.equal(mayEnter(s,2),false);assert.equal(mayEnter(s,3),false);assert.equal(mayEnter(s,4),false)
 s.capacityConfirmed=true;assert.equal(mayEnter(s,2),true);assert.equal(mayEnter(s,3),false)
 s.agreed=3;assert.equal(mayEnter(s,3),true);assert.equal(mayEnter(s,4),false)
})
test('dependency chain and goal must fit the budget',()=>{
 const s=ready();assert.equal(planCheck(s).points,13);assert.equal(planCheck(s).valid,true)
 s.selected=['order'];assert.deepEqual(planCheck(s).missing,['cart','summary']);assert.equal(planCheck(s).valid,false)
 s.selected=['cart','summary','order','status','review'];assert.equal(planCheck(s).over,1);assert.equal(planCheck(s).valid,false)
})
test('13 point work is excluded from a valid plan and split creates bounded discovery work',()=>{
 const s=ready();s.selected.push('integration');assert.equal(planCheck(s).big,true);assert.equal(planCheck(s).valid,false)
 s.split=true;assert.equal(cardsFor(s).some(c=>c.id==='integration'),false);assert.equal(cardsFor(s).filter(c=>['research','sandbox'].includes(c.id)).length,2)
})
test('XP is earned for planning, not individual votes or proximity to consensus',()=>{
 const s=ready();s.phase=4;s.eventDrawn=true;assert.equal(score(s),100)
 s.votes=[1,13,8,2];assert.equal(score(s),100)
})
test('restore rejects malformed or impossible saves and downgrades invalid final phase',()=>{
 assert.equal(restoreGame({version:3}),null);const s=ready();s.phase=4;s.selected=[];assert.equal(restoreGame(s)?.phase,3)
 const t=ready();t.history=[NaN,2,3];assert.equal(restoreGame(t),null)
 const t2=ready();t2.votes=[null,null,null,null];assert.equal(restoreGame(t2)?.agreed,null)
})
test('export explicitly labels example history and includes chosen scope',()=>{
 const s=ready();assert.match(report(s),/ÖRNEK VERİ/);assert.match(report(s),/Puan ≠ saat/);assert.match(report(s),/Siparişi oluştur — 5 SP/)
})
