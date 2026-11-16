# Ne Giysem? — v2 Yol Haritası ve Geliştirme Yönergesi

> Bu dosya, v1 "Ne Giysem?" uygulamasını çok ekranlı, kişiselleştirilen, gardıroplu bir
> giyinme asistanına dönüştüren yol haritasını içerir. Fazlar sırayla uygulanır;
> her fazın kabul kriterleri geçilmeden sonrakine geçilmez.

## A. MEVCUT DURUM ANALİZİ (v1 ekran görüntülerinden)

| # | Bulgu | Neden sorun | Çözüm |
|---|---|---|---|
| A1 | Şehir Ara sheet'i klavyenin altında kalıyor | Sheet klavye yüksekliğini dikkate almıyor | 7.7 |
| A2 | Sheet yarı saydam; arkadaki kart üst üste biniyor | Blur/şeffaflık okunabilirliği bozuyor | 7.7 |
| A3 | Karanlık temada kontrast AA altı | Tema otomatik terslenmiş | 7.3 |
| A4 | Ayar düğmesi hava kartının sağına taşıyor | Çakışan öğe | 5.1 |
| A5 | Rüzgâr birimi "km/s" — doğrusu **km/sa** | Yanlış birim | 5.1 |
| A6 | "Parçalı Bulutlu" yazıyor ama ikon düz bulut | İkon–etiket uyuşmazlığı | 7.5 |
| A7 | Kıyafet satırlarında anlamsız çizgi ikonlar | Kıyafeti göstermiyor | 5.1, 7.5 |
| A8 | Başlık nötr, içerik taşımıyor | Kişilik yok | 7.6 |
| A9 | Aynı cam kart iki kez; yapay zekâ izi | Hiyerarşi yok | 7.1–7.2 |
| A10 | Şehre özgü öğe yok | Yerel kimlik yok | 5.1, 7.8 (Faz 7) |
| A11 | Ulaşım, üşüme, dilimler, hafta, dolap yok | Öneri kişisel değil | Bölüm 6 |

## B. REFERANS ÖZELLİK → KARŞILIKLAR

| Referans | Ne Giysem karşılığı | Faz |
|---|---|---|
| Bugün (tek kelime, 3 dilim, Bugün/Yarın) | Bugün ekranı | 1 |
| Akşam uyarısı + yağmur satırı | Akşam uyarısı + yağmur satırı | 1 / 5 |
| Kartını paylaş | Paylaşım kartı | 7 |
| Hafta (7 gün satırı) | Hafta ekranı | 2 |
| Dolap + tarama + manken | Dolap ekranı / tarama / manken | 3 / 8 |
| Sen (profil, üşüme, ulaşım, konumlar, bildirim, dil, widget, istatistik, arkadaş, puan) | Sen ekranı | 2 / 5 |
| Hava ölçeği (4 sınıf + 5 kademe) | Hava ölçeği ekranı | 2 |
| Ulaşım (çoklu seçim) | Ulaşım ekranı | 2 |
| Bildirimler | Bildirimler | 5 |
| Dil (TR, EN, …) | Dil sheet'i | 2 (TR+EN) / 10 |
| Widget'lar (4 boyut) | Widget'lar | 6 |
| Paylaş (9:16, 1:1) | Paylaşım ekranı | 7 |

## 1. ÜRÜN ÖZETİ
Kullanıcı açar → konum algılanır → gün 3 dilime bölünür → her dilim için tek kıyafet + tek kelimelik karar ("Mont havası"). Hafta, dolap, valiz, widget.

4 soru: Bugün ne giymeliyim? · Gün içinde değişecek mi? · Yanıma ne almalıyım? · Yarın ne olacak?

