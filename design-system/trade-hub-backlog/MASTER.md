# İstoç B2B Backlog — Tasarım Sistemi

**Ürün:** B2B pazar yeri eylem planı ve proje yönetim motoru
**Yaklaşım:** Gerçek mobile-first SaaS; 320 px’den masaüstüne kadar
**Yoğunluk:** 4/10 — rahat, taranabilir, tek elle kullanılabilir
**Erişilebilirlik hedefi:** WCAG 2.2 AAA metin kontrastı; klavye, ekran okuyucu ve dokunma eşdeğerliği

## Temel kurallar

- Gövde metni en az `1rem`; açıklamalar küçültülmez.
- Dokunma hedefleri en az `48 × 48 px`; kontroller arasında en az `8 px` boşluk bulunur.
- Metin kontrastı açık pastel yüzeylerde en az `7:1`; renk tek başına anlam taşımaz.
- Odak göstergesi 4 px, yüksek kontrastlı ve bileşenin dışındadır.
- Mobilde tablolar okunamaz hâle gelmez: aynı veri kart listesine dönüşür.
- Native select yerine adı ve mevcut değeri açıkça görünen seçim düğmesi ile alt sayfa kullanılır.
- Ana eylemler ekranın altından başparmakla erişilebilir; safe-area hesaba katılır.
- Hareket azaltma tercihi korunur; titreşim yalnız desteklenen dokunmatik cihazlarda kısa geri bildirim verir.
- Yatay taşma, kırpılan etiket, iki satıra bölünen kimlik ve yalnız ikonla anlatılan eylem kabul edilmez.

## Renk ve tipografi

| Rol | Değer |
|---|---|
| Ana lacivert | `#172554` |
| Vurgu mavisi | `#075985` |
| Ana metin | `#111827` |
| İkincil metin | `#334155` |
| Pastel zemin | `#F3F6FB` |
| Kart | `#FFFFFF` |
| Sınır | `#CBD5E1` |
| Başarı | `#166534` |
| Uyarı | `#92400E` |
| Hata | `#991B1B` |

Başlıklar Fira Code, gövde Fira Sans kullanır. Sayısal değerlerde tabular rakamlar kullanılır.

## Görev uygulaması

- Mobil araç çubuğu sırası: ara → filtre → sırala + grupla → özet.
- Kartta birincil bilgi sırası: ID, başlık, kısa amaç, öncelik/risk/efor, bağlam.
- Durum ve öncelik değişimi büyük seçim düğmeleriyle yapılır.
- Filtreler başlıklı accordion gruplarıdır; aktif değerler hem metin hem seçili durumla görünür.
- Masaüstü tablo, Kanban, zaman çizelgesi ve diğer görünümler aynı görev ayrıntı modelini açar.

## Efor oyunu

Efor ayrı bir görsel evrendir. Oyun döngüsü dört kısa aşamadır:

1. Kapasite Laboratuvarı — ekip uygunluğunu belirle.
2. Poker Arenası — Fibonacci oylarını gizli ver ve aç.
3. Sprint Görevi — kapasiteye göre işleri seç.
4. Sonuç — plan güvenini, taşmayı ve ekip yükünü gör.

Oyuncu her aşamada tek bir karar verir. XP, seviye ve ilerleme görünürdür; oyun süsleri içerikten daha yüksek kontrastta değildir. Kurallar yardım penceresinde, ana akış ise kısa ve eylem odaklıdır.

## Teslim kontrolü

- 320, 390, 768, 1024 ve 1440 px genişlikte yatay taşma yok.
- Klavye ile tüm etkileşimler çalışıyor; görünür odak kaybolmuyor.
- Dokunma hedefleri 48 px; hover olmadan bütün işlevler erişilebilir.
- Açılır seçimler taşmıyor ve mevcut değeri açıklıyor.
- Kart, Kanban, filtre, görev ayrıntısı ve Efor oyun döngüsü işlevsel.
- `prefers-reduced-motion` ve safe-area destekleniyor.
