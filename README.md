# İstoç B2B Backlog Explorer

İstoç B2B pazaryeri için kanonik görev veri kümesini mobil öncelikli bir çalışma alanına dönüştürür. Uygulama görevleri küme, öncelik, durum, görev türü, MoSCoW, Eisenhower, risk ve keşif kaynağına göre filtreler; liste, tablo, kanban, zaman çizelgesi, kart, pivot, matris ve bağımlılık görünümleri sunar.

Sayfalar:

- `/`: görev ve eylem planı çalışma alanı
- `/efor/`: PixiJS + Pixi UI ile taktik masa oyunu: ekip kaynakları, gizli Planning Poker, görev kartları, sürpriz olay ve kopyalanabilir sprint planı

Yerel çalışma:

```bash
pnpm install
pnpm dev
```

Üretim doğrulaması:

```bash
pnpm run build
```

GitHub Actions, depoya eklenmiş yayıma hazır veriyi kullanarak `pnpm run build:site` çalıştırır. Kanonik veri deposu yerelde bir üst dizinde bulunduğu için tam `pnpm run build` komutu veri üretimini de içerir.

`scripts/generate-data.py`, `../istoc-backlog/istoc-backlog.json` kaynağından yayıma uygun `public/data/backlog.json` dosyasını üretir. Yerel yollar, kaynak hashleri ve kaynak dosya ayrıntıları yayımlanan veriden çıkarılır.

Çalışma alanındaki durum, sorumlu, tarih, not, kontrol listesi, seçim, yıldız ve görünümden kaldırma değişiklikleri tarayıcının yerel deposunda saklanır; JSON olarak dışa aktarılabilir.

## Efor oyunu

Efor kendi CSS ve oyun motoru paketini yükler; Tasks sayfasının görünümü ayrı kalır. Saat kapasitesi ve story point tahmini `src/game/model.ts` içinde görsel katmandan bağımsızdır. İlk açılıştaki sprint geçmişi örnektir; gerçek ölçüm ayarlardan girilebilir. Aynı cihazda sıra usulü oynanır, ilerleme tarayıcıda saklanır.

```bash
pnpm run test:effort
pnpm run test:game-ui
pnpm run build:site
```

UI testleri yerel Chrome kullanır ve Vite sunucusunu otomatik başlatır. Alternatif cihaz/CI kurulumu için Playwright yapılandırmasındaki `channel` değiştirilebilir. Oyun tasarım kuralları `design-system/pages/efor.md`, görsel lisansları `public/game/CREDITS.md` içindedir.
