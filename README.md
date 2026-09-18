# İstoç B2B Backlog Explorer

İstoç B2B pazaryeri için kanonik görev veri kümesini mobil öncelikli bir çalışma alanına dönüştürür. Uygulama görevleri küme, öncelik, durum, görev türü, MoSCoW, Eisenhower, risk ve keşif kaynağına göre filtreler; liste, tablo, kanban, zaman çizelgesi, kart, pivot, matris ve bağımlılık görünümleri sunar.

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
