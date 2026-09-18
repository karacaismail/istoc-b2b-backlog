export const MONTHLY_HOURS = 198
export const FIBONACCI = [1, 2, 3, 5, 8, 13] as const
export const NAMES = ['Ahmet', 'Bora', 'Ali', 'Metin'] as const
export const TEAM_COLORS = ['#f0b58b', '#aacbdf', '#c3b7de', '#b4cead']
export type Phase = 1 | 2 | 3 | 4
export type WorkCard = { id: string; title: string; short: string; description: string; points: number; suit: string; color: string; depends: string[]; goal: boolean }
export type GameState = {
  version: 3; phase: Phase; unavailable: number[]; focus: number; sprints: number;
  history: number[]; historySource: 'example' | 'own'; referenceHours: number;
  activePlayer: number; votes: (number | null)[]; handoff: boolean; revealed: boolean;
  agreed: number | null; selected: string[]; split: boolean; eventDrawn: boolean;
  capacityConfirmed: boolean; done: boolean[]; goal: string;
}
export const DEFAULT_GOAL = 'Alıcı sipariş oluşturabilsin ve durumunu takip edebilsin.'
export function newGame(): GameState {
  return { version: 3, phase: 1, unavailable: [0, 0, 0, 0], focus: 65, sprints: 2,
    history: [18, 22, 20], historySource: 'example', referenceHours: 257.4,
    activePlayer: 0, votes: [null, null, null, null], handoff: false, revealed: false,
    agreed: null, selected: [], split: false, eventDrawn: false,
    capacityConfirmed: false, done: [false, false, false], goal: DEFAULT_GOAL }
}
export function cardsFor(state: GameState): WorkCard[] {
  const cards: WorkCard[] = [
    { id:'cart', title:'Sepeti doğrula', short:'Sepet', description:'Stok ve adet kontrolü. Hatalı siparişi durdur.', points:2, suit:'box', color:'mint', depends:[], goal:true },
    { id:'summary', title:'Sipariş özeti', short:'Özet', description:'Ürün, fiyat ve teslimat bilgisini tek yerde göster.', points:state.agreed ?? 3, suit:'layers', color:'blue', depends:[], goal:true },
    { id:'order', title:'Siparişi oluştur', short:'Sipariş', description:'Onaylanan sepeti bir siparişe dönüştür.', points:5, suit:'flag', color:'peach', depends:['cart','summary'], goal:true },
    { id:'status', title:'Durumu bildir', short:'Bildirim', description:'Alıcıya sipariş durumunu göster.', points:3, suit:'bell', color:'lilac', depends:['order'], goal:true },
    { id:'review', title:'Satıcı onayı', short:'Onay', description:'Satıcı siparişi kabul etsin veya gerekçesiyle reddetsin.', points:5, suit:'shield', color:'mint', depends:['order'], goal:true },
    { id:'banner', title:'Kampanya vitrini', short:'Vitrin', description:'Ana sayfaya kampanya alanı ekle. Bu sprint hedefine katkısı yok.', points:3, suit:'spark', color:'rose', depends:[], goal:false },
  ]
  if (state.split) cards.push(
    { id:'research', title:'API keşfi', short:'Keşif', description:'Entegrasyon belirsizliklerini ve kabul kriterlerini araştır. Teslimat işi ayrıca yeniden tahminlenir.', points:3, suit:'compass', color:'yellow', depends:[], goal:false },
    { id:'sandbox', title:'Sandbox denemesi', short:'Deneme', description:'İzole ortamda bir örnek çağrıyı doğrula. Canlı entegrasyon kapsamda değil.', points:5, suit:'layers', color:'blue', depends:['research'], goal:false },
  )
  else cards.push({ id:'integration', title:'Yeni entegrasyon', short:'Entegrasyon', description:'Belirsiz kapsam. Önce keşif ve küçük doğrulama parçalarına ayır.', points:13, suit:'compass', color:'yellow', depends:[], goal:false })
  return cards
}
export function capacity(state: GameState) {
  const gross = MONTHLY_HOURS * 4
  const available = gross - state.unavailable.reduce((a,b)=>a+b,0)
  const delivery = available * state.focus / 100
  const disruption = state.eventDrawn ? 16 : 0
  const sprintHours = Math.max(0, delivery / state.sprints - disruption)
  const velocity = state.history.reduce((a,b)=>a+b,0) / 3
  const forecast = velocity * sprintHours / state.referenceHours
  return { gross, available, delivery, sprintHours, velocity, forecast, budget: Math.max(0, Math.floor(forecast * .85)), disruption }
}
export function selectedCards(state: GameState) { return cardsFor(state).filter(c=>state.selected.includes(c.id)) }
export function planCheck(state: GameState) {
  const cards = selectedCards(state), points = cards.reduce((n,c)=>n+c.points,0), cap=capacity(state)
  const missing = [...new Set(cards.flatMap(c=>c.depends.filter(id=>!state.selected.includes(id))))]
  const big = cards.some(c=>c.points>=13)
  const goalMet = ['cart','summary','order','status'].every(id=>state.selected.includes(id))
  const distractions = cards.filter(c=>!c.goal).length
  const valid = cards.length>0 && points<=cap.budget && !missing.length && !big && goalMet && state.goal.trim().length>0 && state.done.every(Boolean) && state.capacityConfirmed && state.agreed!==null
  return { cards, points, missing, big, goalMet, distractions, valid, over: Math.max(0,points-cap.budget) }
}
export function mayEnter(state: GameState, phase: Phase) {
  if (phase===1) return true
  if (phase===2) return state.capacityConfirmed
  if (phase===3) return state.capacityConfirmed && state.agreed!==null && state.agreed<13
  return planCheck(state).valid
}
export function score(state: GameState) {
  const check=planCheck(state)
  return (state.capacityConfirmed?20:0)+(state.agreed!==null?30:0)+(check.valid?30:0)+(state.eventDrawn&&check.valid?10:0)+(state.phase===4?10:0)
}
const bounded=(n:unknown,min:number,max:number)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max
export function restoreGame(value: unknown): GameState | null {
  if (!value || typeof value!=='object') return null
  const s=value as GameState
  if(s.version!==3||![1,2,3,4].includes(s.phase)||!Array.isArray(s.unavailable)||s.unavailable.length!==4||!s.unavailable.every(n=>bounded(n,0,198)))return null
  if(!bounded(s.focus,10,100)||!Number.isInteger(s.sprints)||!bounded(s.sprints,1,4)||!bounded(s.referenceHours,1,2000)||!Array.isArray(s.history)||s.history.length!==3||!s.history.every(n=>bounded(n,0,500)))return null
  if(!['example','own'].includes(s.historySource)||!Array.isArray(s.votes)||s.votes.length!==4||!s.votes.every(n=>n===null||FIBONACCI.includes(n as 1)))return null
  if(s.agreed!==null&&!FIBONACCI.includes(s.agreed as 1))return null
  if(!Number.isInteger(s.activePlayer)||!bounded(s.activePlayer,0,3)||!Array.isArray(s.selected)||!s.selected.every(id=>typeof id==='string')||!Array.isArray(s.done)||s.done.length!==3||!s.done.every(x=>typeof x==='boolean'))return null
  if(!['handoff','revealed','split','eventDrawn','capacityConfirmed'].every(k=>typeof (s as any)[k]==='boolean')||typeof s.goal!=='string'||s.goal.length>400)return null
  const restored={...s,selected:[...new Set(s.selected)].filter(id=>cardsFor(s).some(c=>c.id===id))}
  if(restored.agreed!==null&&(!restored.revealed||restored.votes.some(v=>v===null)))restored.agreed=null
  if(!mayEnter(restored,restored.phase))restored.phase=restored.capacityConfirmed?(restored.agreed!==null?3:2):1
  return restored
}
export function report(state: GameState) {
  const c=capacity(state), p=planCheck(state)
  return `# Sprint Odyssey — Sprint planı\n\nHedef: ${state.goal}\n\n## Kapasite\n- Ekip: ${NAMES.join(', ')}\n- Brüt: 4 × 198 = ${c.gross} saat/ay\n- Aylık kapalı saatler: ${state.unavailable.join(' + ')}\n- Teslimat payı: %${state.focus}\n- Ayda ${state.sprints} sprint; bu sprint odak kapasitesi: ${c.sprintHours.toFixed(1)} saat\n- Sürpriz destek: ${c.disruption} saat (yalnız bu sprint)\n\n## Tahmin\n- Geçmiş: ${state.history.join(', ')} Done SP (${state.historySource==='example'?'ÖRNEK VERİ; gerçek ekip ölçümü değildir':'kullanıcının girdiği geçmiş'})\n- Geçmiş sprint referans kapasitesi: ${state.referenceHours} saat\n- Velocity: ${c.velocity.toFixed(1)} SP/sprint\n- Plan tavanı: ${c.budget} SP (kapasite oranı ve tek %15 tampon)\n- Seçilen: ${p.points} SP\n- Puan ≠ saat. Bu bir tahmindir; teslimat taahhüdü değildir.\n\n## Sprint işleri\n${p.cards.map(t=>`- [ ] ${t.title} — ${t.points} SP`).join('\n')}\n\n## Bitmiş sayma ölçütleri\n- Testler geçti ve kod incelendi.\n- Kabul kriterleri doğrulandı.\n- Artırım kullanılabilir; yarım iş Done sayılmıyor.\n\n## Geriye bakış\nSprint sonunda yalnız Done işleri sayın. Sonraki sprintte tahmini gerçek sonuçla yenileyin.\n`
}
