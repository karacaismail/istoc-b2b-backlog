<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ArrowLeft, ArrowRight, Award, BarChart3, Check, CircleHelp, Gauge, RotateCcw, Sparkles, Target, Trophy, Users, X, Zap } from 'lucide-vue-next'

type Developer = { name: string; unavailable: number; vote: number | null; color: string }
type WorkItem = { id: string; title: string; points: number; size: string; selected: boolean; tone: string }

const baseUrl = import.meta.env.BASE_URL
const MONTHLY_HOURS = 198
const fibonacci = [1, 2, 3, 5, 8, 13]
const stage = ref(1)
const rulesOpen = ref(false)
const revealed = ref(false)
const storyIndex = ref(0)
const deliveryShare = ref(65)
const hoursPerPoint = ref(6)
const sprintCount = ref(2)
const velocityInputs = reactive([0, 0, 0])
const team = reactive<Developer[]>([
  { name: 'Ahmet', unavailable: 0, vote: null, color: 'mint' },
  { name: 'Bora', unavailable: 0, vote: null, color: 'blue' },
  { name: 'Ali', unavailable: 0, vote: null, color: 'peach' },
  { name: 'Metin', unavailable: 0, vote: null, color: 'lilac' },
])
const stories = [
  { title: 'Şifre sıfırlama metnini değiştir', hint: 'Akış aynı, yalnız doğrulanmış metin değişiyor.' },
  { title: 'Fiyat listesine müşteri grubu ekle', hint: 'UI, backend kuralı ve kabul testi var.' },
  { title: 'Escrow kısmi iade akışını geliştir', hint: 'Para, sipariş durumu, audit ve hata senaryoları var.' },
  { title: 'Yeni ülke e-fatura entegrasyonu', hint: 'Harici servis ve mevzuat belirsizliği yüksek.' },
]
const work = reactive<WorkItem[]>([
  { id: 'A', title: 'Basit validasyon', points: 1, size: 'XS', selected: false, tone: 'mint' },
  { id: 'B', title: 'Profil alanı + API', points: 2, size: 'S', selected: false, tone: 'blue' },
  { id: 'C', title: 'Fiyat kuralı + test', points: 3, size: 'M', selected: false, tone: 'lilac' },
  { id: 'D', title: 'Ödeme durum akışı', points: 5, size: 'L', selected: false, tone: 'peach' },
  { id: 'E', title: 'Escrow iade dilimi', points: 8, size: 'XL', selected: false, tone: 'rose' },
  { id: 'F', title: 'Belirsiz entegrasyon', points: 13, size: 'Böl', selected: false, tone: 'yellow' },
])

const availableHours = computed(() => team.reduce((sum, person) => sum + Math.max(0, MONTHLY_HOURS - person.unavailable), 0))
const deliveryHours = computed(() => Math.round(availableHours.value * deliveryShare.value / 100))
const validVelocities = computed(() => velocityInputs.filter(value => value > 0))
const averageVelocity = computed(() => validVelocities.value.length ? validVelocities.value.reduce((a, b) => a + b, 0) / validVelocities.value.length : 0)
const monthlyPoints = computed(() => Math.floor(averageVelocity.value ? averageVelocity.value * sprintCount.value : deliveryHours.value / hoursPerPoint.value))
const sprintCapacity = computed(() => Math.max(1, Math.floor(monthlyPoints.value / sprintCount.value * .85)))
const votes = computed(() => team.map(person => person.vote).filter((vote): vote is number => vote !== null))
const allVoted = computed(() => votes.value.length === team.length)
const spread = computed(() => votes.value.length ? Math.max(...votes.value) - Math.min(...votes.value) : 0)
const pokerResult = computed(() => {
  if (!revealed.value || !votes.value.length) return null
  const ordered = [...votes.value].sort((a, b) => a - b)
  return { recommendation: ordered[Math.floor((ordered.length - 1) / 2)], consensus: spread.value <= 2 && !votes.value.includes(13) }
})
const selectedPoints = computed(() => work.filter(item => item.selected).reduce((sum, item) => sum + item.points, 0))
const loadPercent = computed(() => Math.round(selectedPoints.value / sprintCapacity.value * 100))
const capacityXP = computed(() => stage.value > 1 ? 30 : 0)
const pokerXP = computed(() => pokerResult.value ? (pokerResult.value.consensus ? 40 : 25) : 0)
const sprintXP = computed(() => selectedPoints.value > 0 && loadPercent.value <= 85 ? 30 : selectedPoints.value > 0 && loadPercent.value <= 100 ? 15 : 0)
const xp = computed(() => capacityXP.value + pokerXP.value + sprintXP.value)
const level = computed(() => xp.value >= 100 ? 3 : xp.value >= 60 ? 2 : 1)
const stageNames = ['Kapasite Lab', 'Poker Arena', 'Sprint Quest', 'Sonuç']
const canContinue = computed(() => stage.value === 1 || stage.value === 2 && !!pokerResult.value || stage.value === 3 && selectedPoints.value > 0 || stage.value === 4)

