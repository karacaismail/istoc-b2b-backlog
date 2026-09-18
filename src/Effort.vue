<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ArrowRight, Award, Calculator, CheckCircle2, CircleHelp, Gauge, RotateCcw, Sparkles, Users } from 'lucide-vue-next'

type Developer = { name: string; unavailable: number; vote: number | null }
type WorkItem = { id: string; title: string; points: number; size: string; selected: boolean }

const MONTHLY_HOURS = 198
const baseUrl = import.meta.env.BASE_URL
const fibonacci = [1, 2, 3, 5, 8, 13]
const team = reactive<Developer[]>([
  { name: 'Ahmet', unavailable: 0, vote: null },
  { name: 'Bora', unavailable: 0, vote: null },
  { name: 'Ali', unavailable: 0, vote: null },
  { name: 'Metin', unavailable: 0, vote: null },
])
const deliveryShare = ref(65)
const hoursPerPoint = ref(6)
const sprintCount = ref(2)
const velocityInputs = reactive([0, 0, 0])
const revealed = ref(false)
const storyIndex = ref(0)

const stories = [
  { title: 'Şifre sıfırlama e-postasının metnini değiştir', hint: 'Akış aynı, yalnız doğrulanmış metin değişiyor.' },
  { title: 'Satıcı fiyat listesine müşteri grubu koşulu ekle', hint: 'UI, backend kuralı ve test birlikte düşünülmeli.' },
  { title: 'Escrow için kısmi iade akışını geliştir', hint: 'Para, sipariş durumu, audit ve hata senaryoları var.' },
  { title: 'Yeni ülke için e-fatura entegrasyonu yap', hint: 'Harici servis ve mevzuat belirsizliği yüksek; bölmek gerekebilir.' },
]

const work = reactive<WorkItem[]>([
  { id: 'A', title: 'Basit validasyon ve hata mesajı', points: 1, size: 'XS', selected: false },
  { id: 'B', title: 'Profil alanı ve API güncellemesi', points: 2, size: 'S', selected: false },
  { id: 'C', title: 'Fiyat kuralı ve kabul testleri', points: 3, size: 'M', selected: false },
  { id: 'D', title: 'Yeni ödeme durumu iş akışı', points: 5, size: 'L', selected: false },
  { id: 'E', title: 'Escrow kısmi iade dilimi', points: 8, size: 'XL', selected: false },
  { id: 'F', title: 'Belirsiz entegrasyon paketi', points: 13, size: 'Böl', selected: false },
])

const grossHours = computed(() => team.length * MONTHLY_HOURS)
const availableHours = computed(() => team.reduce((sum, person) => sum + Math.max(0, MONTHLY_HOURS - person.unavailable), 0))
const deliveryHours = computed(() => Math.round(availableHours.value * deliveryShare.value / 100))
const starterMonthlyPoints = computed(() => Math.floor(deliveryHours.value / hoursPerPoint.value))
const validVelocities = computed(() => velocityInputs.filter(value => value > 0))
const averageVelocity = computed(() => validVelocities.value.length ? validVelocities.value.reduce((a, b) => a + b, 0) / validVelocities.value.length : 0)
const monthlyPoints = computed(() => Math.floor(averageVelocity.value > 0 ? averageVelocity.value * sprintCount.value : starterMonthlyPoints.value))
const sprintCapacity = computed(() => Math.max(1, Math.floor(monthlyPoints.value / sprintCount.value * .85)))
const selectedPoints = computed(() => work.filter(item => item.selected).reduce((sum, item) => sum + item.points, 0))
const loadPercent = computed(() => Math.round(selectedPoints.value / sprintCapacity.value * 100))
const allVoted = computed(() => team.every(person => person.vote !== null))
const votes = computed(() => team.map(person => person.vote).filter((vote): vote is number => vote !== null))
const spread = computed(() => votes.value.length ? Math.max(...votes.value) - Math.min(...votes.value) : 0)
const pokerResult = computed(() => {
  if (!revealed.value || !votes.value.length) return null
  const ordered = [...votes.value].sort((a, b) => a - b)
  const median = ordered[Math.floor((ordered.length - 1) / 2)]
  return { recommendation: median, consensus: spread.value <= 2 && !votes.value.includes(13) }
})
const gameScore = computed(() => (allVoted.value ? 10 : 0) + (pokerResult.value?.consensus ? 10 : 0) + (loadPercent.value > 0 && loadPercent.value <= 85 ? 10 : 0))