İlke: Az bilgi, doğru öneri, kişiye göre. Dil: Türkçe (Faz 2'den i18n). Birimler: °C, km/sa, %.
Hesap/abonelik/reklam: YOK.

## 2. TEKNOLOJİ
v1 yığını korunur. Eklemeler:

| Paket | Amaç | Faz |
|---|---|---|
| expo-router `(tabs)` | 4 sekme + modal/stack | 0 |
| react-native-svg | Kıyafet/hava illüstrasyonları, etiket şekli | 0 |
| @expo-google-fonts/bricolage-grotesque, @expo-google-fonts/dm-sans, expo-font | İki yazı tipi | 0 |
| expo-image | Fotoğraf/kıyafet görselleri | 0 |
| expo-linear-gradient | Yalnızca şehir fotoğrafı eritme | 1 |
| zustand + persist | Profil, ayarlar, şehirler | 2 |
| i18next + react-i18next + expo-localization | Çok dil | 2 |
| expo-camera, expo-image-picker, expo-image-manipulator, expo-file-system | Dolap tarama | 3 |
| expo-notifications, expo-background-task | Bildirimler | 5 |
| expo-audio | Ses önizleme (opsiyonel) | 5 |
| react-native-android-widget / @bacons/apple-targets | Widget'lar (development build) | 6 |
| react-native-view-shot, expo-sharing, expo-clipboard | Paylaşım kartı | 7 |
| expo-store-review | Puan ver | 2 |
| Backend + vision API | AI tarama (anahtar sunucuda) | 8 |

**Kaldırılacak:** `expo-blur` (Faz 0).

**Veri:** Open-Meteo Forecast — mevcut alanlar + `daily`: `temperature_2m_mean`, `weather_code`, `wind_speed_10m_max`, `precipitation_sum`; `forecast_days=16`, `past_days=14`. 16 gün ötesi: `archive-api.open-meteo.com` geçen yıl ortalaması + "Geçen yılın ortalaması" etiketi. `weatherService` bir `WeatherProvider` arayüzü arkasında (Faz 1). Şehir arama: Open-Meteo Geocoding.

## 3. DOSYA YAPISI (yeni/değişen ★)

```
ne-giysem/
├── app/
│   ├── _layout.tsx                    # kök: font, splash, i18n, store
│   ├── (tabs)/
│   │   ├── _layout.tsx                # ★ kapsül tab bar
│   │   ├── index.tsx                  # ★ Bugün
│   │   ├── hafta.tsx                  # ★
│   │   ├── dolap.tsx                  # ★
│   │   └── sen.tsx                    # ★
│   ├── karsilama.tsx                  # ★ ilk açılış
│   ├── sehir-ara.tsx                  # ★ modal (7.7)
│   ├── paylas.tsx                     # ★ Faz 7
│   ├── dolap/{tara,parca/[id],kombin,kapsul,valiz,manken,kabin}.tsx  # ★
│   └── ayarlar/{usume,ulasim,konumlar,bildirimler,widgetlar,tanima}.tsx  # ★
├── src/
│   ├── components/
│   │   ├── TagCard.tsx                # ★ imza etiket kartı (SVG)
│   │   ├── GarmentImage.tsx           # ★ Faz 1
│   │   ├── WeatherIllustration.tsx    # ★ Faz 1
│   │   ├── SlotColumn.tsx             # ★ Faz 1
│   │   ├── DayRow.tsx                 # ★ Faz 2
│   │   ├── PillTabBar.tsx             # ★ Faz 0
│   │   ├── CityPhoto.tsx              # ★ Faz 1/7
│   │   ├── WarningLine.tsx            # ★ Faz 1
│   │   ├── SolidSheet.tsx             # ★ Faz 0
│   │   ├── CitySearchSheet.tsx        # ★ yeniden yazıldı
│   │   ├── LoadingView.tsx            # ★ iskelet nabız
│   │   ├── ErrorView.tsx
│   │   └── (GlassCard, WeatherBackground) # SİL
│   ├── services/
│   │   ├── weather/WeatherProvider.ts # ★ Faz 1
│   │   ├── weather/openMeteo.ts       # ★ Faz 1
│   │   ├── geocodingService.ts / locationService.ts
│   │   ├── notificationService.ts     # ★ Faz 5
│   │   ├── widgetBridge.ts            # ★ Faz 6
│   │   ├── shareCard.ts               # ★ Faz 7
│   │   └── scanService.ts             # ★ Faz 3/8
│   ├── logic/
│   │   ├── garmentCatalog.ts          # ★ 6.1
│   │   ├── effectiveTemp.ts           # ★ 6.2–6.3
│   │   ├── slots.ts                   # ★ 6.4
│   │   ├── outfitEngine.ts            # ★ v2 (saf)
│   │   ├── wardrobeMatcher.ts         # ★ 6.7
│   │   ├── packing.ts                 # ★ 6.8
│   │   ├── capsule.ts                 # ★ 6.9
│   │   ├── learning.ts                # ★ 6.10
│   │   ├── weatherScale.ts            # ★ 6.11
│   │   ├── weatherCodes.ts / dailyNote.ts
│   ├── hooks/ (useWeatherOutfit, useNetworkStatus, useWardrobe ★, useProfile ★)
│   ├── storage/ (cache.ts, wardrobeStore.ts ★, profileStore.ts ★)
│   ├── i18n/ (index.ts ★, tr.json ★, en.json ★)
│   ├── theme/ (colors.ts, typography.ts, spacing.ts, tokens.ts ★)
│   ├── types/index.ts
│   └── constants/config.ts
├── assets/{garments,weather,mannequins,cities,sounds}
├── widgets/                           # ★ Faz 6
├── server/                            # ★ Faz 8
├── scripts/checkContrast.ts           # ★ Faz 0
├── __tests__/ (outfitEngine, effectiveTemp, slots, wardrobeMatcher, packing, capsule, learning, weatherScale)
├── app.config.ts / README.md
```

## 4. KULLANICI AKIŞI
1. İlk açılış `karsilama.tsx` → "Konumumu Kullan" / "Şehir ara" → tek soru (atlanabilir): "Üşüme düzeyin?" (5 kademe, varsayılan Normalim). Ulaşım sorulmaz (varsayılan Yürüyerek).
2. İzin → konum → Bugün. Yoksa `sehir-ara` modalı.
3. Açılış + pull-to-refresh yeniler; öne dönüşte 30 dk'dan eskiyse yenilenir.
4. Saat 22:00'den sonra Bugün otomatik "Yarın" gösterir.
5. Şehir adına dokunma menüsü: "Mevcut konum" + kayıtlı şehirler + "Şehir ekle". Bugün/Yarın seçici aynı satırda ayrı menü.
6. Saklananlar: `profile`, `cities`, `weatherCache`, `wardrobe` + dosya sistemi, `learning`, `notifPrefs`, `onboardingDone`.

## 5. EKRANLAR

### 5.1 Bugün — sonuç başlığı + 3 dilim
- **A.** 44pt Bricolage ExtraBold sonuç başlığı ("Mont havası"). Altında: konum ikonu + "İlçe · Bugün ▾".
- **B.** `CityPhoto` tam genişlik, alta eriyik. Sağda `TagCard` rozeti: "7° · his. 7°". Fotoğraf yoksa (Faz 7'ye kadar) şehir adı 88pt + `surface` zemin; boş gri kutu YOK.
- **C.** 3 dilim `TagCard` (tek büyük kart): Sabah 08–12, Öğle 12–17, Akşam 17–22. Sütun: saat (14pt), hava illüstrasyonu (28pt), kıyafet görseli (≥96pt), tek kelime (20pt). 1.5px ayraç. Geçmiş dilim `textSecondary`.
- **D.** `WarningLine` en fazla 2: akşam dönüşü → "Akşam hava dönüyor, yanına kat al." / yağmur → "Şemsiyeni unutma, [saat] civarı yağıyor." veya "Bugün yağmur yok." Diğer uyarılar yağmur satırı altında tek satırda birleşir.
- **E.** `DailyNote` yalnızca gün içi fark ≥ 8°C.
- **F.** "Veri: Open-Meteo" (12pt, textSecondary).
- Hissedilen/yağış/rüzgâr: B rozeti altında tek satır "Rüzgâr 7 km/sa · Yağış %60 · Nem %78". **Birim: km/sa**.
- Dişli/ayar YOK. Kaydırma serbest. "Kartını paylaş" Faz 7'de B üstüne.

### 5.2 Hafta — Faz 2
"Bu hafta" + 7 `DayRow` (gün, hava, kıyafet, tek kelime, şemsiye ≥40, maks/min). Satıra dokun → günün 3 dilimi alt sheet. Alt: "Veri: Open-Meteo".

### 5.3 Dolap — Faz 3
3 kısayol hapı (Kombin kur, Kapsül, Valizim) + sanal kabin kartı (Faz 8'e kadar gizli). Boş: 3 etiket şeklinde boş yuva + "Dolabın boş. Üç parçayla başla, gerisi kolay." Dolu: 2 sütun ızgara + kategori filtreleri. Alt CTA "İlk parçanı ekle".

### 5.4 Tarama — 4 adım, "1 / 4"
1. "Kıyafetini çek" (kamera, Galeri, çevir, "Askıda, elinde ya da yerde olabilir.")
2. "Bakım etiketini çek" (atlanabilir)
3. "Kontrol et": tür, renk, kalınlık 1–10, su geçirmez, rüzgâr geçirmez (Faz 3: kullanıcı seçer; Faz 8: model önerir + onay)
4. "Dolaba ekle"
İzin ekranı: "Kıyafetini tarayabilmem için kamera iznine ihtiyacım var." + "İzin ver"; reddedilirse "Galeriden seç".
Fotoğraflar `FileSystem.documentDirectory/wardrobe/{id}.jpg`, bulut yok.

### 5.5 Kombin kur — Faz 3
Katmanlı seçici (Üst, ara kat, Alt, Dış, Ayakkabı, Aksesuar) + canlı "Toplam sıcaklık puanı X / hedef Y" + "Sabah ✓ / Öğle ✓ / Akşam ✕ üşürsün" (6.7). Kaydet yok; "Bugün bunu giyeceğim" öğrenmeye işaretler.

### 5.6 Bugün senin için — Faz 3
Dolap doluysa her dilim için `wardrobeMatcher` (6.7). Bugün'de "Dolabımdan" anahtarı; katalog yerine kendi parçaları. Eksik: "Dolabında [X] yok, en yakın: [Y]".

### 5.7 Valiz + Kapsül — Faz 4
- **Valiz:** hedef şehir, başlangıç–bitiş (≤21 gün). Gün gün 3 dilim → kategori listesi + adetler (6.8) + "Dolabımdan / Katalogdan". Eksikler "Eksik" etiketi. Tikler saklanır.
- **Kapsül:** 6/8/10/12 parça. Üst×alt ızgarası ✓/✕ (renk uyumu 6.9). "Bu [K] parçayla [N] kombin". Hava bağımsız; seyahat varsa ihtiyaç aralığı da.

### 5.8 Sen
"Ne Giysem seni %X tanıyor · Gör" (6.10). Bölümler:
- **Sana göre:** Üşüme ayarım · Ulaşım · Konumlar · Bildirimler · Bugün senin için · Dolabın kimin için? · Dil
- **Ana ekran:** Widget'lar
- **Diğer:** Kullanım istatistikleri (varsayılan kapalı; yalnızca tercih)
- **Sevdiysen:** Arkadaşına gönder · Puan ver
- Alt: konum izni · "Veri: Open-Meteo" · "Ne Giysem 2.0.0 (build)"

### 5.9 Üşüme ayarı + Hava ölçeği — Faz 2
"Hava ölçeği" / "Sana ve [Şehir]'e göre aralıklar." 4 sınıf kartı (renkli blok + aralık, canlı 6.11): Tişört havası, Ceket havası, Mont havası, Bugün çıkma (mevcut sınıf işaretli, seçilemez). Altında 5 kademe kaydırıcı (Az↔Çok): Hiç üşümem · Az üşürüm · Normalim · Çabuk üşürüm · Çok üşürüm. Değişince aralıklar güncellenir + haptic.

### 5.10 Ulaşım — Faz 2
Yürüyerek, Bisikletle, Motosikletle, Toplu taşımayla, Arabayla. İlk seçilen = ana ulaşım (6.2); sıra seçim sırası, "Ana" etiketi. En az 1 zorunlu. İpucu: "Motosiklet ve bisiklette rüzgâr daha çok üşütür, ona göre giydiririm."

### 5.11 Konumlar
Kayıtlı şehirler (kaydır-sil). Sınırsız.

### 5.12 Dil
`SolidSheet`: Cihaz dili, Türkçe, English (Faz 2). Diğerleri Faz 10.

## 6. KESİN KURALLAR — ÖNERİ MOTORU v2 (saf, testli)

### 6.1 Kıyafet kataloğu (`garmentCatalog.ts`)
`{ id, label, category, warmth 0–10, waterproof, windproof, image }`.

| id | Etiket | Kategori | Puan | Su | Rüzgâr |
|---|---|---|---|---|---|
| atlet | Atlet | top | 1 | – | – |
| tisort | Tişört | top | 1 | – | – |
| uzun-kollu | Uzun kollu | top | 2 | – | – |
| gomlek | Gömlek | top | 2 | – | – |
| sweatshirt | Sweatshirt | top | 3 | – | – |
| kazak | Kazak | top | 4 | – | – |
| termal-ust | Termal | base | 2 | – | – |
| hirka | Hırka | mid | 3 | – | – |
| sort | Şort | bottom | 1 | – | – |
| ince-pantolon | İnce pantolon | bottom | 1 | – | – |
| jean | Jean | bottom | 2 | – | – |
| chino | Chino | bottom | 2 | – | – |
| kalin-pantolon | Kalın pantolon | bottom | 3 | – | – |
| termal-alt | Termal alt | base-bottom | 2 | – | – |
| ince-ceket | İnce ceket | outer | 3 | – | – |
| ruzgarlik | Rüzgârlık | outer | 2 | – | evet |
| yagmurluk | Yağmurluk | outer | 2 | evet | evet |
| mont | Mont | outer | 6 | – | – |
| su-gecirmez-mont | Su geçirmez mont | outer | 6 | evet | evet |
| kalin-mont | Kalın mont | outer | 8 | – | evet |
| cok-kalin-mont | Çok kalın mont | outer | 9 | evet | evet |
| sandalet/spor-ayakkabi/kapali-ayakkabi/bot/su-gecirmez-bot | Ayakkabılar | shoes | 0/0/1/2/3 | bot-su: evet | – |
| semsiye, sapka, gunes-gozlugu, bere, atki, eldiven | Aksesuar | accessory | 0,0,0,1,1,1 | – | – |

### 6.2 Etkili sıcaklık (`effectiveTemp.ts`)
Dilim için: `T = ortalama(apparent_temperature, dilim saatleri)` sonra:
1. Rüzgâr: dilim maks rüzgâr ≥ 30 → **−1**
2. Güneş: kod 0–1 ve maks UV ≥ 6 ve ort. sıcaklık ≥ 20 → **+1**
3. Ulaşım (ana): motosiklet **−3**, bisiklet **−1.5**; yalnızca dilim maks rüzgâr ≥ 10 ise, yoksa 0
4. Kişisel: `profileOffset` (Hiç +3, Az +1.5, Normal 0, Çabuk −1.5, Çok −3) `+ learnedOffset` (−3…+3)
5. İklime alışma: `clamp((15 − mean14) × 0.15, −2, +2)`, `mean14` = son 14 gün `temperature_2m_mean` ort.
Sonuç `effective`, ondalık korunur.

### 6.3 Sıcaklık bantları (v1 tablosu, `effective`'e göre)
| Band | Aralık | Üst | Alt | Dış | Ayakkabı | Hedef puan |
|---|---|---|---|---|---|---|
| Çok sıcak | ≥30 | atlet | sort | yok | sandalet | 2 |
| Sıcak | 24–29.9 | tisort | sort | yok | spor-ayakkabi | 3 |
| Ilık | 18–23.9 | tisort/uzun-kollu | jean | yok | spor-ayakkabi | 5 |
| Hafif serin | 12–17.9 | sweatshirt | jean | ince-ceket | spor-ayakkabi | 7 |
| Serin | 6–11.9 | kazak | kalin-pantolon | mont | kapali-ayakkabi | 10 |
| Soğuk | 0–5.9 | termal-ust+kazak | kalin-pantolon | kalin-mont | bot+bere+atki | 13 |
| Çok soğuk | <0 | termal-ust+kazak | termal-alt+kalin-pantolon | cok-kalin-mont | su-gecirmez-bot+bere+atki+eldiven | 17 |

### 6.4 Zaman dilimleri (`slots.ts`)
- Dilimler: Sabah 08:00–11:59, Öğle 12:00–16:59, Akşam 17:00–21:59 (yerel saat).
- Şu anki dilim: yalnızca şimdiden sonraki saatler; bitmiş dilim "geçti" ama kıyafeti hesaplanır.
- Her dilim `computeOutfit(slotSnapshot)` ayrı öneri.
- **hero**: dış varsa o, yoksa üst. Tek kelime = kahraman TR etiketi.
- **Gün kıyafeti**: üç kahramandan en yüksek puanlı.
- **Başlık** = `{kahraman} havası` ("Tişört havası", "Mont havası"…).
- **Bugün çıkma**: kod 95–99, 75/86, `effective ≤ −12`, veya rüzgâr ≥ 60 → başlık "Bugün çıkma." + alt metin "Çıkman şart değilse evde kal; çıkacaksan kat kat giyin." + en sıcak bant + koşul düzeltmeleri.

### 6.5 Koşul düzeltmeleri (dilim verisiyle)
| Koşul | Etki | Uyarı |
|---|---|---|
| Yağış ≥ 40 | semsiye | "Şemsiyeni unutma." |
| Yağış ≥ 60 veya şu an yağış | dış → su geçirmez; ayakkabı su geçirmez | "Yağmur bekleniyor, su geçirmez giy." |
| Kar (71–77, 85–86) | su-gecirmez-bot + bere + eldiven | "Kar var, ayağını kuru tut." |
| Rüzgâr ≥ 25 | dış rüzgâr geçirmez/ekle | "Rüzgâr sert, rüzgârlık iyi gider." |
| UV ≥ 6 ve gündüz | sapka + gunes-gozlugu | "Güneş kremi sürmeyi unutma." |
| Nem ≥ 75 ve sıcaklık ≥ 26 | – | "İnce, nefes alan kumaşlar seç." |
| Gün içi fark ≥ 10 | – | "Katmanlı giyin." |
| Çok sıcak | – | "İnce ve açık renkli giy." |
| Soğuk/Çok soğuk | – | "Kalın giyin, atkıyı da unutma." |

Çıktı: `{ band, hero, items: [{id, category}], warnings: string[], level: 'normal'|'avoid' }`. Rastgele yok; aynı bantta rüzgâr/yağmur/güneş farklı çıktı (test).

### 6.6 Akşam dönüşü
`eveningTurn` ⇔ Akşam bandı Sabah+Öğle'nin en soğuğundan ≥1 band soğuk, VEYA Akşam yağış ≥60 ve Sabah+Öğle ikisinde <40.
Uyarı: "Akşam hava dönüyor, yanına kat al." / yağmur: "Akşam yağmur geliyor, şemsiyeni al."

### 6.7 Dolaptan eşleştirme (`wardrobeMatcher.ts`)
Girdi: dolap parçaları + dilim hedef puanı. Aday: 1 üst + (0–1 ara) + 1 alt + (0–1 dış).
Skor = `|toplam − hedef|` + cezalar: yağış ≥60 ve dış su geçirmez değilse +5; rüzgâr ≥25 ve dış rüzgâr geçirmez değilse +3; renk uyumsuzluğu (6.9) +4. En düşük skor; eşitlikte `id` alfabetik. Kategori yoksa atlanır + `missing: [kategori]`. Metin: "Dolabında [kategori] yok, en yakın katalog önerisi: [etiket]."

### 6.8 Valiz (`packing.ts`)
Girdi: gün listesi (her gün 3 dilim bandı). Çıktı: **Üst** `min(7, ceil(gün/2)+1)`; **Alt** `min(4, ceil(gün/3)+1)`; **İç çamaşırı/çorap** `min(10, gün+1)`; **Dış** = farklı dış id'leri (her biri 1); **Ayakkabı** = farklı ayakkabı id'leri (≤2); **Aksesuar** = uyarılardan birleşim; **Her zaman:** şarj aleti, kişisel bakım. İlk/son gün bandı farklıysa "Katmanlı giyinmeye hazır ol." 16+ gün → arşiv ortalaması + "Geçen yılın ortalaması".

### 6.9 Kapsül (`capsule.ts`)
- Nötr renkler: siyah, beyaz, gri, lacivert, bej, krem, kahverengi, jean-mavi. Kural: üst+alt+dış içinde **en fazla 1 nötr olmayan**.
- Açgözlü deterministik: her adımda geçerli kombin sayısını en çok artıran parça; eşitlikte `id` alfabetik; K'ya kadar. Çıktı: parçalar, üst×alt uyum matrisi, toplam kombin.

### 6.10 Öğrenme (`learning.ts`)
- Akşam sorusu: "Bugün giydiğin nasıldı?" Üşüdüm (−0.5) · Tam kararında (0) · Terledim (+0.5). `learnedOffset` eklenir, [−3,+3] kırpılır.
- Soru ilk **15 gün** (bildirim + uygulama içi kart); cevap sayısı kaydedilir.
- "%X tanıyor": `min(100, round(cevap/15 × 100))`. "Gör": `ayarlar/tanima.tsx` → "15 akşamın N'ini cevapladın" + ofset cümlesi (0 cevapta yok).

### 6.11 Hava ölçeği (`weatherScale.ts`)
`totalOffset = profileOffset + learnedOffset + acclimation` (ulaşım cezası yalnızca gösterim için 0). Aralıklar **gerçek sıcaklık cinsinden**, bant eşiğinden `totalOffset` çıkarılarak:
- Tişört: `effective ≥ 18` → "{18−totalOffset}° ve üstü"
- Ceket: `12 ≤ effective < 18` → "{12−totalOffset}° ile {18−totalOffset}° arası"
- Mont: `effective < 12` → "{12−totalOffset}° altı"
- Bugün çıkma: "Fırtına, yoğun kar, aşırı soğuk" (sabit)
Sayılar tam sayıya yuvarlanır.

### 6.12 Dil ve ton
"Sen" hitabı, kısa, meteoroloji terimi yok, **sonuç önce açıklama sonra**. Tüm metinler i18n (`tr.json`), kodda sabit metin yok. `toLocaleUpperCase('tr-TR')`.

## 7. TASARIM KİMLİĞİ: "Ne Giysem?" (etiket kimliği)

### 7.1 Kimlik kartı
```
AD/METAFOR : Ne Giysem? → askı → etiket (hang tag). Kart = askıya takılan etiket.
PALET açık: zemin #F1F0EA | yüzey #E6E4DA | ana #1E3A34 | ikincil #3F6296 | aksan #F0A12B | metin #1B1F1D | metin-2 #4D5A54 | çizgi #1E3A34
PALET koyu : zemin #121A17 | yüzey #1C2824 | ana #9FD3B8 | ikincil #8FB0E0 | aksan #F0A12B | metin #EDEFE9 | metin-2 #B4BDB7 | çizgi #9FD3B8
TİPO       : başlık Bricolage Grotesque (ExtraBold 800) | gövde DM Sans (400/500/700)
GÖRSEL     : düz kesim kıyafet görselleri; kendi SVG hava illüstrasyonları; şehir fotoğrafı (Faz 7)
İMZA       : "Etiket kartı": sağ üst 16px kesik, üstte delik halkası, 1.5px düz çizgi. Rozetler küçük etiket.
SES        : "Mont havası." / "Akşam hava dönüyor, yanına kat al." / "Bugün yağmur yok."
KAÇINILANLAR: cam/blur, gradyan (şehir foto eritme hariç), bulanık küreler, çizgi ikon + "Kategori: Değer" listeleri, kesik çizgili kenar, ortalanmış jenerik kartlar, maskot
```
Aksan (#F0A12B) **yalnızca dolgu**; üzerinde ana renk metin; aksan renkli metin YOK.

### 7.2 Yüzey kuralları
- Köşe: **16** (küçük) ve **24** (kart/sheet).
- Kenar: **1.5px düz** `çizgi`. Gölge YOK (derinlik `yüzey`↔`zemin` farkı).
- `TagCard`: SVG yol, sağ üst 16px kesik, delik halkası 10pt (Bugün büyük kartında ip kıvrımı, diğerlerinde yalnız delik). Kart başına tek TagCard: **Bugün'de yalnız C bloğu**; gerisi düz yüzey + boşluk.
- Rozet: küçük etiket, ana dolgu, metin zemin rengi, 12pt 700, `toLocaleUpperCase('tr-TR')`.
- Alt bar: kapsül **opak** `yüzey`, aktif sekme ana dolgu hap + zemin renkli metin; ikon+etiket. Dokunma ≥44×44.

### 7.3 Tema
- Açık/koyu **elle seçilmiş paletler**; otomatik tersleme yok. Hava temasına göre yalnızca aksan ve foto eriyik rengi değişmez; palet sabit.
- Gece ayrı tema değil; illüstrasyon gece varyantına geçer. Karanlık mod sistem ayarını izler.
- `scripts/checkContrast.ts`: tüm metin/zemin çiftleri ≥4.5:1 (büyük ≥3:1); geçmezse build kırılır.

### 7.4 Tipografi
Ölçek: **12/14/16/20/28/44/88**. Sonuç başlığı 44 ExtraBold. Büyük sayılar ExtraBold (thin/light yasak). `allowFontScaling`, üst sınır 1.3. `useFonts` bitmeden splash kapanmaz. "ÇĞİÖŞÜ çğıöşü" her iki fontta doğrulanır.

### 7.5 Görsel dili
- Kıyafet: `GarmentImage` (kıyafet görseli). Çizgi ikon + etiket listesi YOK.
- Hava: `WeatherIllustration` — güneş, parçalı, bulutlu, yağmur, kar, rüzgâr, sis, fırtına + gece varyantları. WMO → illüstrasyon `weatherCodes.ts`; **etiket ve illüstrasyon aynı kayıttan** (A6).
- UI ikonları: tek sade set, 24pt, 1.5px çizgi, ana renk; yalnızca eylem.

### 7.6 Metin kalıpları (tam)
| Yer | Metin |
|---|---|
| Karşılama başlığı | "Bugün ne giyeceğini düşünme, senin için biz seçelim." |
| Karşılama alt | "Konumuna göre hava durumunu öğren ve günün kombin önerisini hemen gör." |
| Karşılama düğmeleri | "Konumumu Kullan" / "Şehir ara" |
| Dolap boş | "Dolabın boş. Üç parçayla başla, gerisi kolay." |
| Tarama bilgi | "Askıda, elinde ya da yerde çekebilirsin." |
| Yağmur yok | "Bugün yağmur yok." |
| Yağmur var | "Şemsiyeni unutma, [saat] civarı yağıyor." |
| Akşam dönüşü | "Akşam hava dönüyor, yanına kat al." |
| Gün içi fark | "Öğleden sonra hava ısınabilir. Sabah çıkıyorsan yanına ceket al." |

### 7.7 Şehir arama sheet'i — A1/A2 düzeltmesi (zorunlu)
`CitySearchSheet` yeniden yazılır; **`SolidSheet`** kullanır:
1. **Opak:** `yüzey`, alpha=1, blur yok. Arkada yalnız `rgba(0,0,0,0.45)` scrim. Arkadaki içerik GÖRÜNMEZ.
2. **Kök seviyede:** `app/sehir-ara.tsx` modal rotası (`presentation:'transparentModal'`, `animation:'slide_from_bottom'`). Kart içinde render edilmez.
3. **Klavye duyarlı:** `android.softwareKeyboardLayoutMode:'resize'`. Sheet Reanimated `useAnimatedKeyboard()` ile klavye yüksekliği kadar yukarı kayar; alt kenar her zaman klavye üstünde. iOS'ta klavye olayları.
4. **Yükseklik:** `maxHeight = pencere − klavye − safeAreaTop − 16`. Kendi içinde kaydırılır (`FlatList`, `keyboardShouldPersistTaps="handled"`).
5. **Yerleşim:** tutamaç + başlık + kapat (44×44), hemen altında arama alanı (her zaman görünür), sonuçlar. Çakışma yok (üst boşluk 16).
6. **Davranış:** açılış animasyonu bitince `autoFocus`; 300ms debounce; min 2 harf ("Şehir adını en az 2 harfle yaz."); sonuç yok → "Şehir bulunamadı."; Android geri sheet'i kapatır; perde dokunuşu 1.: klavyeyi kapatır, 2.: sheet'i.
7. Aynı bileşen Dil sheet'i, Şehir menüsü vb. tüm sheet'lerde.
8. **Doğrulama:** 320×568 ve 360×640'da klavye açıkken arama alanı + ilk 3 sonuç görünür; arkadaki kart seçilemez.

### 7.8 Görsel varlık kaynağı ve yedek
- `assets/garments/{id}.png`: 512×512, şeffaf, düz kesim, ana palet. **Kullanıcı sağlayacak.** Yedek: `react-native-svg` ile 24 kıyafetin özgün düz kesim çizimleri (`GarmentImage` önce PNG, yoksa SVG). Stok çizgi ikon YOK.
- `assets/weather/*.svg`: 8 illüstrasyon + gece; kodla çizilir.
- `assets/cities/{plaka}.jpg`: **Faz 7'de sonra.** O zamana kadar `CityPhoto` yedeği: `yüzey` zemin + şehir adı 88pt, ana renk %12 opaklık.
- `assets/mannequins/{kadin|erkek}-{ince|orta|genis}.png`: 6 adet, 1000×2200, şeffaf. **Kullanıcı sağlayacak**; yoksa Faz 8 başlamaz.
- Telifli görsel kopyalama yok.
- Hareket: giriş 200–250ms fade/slide, seçimde hafif spring, dilim sütunlarında 60ms stagger. Sürekli animasyon yok. Yükleme: etiket kartı iskeletinde yavaş nabız.

## 8. DURUM YÖNETİMİ VE HATA SENARYOLARI
| Durum | Metin | Eylem |
|---|---|---|
| Yükleniyor | (metin yok, iskelet nabız) | Boş/sahte veri yok |
| Konum izni yok | "Konumuna erişemiyoruz." | "Şehir ara" + "Ayarları aç" |
| Konum zaman aşımı | "Konumunu bulamadık." | "Şehir ara" + "Tekrar dene" |
| İnternet yok | "İnternet bağlantısı yok." | Önbellek varsa "Son güncelleme: HH:MM"; yoksa "Tekrar dene" |
| API hatası | "Hava durumu şu an alınamadı." | "Tekrar dene" |
| Şema uyuşmazlığı | API hatası ile aynı | Güvenli hata |
| Şehir yok | "Şehir bulunamadı." | – |
| Kamera izni yok | "Kıyafetini tarayabilmem için kamera iznine ihtiyacım var." | "İzin ver" + "Galeriden seç" |
| Bildirim izni yok | "Bildirimler kapalı." | "Ayarları aç" |
| Seyahat >16 gün | "Bu tarihler için tahmin yok. Geçen yılın ortalamasını gösteriyorum." | – |

Ağ: 10sn timeout, ≤2 deneme. Uydurma veri yok.

## 9. GÜVENLİK VE KALİTE
- Gizli anahtar yok; LLM anahtarı yalnızca backend'de.
- `any` yok, TS strict. Şema uymazsa hata.
- **Gizlilik:** konum yalnızca hava için; paylaşım kartında yalnız şehir adı ("Şehrimi göster" kapatılabilir). Dolap fotoğrafları cihazda (Faz 8'e kadar); Faz 8'de yalnız taranan görsel backend'e, saklanmaz. İzin metinleri `app.config.ts`'de Türkçe ve açık.
- Türkçe karakter doğru. Gereksiz paket yok. Bileşenler küçük.
- Testler: outfitEngine, effectiveTemp, slots, wardrobeMatcher, packing, capsule, learning, weatherScale.

## 10. YAPMAYACAKLARIN
Reklam, sosyal akış, favori, harita, grafik, rastgele öneri, sahte veri, cam/blur, gradyan arka plan, bulanık küreler, tema seçme ekranı, maskot, referans ad/görsel/metin kopyalama, affiliate, konum paylaşma, hesap/giriş, abonelik/ödeme, Plus/kilit, tarama limiti, paywall.
(v1 yasakları — haftalık tablo, bildirim, ayar — artık serbest ama yalnızca Bölüm 5'teki biçimde.)

## 11. ÇALIŞMA PLANI
- **Faz 0 — Temizlik ve kimlik:** expo-blur kaldır; GlassCard/WeatherBackground sil; tema tokenları (7.1), fontlar, TagCard, PillTabBar; sekmeli yapı; Bugün'e taşı; CitySearchSheet 7.7'ye göre yeniden yaz (A1/A2); km/sa (A5); dişli kaldır (A4); etiket+ikon aynı kayıt (A6); checkContrast.ts.
- **Faz 1 — Çekirdek v2:** WeatherProvider + Open-Meteo (16 gün, geçmiş 14) · garmentCatalog · effectiveTemp · slots · outfitEngine v2 · 24 kıyafet + 8 hava SVG · Bugün (5.1) · Bugün/Yarın · testler.
- **Faz 2 — Kişiselleştirme + Hafta:** profileStore · i18n TR/EN · Üşüme + Hava ölçeği · Ulaşım · Konumlar · Sen · Hafta · Karşılama + üşüme sorusu.
- **Faz 3 — Dolap (elle):** kamera/galeri, 4 adımlı tarama, dosya saklama, Dolap, parça detay, Kombin kur, Bugün senin için.
- **Faz 4 — Seyahat:** Valiz + Kapsül, arşiv ortalaması, tikli liste, çoklu şehir.
- **Faz 5 — Bildirim + öğrenme:** yarının havası 21:30, akşam sorusu 19:30 (ilk 15 gün), akşam dönüşü (6.6, günde ≤2), hava sesleri; sessiz 22–07, günde ≤4; veri >24sa ise planlama yok; background-task ~3sa; learning + "%X tanıyor".
- **Faz 6 — Widget'lar** (development build): küçük/orta/gün/büyük; widgetBridge ortak depo; widget ağ çağırmaz; >3sa veri → "Güncellemek için aç".
- **Faz 7 — Paylaşım + şehir fotoğrafı:** paylas.tsx (9:16/1:1 view-shot), Instagram/WhatsApp/Kaydet/Diğer, "Şehrimi göster", hesap etiketi, "Aynada göster". CityPhoto kaynağı + 81 il şeması.
- **Faz 8 — AI tarama + Sanal kabin:** server/scan → `{kategori, renk, kalınlık, suGecirmez, ruzgarGecirmez, kumas, bakim}` + arka plan silme; kullanıcı onayı şart. Manken (6 beden) + kabin.tsx katman sırası + tryOnAnchors + "kendi yüzünle".
- **Faz 9 — Dil genişletme + cila:** ES/PT/DE/FR/IT/RU/JA, soğuk açılış <2sn, erişilebilirlik, 320pt taşma.

Her faz sonunda: Android+iOS'ta çalıştır + **Yapay zekâ izi kontrol listesi**:
- [ ] Ad/logo olmadan Ne Giysem olduğu belli (etiket şekli, palet, font)?
- [ ] 5+ temel renk veya gradyan? (kaldır)
- [ ] Cam/blur veya bulanık küre? (kaldır)
- [ ] 3+ aynı kart alt alta? (birleştir)
- [ ] Çizgi ikon + "Kategori: Değer" listesi? (kıyafet görseli + tek kelime)
- [ ] Nötr başlıklar? ("Mont havası." gibi)
- [ ] Soluk gri metin / <4.5:1 kontrast?
- [ ] Çakışan/taşan/kenara yapışan öğe?
- [ ] Türkçe karakter ve büyük harf doğru?

## 12. KABUL KRİTERLERİ
**Genel:** hatasız açılış, TS hatasız, `any` yok · gerçek veri, izin yoksa şehir arama · offline/API/izin anlaşılır, uydurma yok · checkContrast geçiyor, 320pt taşma yok, ≥44×44, 1.3× yazı bozulmuyor.

**Faz 0:** sheet'te klavye altında öğe yok; arama alanı + ilk 3 sonuç klavye üstünde (320×568, 360×640) · sheet opak, arkadaki görünmüyor, çakışma yok · hiçbir ekranda blur/gradyan (şehir foto eritme hariç), "km/sa" doğru.

**Faz 1–2:** aynı sıcaklıkta rüzgâr/güneş/yağmur/motosiklet farklı çıktı (test) · üşüme değişince bant+öneri değişir, weatherScale canlı · Sabah/Öğle/Akşam ayrı kıyafet, 22:00 sonrası Yarın · Hafta 7 satır, kıyafet 6.4 kuralı.

**Faz 3–4:** parça ekleme/silme/düzenleme çalışır, fotoğraflar kalıcı · wardrobeMatcher/capsule deterministik (test), renk kuralı ihlali yok · valiz adetleri 6.8'e uygun, >16 gün "Geçen yılın ortalaması".

**Faz 5–7:** sessizde ve günde 4'ten fazla bildirim yok; eski veriyle planlama yok · 15 cevaptan sonra soru durur, "%X" doğru · 4 widget boyutu veri gösterir, >3sa uyarı · paylaşım kartı 9:16+1:1, "Şehrimi göster" kapalıyken şehir adı yok.

**Faz 8:** tarama sonucu onaysız dolaba yazılmaz; şema uymazsa elle forma düşer · kabin 6 mankende katman sırası doğru.

## 13. KAPSAM DIŞI
Hesap/giriş, abonelik/ödeme, Plus/ücretsiz ayrımı, kilitli özellik, paywall, tarama limiti, bulut senkron, ticari lisans, mağaza yayını. Kod/ekran/metin/"yakında" yer tutucusu YAZILMAZ. Tüm özellikler herkese açık, kilit simgesi yok.