function haptic(pattern: number | number[] = 8) { if (navigator.vibrate && matchMedia('(pointer: coarse)').matches) navigator.vibrate(pattern) }
function setUnavailable(person: Developer, delta: number) { person.unavailable = Math.min(198, Math.max(0, person.unavailable + delta)); haptic() }
function vote(person: Developer, card: number) { person.vote = card; revealed.value = false; haptic() }
function reveal() { if (!allVoted.value) return; revealed.value = true; haptic([20, 40, 20]) }
function nextStory() { team.forEach(person => { person.vote = null }); revealed.value = false; storyIndex.value = (storyIndex.value + 1) % stories.length; haptic() }
function go(next: number) { if (next > stage.value && !canContinue.value) return; stage.value = Math.min(4, Math.max(1, next)); haptic() }
function toggleWork(item: WorkItem) { item.selected = !item.selected; haptic() }
function resetGame() { team.forEach(person => { person.unavailable = 0; person.vote = null }); work.forEach(item => { item.selected = false }); velocityInputs.splice(0,3,0,0,0); deliveryShare.value=65; sprintCount.value=2; revealed.value=false; storyIndex.value=0; stage.value=1; haptic([10,40,10]) }
</script>

<template>
  <div class="game-shell min-h-dvh pb-28 text-slate-950 lg:pb-8">
    <header class="game-header sticky top-0 z-40 border-b border-white/15 bg-[#111b3a]/95 text-white backdrop-blur-xl">
      <div class="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-3 sm:px-5">
        <a class="hidden font-heading text-lg font-bold md:block" :href="baseUrl">İstoç B2B</a>
        <nav class="flex rounded-xl bg-white/10 p-1" aria-label="Ana sayfalar"><a class="game-nav-link" :href="baseUrl">Tasks</a><a class="game-nav-link active" :href="`${baseUrl}efor/`" aria-current="page">Efor</a></nav>
        <div class="ml-auto flex items-center gap-2"><span class="level-pill"><Zap :size="17" aria-hidden="true" /> Lv.{{ level }} · {{ xp }} XP</span><button class="game-icon-btn" aria-label="Nasıl oynanır?" @click="rulesOpen=true"><CircleHelp aria-hidden="true" /></button><button class="game-icon-btn" aria-label="Oyunu sıfırla" @click="resetGame"><RotateCcw aria-hidden="true" /></button></div>
      </div>
    </header>

    <main id="main" class="mx-auto max-w-[1440px] p-3 sm:p-5 lg:p-7">
      <section class="game-hero overflow-hidden rounded-[1.75rem] p-5 text-white shadow-xl sm:p-7">
        <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center"><div><p class="game-kicker">SPRINT ODYSSEY</p><h1 class="mt-2 text-3xl font-black text-balance sm:text-5xl">Takımının gerçek sprint gücünü bul.</h1><p class="mt-3 max-w-3xl text-lg text-blue-50">3 görevi tamamla: kapasiteyi kur, kartları aç, sprint valizini doldur. Sonunda uygulanabilir bir Scrum planın olacak.</p></div><div class="score-orb" aria-label="Toplam oyun puanı"><span class="text-4xl font-black">{{ xp }}</span><span>XP</span></div></div>
        <ol class="mt-6 grid grid-cols-4 gap-2" aria-label="Oyun ilerlemesi"><li v-for="(name,index) in stageNames" :key="name"><button class="stage-step game-tap" :class="stage===index+1 ? 'active' : stage>index+1 ? 'done' : ''" :aria-current="stage===index+1 ? 'step' : undefined" @click="go(index+1)"><span class="stage-number"><Check v-if="stage>index+1" :size="18" aria-hidden="true" /><span v-else>{{ index+1 }}</span></span><span class="hidden sm:block">{{ name }}</span></button></li></ol>
      </section>

      <section class="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div class="game-board rounded-[1.75rem] border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur sm:p-6">
          <section v-if="stage===1" aria-labelledby="capacity-title">
            <div class="mission-heading"><span class="mission-icon bg-emerald-100 text-emerald-900"><Gauge aria-hidden="true" /></span><div><p class="game-kicker text-emerald-800">GÖREV 1</p><h2 id="capacity-title" class="text-2xl font-black sm:text-3xl">Kapasite Lab</h2><p class="mt-1 text-slate-700">Her oyuncunun bu ay teslimata kapalı saatlerini ayarla.</p></div></div>
            <div class="mt-6 grid gap-3 sm:grid-cols-2"><article v-for="person in team" :key="person.name" class="player-card" :data-tone="person.color"><div class="flex items-center gap-3"><span class="avatar-token">{{ person.name[0] }}</span><div><h3 class="text-xl font-black">{{ person.name }}</h3><p>198 saat / ay</p></div></div><div class="mt-5 flex items-center justify-between gap-2"><button class="counter-btn" :aria-label="`${person.name} kapalı saatini 4 azalt`" @click="setUnavailable(person,-4)">−4</button><output class="min-w-24 text-center" :aria-label="`${person.name} kapalı saat`"><strong class="block text-3xl">{{ person.unavailable }}</strong><span>kapalı saat</span></output><button class="counter-btn" :aria-label="`${person.name} kapalı saatini 4 artır`" @click="setUnavailable(person,4)">+4</button></div></article></div>
            <div class="mt-5 grid gap-4 lg:grid-cols-2"><fieldset class="game-field"><legend>Teslimat payı</legend><p>Toplantı, destek ve review dışındaki odak payı.</p><div class="choice-deck"><button v-for="value in [55,65,75]" :key="value" class="game-choice" :aria-pressed="deliveryShare===value" @click="deliveryShare=value;haptic()">%{{ value }}</button></div></fieldset><fieldset class="game-field"><legend>Ay içindeki sprint</legend><p>Takımınızın sprint ritmini seçin.</p><div class="choice-deck"><button v-for="value in [2,3,4]" :key="value" class="game-choice" :aria-pressed="sprintCount===value" @click="sprintCount=value;haptic()">{{ value }} sprint</button></div></fieldset></div>
          </section>

          <section v-else-if="stage===2" aria-labelledby="poker-title">
            <div class="mission-heading"><span class="mission-icon bg-violet-100 text-violet-950"><Sparkles aria-hidden="true" /></span><div><p class="game-kicker text-violet-900">GÖREV 2</p><h2 id="poker-title" class="text-2xl font-black sm:text-3xl">Poker Arena</h2><p class="mt-1 text-slate-700">Kartını gizlice seç. Herkes hazır olunca masayı aç.</p></div></div>
            <div class="story-banner mt-5"><div><span class="game-kicker text-blue-900">HİKÂYE {{ storyIndex+1 }}/{{ stories.length }}</span><h3 class="mt-1 text-xl font-black">{{ stories[storyIndex].title }}</h3><p class="mt-1 text-slate-700">{{ stories[storyIndex].hint }}</p></div><button class="btn min-h-12 bg-white" @click="nextStory">Değiştir <ArrowRight aria-hidden="true" /></button></div>
            <div class="mt-5 grid gap-3 sm:grid-cols-2"><article v-for="person in team" :key="person.name" class="poker-seat" :data-ready="!!person.vote"><div class="flex items-center justify-between"><h3 class="text-xl font-black">{{ person.name }}</h3><span class="ready-pill">{{ person.vote ? 'Kart seçildi' : 'Sıra sende' }}</span></div><div class="mt-4 grid grid-cols-6 gap-2"><button v-for="card in fibonacci" :key="card" class="poker-card game-tap" :class="person.vote===card ? 'selected' : ''" :aria-label="`${person.name}: ${card} puan`" :aria-pressed="person.vote===card" @click="vote(person,card)"><span v-if="!revealed">{{ person.vote===card ? '✓' : card }}</span><span v-else>{{ person.vote===card ? card : '·' }}</span></button></div></article></div>
            <button class="reveal-button game-tap mt-5" :disabled="!allVoted" @click="reveal"><Sparkles aria-hidden="true" />{{ allVoted ? 'Kartları aç' : `${4-votes.length} oyuncu bekleniyor` }}</button>
            <div v-if="pokerResult" class="result-banner mt-4" :data-consensus="pokerResult.consensus" aria-live="polite"><Trophy aria-hidden="true" /><div><strong>Öneri: {{ pokerResult.recommendation }} puan</strong><p>{{ pokerResult.consensus ? `Oylar yakın: ${votes.join(' · ')}. Son kontrolü yapıp puanı kaydedin.` : `Oylar uzak: ${votes.join(' · ')}. En düşük ve en yüksek oyu verenler konuşup tekrar oylasın.` }}</p></div></div>
          </section>

          <section v-else-if="stage===3" aria-labelledby="sprint-title">
            <div class="mission-heading"><span class="mission-icon bg-amber-100 text-amber-950"><Target aria-hidden="true" /></span><div><p class="game-kicker text-amber-900">GÖREV 3</p><h2 id="sprint-title" class="text-2xl font-black sm:text-3xl">Sprint Quest</h2><p class="mt-1 text-slate-700">İşleri valize ekle. Güvenli bölge kapasitenin en fazla %85’i.</p></div></div>
            <div class="capacity-meter mt-5"><div class="flex flex-wrap justify-between gap-2"><strong>{{ selectedPoints }} / {{ sprintCapacity }} puan</strong><span>{{ loadPercent }}% dolu</span></div><div class="meter-track"><span :style="{width:`${Math.min(loadPercent,100)}%`}" :data-zone="loadPercent>100?'danger':loadPercent>85?'warning':'safe'"></span></div><p>{{ loadPercent>100 ? 'Valiz taştı. Bir işi çıkar veya 13 puanlık işi böl.' : loadPercent>85 ? 'Tampon bölgesindesiniz. Bir iş daha eklemeyin.' : selectedPoints ? 'Güvenli bölgedesiniz. Sprint hedefi hâlâ tek cümle olmalı.' : 'İş kartlarına dokunarak valizi doldurun.' }}</p></div>
            <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><button v-for="item in work" :key="item.id" class="quest-card game-tap" :class="item.selected?'selected':''" :data-tone="item.tone" :aria-pressed="item.selected" @click="toggleWork(item)"><span class="flex items-center justify-between"><span class="size-token">{{ item.size }}</span><span class="text-2xl font-black">{{ item.points }} SP</span></span><strong class="mt-5 block text-left text-lg">{{ item.title }}</strong><span class="mt-3 flex items-center gap-2 font-bold"><Check v-if="item.selected" :size="20" aria-hidden="true" />{{ item.selected ? 'Valizde' : 'Valize ekle' }}</span></button></div>
          </section>

          <section v-else aria-labelledby="result-title" class="text-center"><div class="mx-auto grid h-24 w-24 place-items-center rounded-full bg-amber-100 text-amber-950"><Trophy :size="52" aria-hidden="true" /></div><p class="game-kicker mt-5 text-amber-900">OYUN TAMAMLANDI</p><h2 id="result-title" class="mt-2 text-3xl font-black sm:text-5xl">Sprint planınız hazır.</h2><p class="mx-auto mt-3 max-w-2xl text-lg text-slate-700">Saatleri kapasite için, Fibonacci’yi göreli büyüklük için kullandınız. 3 sprint sonra geçici saat oranını bırakıp gerçek velocity ile devam edin.</p><div class="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3"><div class="result-stat"><span>Teslimat</span><strong>{{ deliveryHours }} saat</strong></div><div class="result-stat"><span>Taahhüt</span><strong>{{ sprintCapacity }} SP</strong></div><div class="result-stat"><span>Planlanan</span><strong>{{ selectedPoints }} SP</strong></div></div><div class="mx-auto mt-6 max-w-xl rounded-2xl bg-slate-950 p-5 text-white"><p>Takım skoru</p><strong class="text-5xl">{{ xp }} XP</strong><p class="mt-2">Seviye {{ level }} · {{ xp>=100 ? 'Sprint Ustası' : xp>=60 ? 'Takım Oyuncusu' : 'Çaylak Planlayıcı' }}</p></div><button class="btn btn-primary mt-6 min-h-14 px-8" @click="resetGame">Yeni oyun başlat</button></section>

          <footer class="mt-7 flex items-center justify-between gap-3 border-t border-slate-200 pt-5"><button class="btn min-h-12" :disabled="stage===1" @click="go(stage-1)"><ArrowLeft aria-hidden="true" /> Geri</button><span class="font-bold">{{ stage }}/4</span><button v-if="stage<4" class="btn btn-primary min-h-12" :disabled="!canContinue" @click="go(stage+1)">{{ stage===3?'Sonucu gör':'Görevi tamamla' }} <ArrowRight aria-hidden="true" /></button></footer>
        </div>

        <aside class="space-y-4"><section class="rounded-2xl border border-white/70 bg-white/85 p-5 shadow-lg"><div class="flex items-center gap-3"><Users class="text-blue-800" aria-hidden="true" /><h2 class="text-xl font-black">Takım Lobisi</h2></div><div class="mt-4 grid grid-cols-4 gap-2 xl:grid-cols-2"><div v-for="person in team" :key="person.name" class="text-center"><span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-100 font-black text-blue-950">{{ person.name[0] }}</span><strong class="mt-1 block">{{ person.name }}</strong></div></div></section><section class="rounded-2xl bg-[#172554] p-5 text-white shadow-lg"><div class="flex items-center gap-3"><BarChart3 aria-hidden="true" /><h2 class="text-xl font-black">Canlı Skor</h2></div><dl class="mt-4 space-y-3"><div class="score-row"><dt>Brüt kapasite</dt><dd>792 saat</dd></div><div class="score-row"><dt>Teslimat gücü</dt><dd>{{ deliveryHours }} saat</dd></div><div class="score-row"><dt>Sprint zarfı</dt><dd>{{ sprintCapacity }} SP</dd></div><div class="score-row"><dt>XP</dt><dd>{{ xp }}/100</dd></div></dl></section><button class="btn min-h-14 w-full bg-white" @click="rulesOpen=true"><CircleHelp aria-hidden="true" /> Kuralları aç</button></aside>
      </section>
    </main>

    <nav class="game-bottom-nav fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-300 bg-white/95 backdrop-blur lg:hidden" aria-label="Oyun görevleri"><button v-for="(name,index) in stageNames" :key="name" class="game-tap flex min-h-[4.5rem] flex-col items-center justify-center gap-1 px-1" :class="stage===index+1?'active':''" @click="go(index+1)"><span class="stage-mini">{{ index+1 }}</span><span class="truncate text-base font-bold">{{ name.split(' ')[0] }}</span></button></nav>

    <div v-if="rulesOpen" class="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="rules-title" @keydown.esc="rulesOpen=false"><button class="absolute inset-0 bg-slate-950/70" aria-label="Kuralları kapat" @click="rulesOpen=false"></button><section class="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[1.75rem] bg-white p-5 pb-safe shadow-2xl md:inset-auto md:left-1/2 md:top-1/2 md:w-[42rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"><div class="flex items-center justify-between"><h2 id="rules-title" class="text-2xl font-black">Oyunun 5 kuralı</h2><button class="game-icon-btn !text-slate-950" aria-label="Kapat" @click="rulesOpen=false"><X aria-hidden="true" /></button></div><ol class="mt-5 space-y-4"><li class="rule-row"><span>1</span><p><strong>198 saat brüt kapasitedir.</strong> İzin, destek ve toplantılar sprint sözü değildir.</p></li><li class="rule-row"><span>2</span><p><strong>Puan saat değildir.</strong> Kapsam, karmaşıklık ve belirsizliği birlikte karşılaştırır.</p></li><li class="rule-row"><span>3</span><p><strong>13 puan bölünür.</strong> Sprint içine belirsiz dev paket alınmaz.</p></li><li class="rule-row"><span>4</span><p><strong>%15 tampon bırakılır.</strong> Planı kapasitenin sonuna kadar doldurmayın.</p></li><li class="rule-row"><span>5</span><p><strong>Velocity yalnız Done işlerden gelir.</strong> 3 sprint sonra saat/puan tahminini bırakın.</p></li></ol><details class="mt-5 rounded-xl bg-slate-100 p-4"><summary class="font-black">Hesap nasıl yapılıyor?</summary><p class="mt-3">Kullanılabilir saat = 792 − kapalı saatler. Teslimat saati = kullanılabilir saat × teslimat payı. İlk ay puanı = teslimat saati ÷ 6. Sprint taahhüdü = aylık puan ÷ sprint sayısı × 0,85.</p></details></section></div>
  </div>
</template>

<style scoped>
.game-shell{background:radial-gradient(circle at 10% 0%,#dbeafe 0,transparent 28%),radial-gradient(circle at 92% 8%,#ede9fe 0,transparent 26%),linear-gradient(180deg,#eef2ff 0%,#f8fafc 55%,#ecfeff 100%)}
.game-hero{background:linear-gradient(125deg,#111b3a 0%,#172554 48%,#164e63 100%)}
.game-kicker{font-family:"Fira Code",monospace;font-weight:800;letter-spacing:.08em}
.game-nav-link{display:grid;min-height:44px;place-items:center;border-radius:.65rem;padding:.45rem .8rem;font-weight:800;color:white}.game-nav-link.active{background:white;color:#111827}
.game-icon-btn{display:grid;min-height:48px;min-width:48px;place-items:center;border-radius:.85rem;color:white}.game-icon-btn:hover{background:rgba(255,255,255,.12)}
.level-pill{display:flex;min-height:40px;align-items:center;gap:.35rem;border-radius:999px;background:#fef3c7;padding:.35rem .75rem;font-weight:900;color:#78350f;white-space:nowrap}
.score-orb{display:grid;height:7rem;width:7rem;place-items:center;border:3px solid rgba(255,255,255,.65);border-radius:999px;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 8px rgba(255,255,255,.06)}
.stage-step{display:flex;min-height:56px;width:100%;align-items:center;justify-content:center;gap:.5rem;border:2px solid rgba(255,255,255,.25);border-radius:1rem;background:rgba(255,255,255,.08);font-weight:800}.stage-step.active{border-color:#fef3c7;background:#fef3c7;color:#78350f}.stage-step.done{background:#dcfce7;color:#14532d}.stage-number{display:grid;height:1.8rem;width:1.8rem;place-items:center;border-radius:999px;background:rgba(255,255,255,.18)}
.mission-heading{display:flex;align-items:flex-start;gap:1rem}.mission-icon{display:grid;height:3.25rem;width:3.25rem;flex:none;place-items:center;border-radius:1rem}
.player-card,.poker-seat{border:2px solid #cbd5e1;border-radius:1.25rem;padding:1rem}.player-card[data-tone="mint"]{background:#ecfdf5}.player-card[data-tone="blue"]{background:#eff6ff}.player-card[data-tone="peach"]{background:#fff7ed}.player-card[data-tone="lilac"]{background:#f5f3ff}
.avatar-token{display:grid;height:3rem;width:3rem;place-items:center;border-radius:999px;background:#172554;color:white;font-size:1.25rem;font-weight:900}.counter-btn{min-height:52px;min-width:64px;border:2px solid #172554;border-radius:1rem;background:white;font-weight:900}.counter-btn:active{background:#dbeafe}
.game-field{border:2px solid #cbd5e1;border-radius:1.25rem;background:#f8fafc;padding:1rem}.game-field legend{font-size:1.1rem;font-weight:900}.game-field p{color:#475569}.choice-deck{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:1rem}.game-choice{min-height:52px;border:2px solid #94a3b8;border-radius:.9rem;background:white;font-weight:900}.game-choice[aria-pressed="true"]{border-color:#172554;background:#172554;color:white}
.story-banner{display:flex;align-items:center;justify-content:space-between;gap:1rem;border:2px solid #93c5fd;border-radius:1.25rem;background:#eff6ff;padding:1rem}.poker-seat[data-ready="true"]{border-color:#6d28d9;background:#f5f3ff}.ready-pill{border-radius:999px;background:#e2e8f0;padding:.25rem .6rem;font-weight:800}.poker-card{aspect-ratio:.72;min-height:58px;border:2px solid #94a3b8;border-radius:.75rem;background:white;font-size:1.1rem;font-weight:900}.poker-card.selected{border-color:#6d28d9;background:#6d28d9;color:white;box-shadow:0 8px 0 #4c1d95}.reveal-button{display:flex;min-height:60px;width:100%;align-items:center;justify-content:center;gap:.6rem;border-radius:1rem;background:#172554;color:white;font-size:1.15rem;font-weight:900}.reveal-button:disabled{background:#cbd5e1;color:#475569}.result-banner{display:flex;gap:1rem;border:2px solid #166534;border-radius:1rem;background:#dcfce7;padding:1rem;color:#14532d}.result-banner[data-consensus="false"]{border-color:#92400e;background:#fef3c7;color:#78350f}
.capacity-meter{border:2px solid #cbd5e1;border-radius:1.25rem;background:#f8fafc;padding:1rem}.meter-track{height:1rem;overflow:hidden;border-radius:999px;background:#e2e8f0;margin:.75rem 0}.meter-track span{display:block;height:100%;background:#166534;transition:width 240ms ease}.meter-track span[data-zone="warning"]{background:#92400e}.meter-track span[data-zone="danger"]{background:#991b1b}.quest-card{min-height:11rem;border:3px solid #cbd5e1;border-radius:1.25rem;padding:1rem;background:white}.quest-card[data-tone="mint"]{background:#ecfdf5}.quest-card[data-tone="blue"]{background:#eff6ff}.quest-card[data-tone="lilac"]{background:#f5f3ff}.quest-card[data-tone="peach"]{background:#fff7ed}.quest-card[data-tone="rose"]{background:#fff1f2}.quest-card[data-tone="yellow"]{background:#fffbeb}.quest-card.selected{border-color:#172554;box-shadow:0 8px 0 #172554;transform:translateY(-4px)}.size-token{border-radius:999px;background:white;padding:.3rem .65rem;font-weight:900}
.result-stat{border:2px solid #cbd5e1;border-radius:1rem;background:#f8fafc;padding:1rem}.result-stat span,.result-stat strong{display:block}.result-stat strong{margin-top:.25rem;font-size:1.5rem}.score-row{display:flex;justify-content:space-between;gap:1rem}.score-row dd{font-weight:900}.game-bottom-nav{padding-bottom:env(safe-area-inset-bottom)}.game-bottom-nav button.active{background:#dbeafe;color:#172554}.stage-mini{display:grid;height:1.75rem;width:1.75rem;place-items:center;border-radius:999px;background:#e2e8f0;font-weight:900}.game-bottom-nav .active .stage-mini{background:#172554;color:white}.rule-row{display:flex;gap:1rem;align-items:flex-start}.rule-row>span{display:grid;height:2.25rem;width:2.25rem;flex:none;place-items:center;border-radius:999px;background:#172554;color:white;font-weight:900}
@media(max-width:639px){.score-orb{height:5.5rem;width:5.5rem}.story-banner{align-items:flex-start;flex-direction:column}.poker-card{min-height:52px}.game-board{min-height:62dvh}.level-pill{font-size:.9rem}.game-header .game-nav-link{padding-inline:.6rem}}
@media(prefers-reduced-motion:reduce){.meter-track span,.quest-card{transition:none}.quest-card.selected{transform:none}}
</style>