function resetPoker(next = false) {
  team.forEach(person => { person.vote = null })
  revealed.value = false
  if (next) storyIndex.value = (storyIndex.value + 1) % stories.length
}

function resetAll() {
  team.forEach(person => { person.unavailable = 0; person.vote = null })
  deliveryShare.value = 65
  hoursPerPoint.value = 6
  sprintCount.value = 2
  velocityInputs.splice(0, 3, 0, 0, 0)
  work.forEach(item => { item.selected = false })
  storyIndex.value = 0
  revealed.value = false
}
</script>

<template>
  <div class="min-h-dvh bg-base-200 pb-16">
    <header class="sticky top-0 z-40 border-b border-base-300 bg-base-100/95 backdrop-blur">
      <div class="mx-auto flex min-h-16 max-w-[1500px] items-center gap-3 px-3 sm:px-5">
        <a class="hidden font-heading text-lg font-bold md:block" :href="baseUrl">İstoç B2B</a>
        <nav class="flex rounded-lg border border-base-300 bg-base-200 p-1" aria-label="Ana sayfalar">
          <a class="btn btn-ghost btn-sm min-h-10" :href="baseUrl">Tasks</a>
          <a class="btn btn-sm min-h-10 bg-base-100 font-bold" :href="`${baseUrl}efor/`" aria-current="page">Efor</a>
        </nav>
        <div class="ml-auto flex items-center gap-2"><span class="badge badge-accent badge-lg">{{ gameScore }}/30 XP</span><button class="btn btn-ghost btn-square touch" aria-label="Simülasyonu sıfırla" @click="resetAll"><RotateCcw /></button></div>
      </div>
    </header>

    <main id="main" class="mx-auto max-w-[1500px] space-y-7 p-3 sm:p-5 lg:p-7">
      <section class="rounded-2xl bg-primary p-5 text-primary-content shadow-lg sm:p-8">
        <p class="mono opacity-80">SCRUM EFOR KILAVUZU + OYUN</p>
        <h1 class="mt-2 max-w-4xl text-3xl font-bold leading-tight sm:text-4xl">Saat kapasiteyi anlatır. Story point işin büyüklüğünü anlatır.</h1>
        <p class="mt-4 max-w-4xl text-lg leading-relaxed opacity-90">198 saat bordro ve bulunabilirlik hedefidir; 198 saatin tamamı sprint işi değildir. Toplantı, destek, inceleme, öğrenme ve beklemeler vardır. Bu yüzden önce gerçek teslimat saatini bulur, sonra Fibonacci ile göreli tahmin yaparız. Üç sprint sonra saat tahminini bırakıp gerçek velocity kullanırız.</p>
      </section>

      <section class="grid gap-4 lg:grid-cols-3">
        <article class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-5"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-content"><Users /></span><h2 class="card-title text-xl">1. Kim müsait?</h2></div><p class="leading-relaxed">Kişi başı 198 saatten izin, eğitim ve ayrılmış destek saatini çıkar. Kalanın yalnız teslimata ayrılabilen yüzdesini kullan.</p></div></article>
        <article class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-5"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-content"><CircleHelp /></span><h2 class="card-title text-xl">2. İş ne kadar büyük?</h2></div><p class="leading-relaxed">Ekip aynı işi 1, 2, 3, 5, 8 veya 13 kartıyla oylar. Puan; kapsam, karmaşıklık ve belirsizliğin birlikte büyüklüğüdür.</p></div></article>
        <article class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-5"><div class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-content"><Gauge /></span><h2 class="card-title text-xl">3. Ne kadar söz verelim?</h2></div><p class="leading-relaxed">İlk ay temkinli başlangıç tahmini kullan. Sonraki aylarda tamamlanan son üç sprintin ortalamasının yaklaşık %85’ini taahhüt et.</p></div></article>
      </section>

      <section class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body gap-5 p-4 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3"><div><p class="mono text-accent">TOLGA İÇİN TEK TABLO</p><h2 class="card-title text-2xl">T-shirt etiketi → Fibonacci kartı</h2></div><span class="badge badge-warning badge-lg">13 puan sprint öncesi bölünür</span></div>
        <div class="overflow-x-auto"><table class="table text-base"><thead><tr><th>T-shirt</th><th>Kart</th><th>İlk günlerdeki zaman ipucu</th><th>Ne anlama gelir?</th></tr></thead><tbody>
          <tr><td class="font-bold">XS</td><td><span class="badge badge-neutral badge-lg">1</span></td><td>2–4 odak saati</td><td>Tek, açık ve düşük riskli değişiklik</td></tr>
          <tr><td class="font-bold">S</td><td><span class="badge badge-neutral badge-lg">2</span></td><td>5–8 odak saati</td><td>Küçük değişiklik ve testi</td></tr>
          <tr><td class="font-bold">M</td><td><span class="badge badge-neutral badge-lg">3</span></td><td>1–2 odak günü</td><td>Birkaç katmana dokunan anlaşılır iş</td></tr>
          <tr><td class="font-bold">L</td><td><span class="badge badge-neutral badge-lg">5</span></td><td>2–3 odak günü</td><td>Birden fazla akış veya belirgin risk</td></tr>
          <tr><td class="font-bold">XL</td><td><span class="badge badge-neutral badge-lg">8</span></td><td>3–4 odak günü</td><td>Büyük fakat sprint içinde bitebilir dilim</td></tr>
          <tr><td class="font-bold">Böl</td><td><span class="badge badge-error badge-lg">13</span></td><td>Kesin süre verme</td><td>Belirsiz veya fazla büyük; araştırma ve teslimat dilimlerine ayır</td></tr>
        </tbody></table></div>
        <div class="alert alert-info"><CircleHelp class="shrink-0" /><span>Saat aralıkları ilk üç sprintte ortak dil kurmak içindir. Story point sözleşme süresi değildir; kişi bazında performans ölçmez ve “1 puan = daima 6 saat” denmez.</span></div>
      </div></section>

      <section class="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <article class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-4 sm:p-6">
          <div class="flex items-center gap-3"><Calculator class="text-accent" /><h2 class="card-title text-2xl">Aylık kapasite simülatörü</h2></div>
          <p>Her geliştirici için bu ay teslimata kapalı saatleri gir. İzin, eğitim, nöbet veya başka projeyi tek yerde topla.</p>
          <div class="grid gap-3 sm:grid-cols-2"><label v-for="person in team" :key="person.name" class="rounded-xl border border-base-300 p-4"><span class="mb-2 block font-bold">{{ person.name }} · 198 saat</span><span class="mb-2 block">Kapalı saat</span><input v-model.number="person.unavailable" class="input input-bordered min-h-12 w-full text-base" type="number" min="0" max="198" /></label></div>
          <label class="block rounded-xl bg-base-200 p-4"><span class="mb-2 flex justify-between gap-3 font-bold"><span>Teslimata ayrılan pay</span><span>%{{ deliveryShare }}</span></span><input v-model.number="deliveryShare" class="range range-accent" type="range" min="40" max="85" step="5" /><span class="mt-2 block text-base-content/70">Başlangıç önerisi %65. Scrum etkinlikleri, code review, destek ve kesintiler kalan paydadır.</span></label>
          <div class="grid gap-3 sm:grid-cols-3"><div class="stat rounded-xl bg-base-200 p-4"><div class="stat-title text-base">Brüt</div><div class="stat-value text-3xl">{{ grossHours }}</div><div class="stat-desc text-base">saat / ay</div></div><div class="stat rounded-xl bg-base-200 p-4"><div class="stat-title text-base">Kullanılabilir</div><div class="stat-value text-3xl">{{ availableHours }}</div><div class="stat-desc text-base">kapalı saatlerden sonra</div></div><div class="stat rounded-xl bg-primary p-4 text-primary-content"><div class="stat-title text-base opacity-75">Teslimat</div><div class="stat-value text-3xl">{{ deliveryHours }}</div><div class="stat-desc text-base opacity-75">odak saati / ay</div></div></div>
        </div></article>

        <article class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body p-4 sm:p-6">
          <h2 class="card-title text-2xl">Velocity kalibrasyonu</h2><p>Son üç sprintte gerçekten “Done” olan puanları yaz. Boş bırakırsan ilk ay için geçici saat tahmini kullanılır.</p>
          <div class="grid grid-cols-3 gap-2"><label v-for="(_, index) in velocityInputs" :key="index"><span class="mb-2 block font-bold">Sprint {{ index + 1 }}</span><input v-model.number="velocityInputs[index]" class="input input-bordered min-h-12 w-full text-base" type="number" min="0" max="200" /></label></div>
          <label class="block"><span class="mb-2 block font-bold">Ay içindeki sprint sayısı</span><select v-model.number="sprintCount" class="select select-bordered min-h-12 w-full text-base"><option :value="2">2 sprint</option><option :value="3">3 kısa sprint</option><option :value="4">4 haftalık akış</option></select></label>
          <label v-if="!averageVelocity" class="block"><span class="mb-2 flex justify-between font-bold"><span>İlk ay kalibrasyonu</span><span>1 puan ≈ {{ hoursPerPoint }} odak saati</span></span><input v-model.number="hoursPerPoint" class="range range-accent" type="range" min="4" max="10" step="1" /></label>
          <div class="rounded-xl border-2 border-accent bg-accent/10 p-5"><p class="font-bold">Bu ay için planlama zarfı</p><p class="mt-1 text-4xl font-bold">{{ monthlyPoints }} puan</p><p class="mt-2">Sprint başına güvenli taahhüt: <strong>{{ sprintCapacity }} puan</strong>. %15 tampon bilinmeyenler ve küçük kesintiler içindir.</p></div>
          <p class="text-base-content/70">{{ averageVelocity ? `Kaynak: son ${validVelocities.length} sprint ortalaması (${averageVelocity.toFixed(1)} puan).` : `Kaynak: ${deliveryHours} teslimat saati ÷ ${hoursPerPoint} saat/puan. Bu yalnız ilk ay başlangıç tahminidir.` }}</p>
        </div></article>
      </section>

      <section class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body gap-5 p-4 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-3"><div><p class="mono text-accent">SCRUM GAME 1</p><h2 class="card-title text-2xl">Planning Poker</h2><p class="mt-2">Önce herkes kartını gizlice seçer. Sonra birlikte açılır. En yüksek ve en düşük oyu veren kişi varsayımını anlatır.</p></div><button class="btn btn-outline min-h-11" @click="resetPoker(true)">Sonraki hikâye <ArrowRight /></button></div>
        <div class="rounded-xl bg-primary p-5 text-primary-content"><p class="opacity-75">Tahmin edilecek hikâye</p><h3 class="mt-1 text-xl font-bold">{{ stories[storyIndex].title }}</h3><p class="mt-2 opacity-80">{{ stories[storyIndex].hint }}</p></div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><article v-for="person in team" :key="person.name" class="rounded-xl border border-base-300 p-4"><div class="mb-3 flex items-center justify-between"><h3 class="font-bold">{{ person.name }}</h3><span class="badge" :class="person.vote ? 'badge-success' : 'badge-ghost'">{{ person.vote ? 'Hazır' : 'Bekliyor' }}</span></div><div class="grid grid-cols-3 gap-2"><button v-for="card in fibonacci" :key="card" class="btn min-h-12 text-lg" :class="person.vote === card ? 'btn-accent' : 'btn-outline'" :aria-pressed="person.vote === card" @click="person.vote=card; revealed=false">{{ revealed ? (person.vote === card ? card : '·') : (person.vote === card ? '✓' : card) }}</button></div></article></div>
        <div class="flex flex-wrap items-center gap-3"><button class="btn btn-primary min-h-12" :disabled="!allVoted" @click="revealed=true"><Sparkles /> Kartları aç</button><button class="btn btn-ghost min-h-12" @click="resetPoker()">Turu sıfırla</button><span v-if="!allVoted" class="text-base-content/65">Dört oy tamamlanınca kartlar açılır.</span></div>
        <div v-if="pokerResult" class="alert" :class="pokerResult.consensus ? 'alert-success' : 'alert-warning'"><CheckCircle2 v-if="pokerResult.consensus" class="shrink-0" /><CircleHelp v-else class="shrink-0" /><span><strong>Oylar: {{ votes.join(' · ') }}.</strong> Öneri {{ pokerResult.recommendation }} puan. {{ pokerResult.consensus ? 'Yakınsınız; son kısa kontrolü yapıp puanı kaydedin.' : 'Fark büyük. En düşük ve en yüksek oyu verenler varsayımlarını anlatsın, işi netleştirip tekrar oylayın.' }}</span></div>
      </div></section>

      <section class="card border border-base-300 bg-base-100 shadow-sm"><div class="card-body gap-5 p-4 sm:p-6">
        <div><p class="mono text-accent">SCRUM GAME 2</p><h2 class="card-title text-2xl">Sprint valizini doldur</h2><p class="mt-2">Kartlara dokunup sprint’e al. Amaç kapasiteyi sonuna kadar sıkıştırmak değil; güvenli taahhüdün içinde anlamlı bir sprint hedefi kurmak.</p></div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3"><button v-for="item in work" :key="item.id" class="min-h-28 rounded-xl border-2 p-4 text-left transition" :class="item.selected ? 'border-accent bg-accent/10' : 'border-base-300 bg-base-100 hover:border-accent/50'" :aria-pressed="item.selected" @click="item.selected=!item.selected"><span class="flex items-center justify-between gap-3"><strong>{{ item.size }} · {{ item.points }} puan</strong><CheckCircle2 v-if="item.selected" class="text-accent" /></span><span class="mt-2 block">{{ item.title }}</span></button></div>
        <div class="rounded-xl bg-base-200 p-4"><div class="mb-2 flex flex-wrap justify-between gap-2 font-bold"><span>{{ selectedPoints }} / {{ sprintCapacity }} puan seçildi</span><span>%{{ loadPercent }}</span></div><progress class="progress h-4 w-full" :class="loadPercent > 100 ? 'progress-error' : loadPercent > 85 ? 'progress-warning' : 'progress-success'" :value="Math.min(loadPercent, 100)" max="100"></progress><p class="mt-3" :class="loadPercent > 100 ? 'text-error' : ''">{{ loadPercent > 100 ? 'Valiz taşmış durumda. Büyük işi böl veya bir kartı sonraki sprint’e bırak.' : loadPercent > 85 ? 'Tampona girdiniz. Yalnız ekip gerçekten eminse burada kalın.' : selectedPoints ? 'Sağlıklı bölgede. Sprint hedefini tek cümlede açıklayabiliyorsanız plan yapılabilir.' : 'Kart seçerek başlayın.' }}</p></div>
      </div></section>

      <section class="grid gap-4 lg:grid-cols-2"><article class="rounded-2xl border border-base-300 bg-base-100 p-5"><h2 class="text-xl font-bold">Her sprintte uygulanacak 6 adım</h2><ol class="mt-4 space-y-3"><li v-for="(text, index) in ['Sprint hedefini tek cümlede yaz.','Hazır olmayan işi oylama.','Herkes aynı anda Fibonacci kartı seçsin.','Fark varsa varsayımları konuşup tekrar oyla.','13 puan çıkan işi böl.','Sprint sonunda yalnız Done puanlarını velocity’ye yaz.']" :key="text" class="flex gap-3"><span class="badge badge-neutral badge-lg shrink-0">{{ index+1 }}</span><span>{{ text }}</span></li></ol></article><article class="rounded-2xl bg-primary p-5 text-primary-content"><div class="flex items-center gap-3"><Award /><h2 class="text-xl font-bold">Oyunun kazanma şartı</h2></div><p class="mt-4 text-lg leading-relaxed">Dört kişi oy verdiğinde 10 XP, oylar yakınsadığında 10 XP, sprint valizi %85’in altında kaldığında 10 XP kazanırsınız. Gerçek başarı ise sprint sonunda söz verilen işin “Done” olmasıdır.</p><div class="mt-5 text-5xl font-bold">{{ gameScore }}/30 XP</div></article></section>
    </main>
  </div>
</template>
