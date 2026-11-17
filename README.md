# Ne Giysem?

Bugün ne giymen gerektiğini söyleyen, kişiye göre öneri üreten bir giyinme asistanı.
Hesap yok, kayıt yok, reklam yok. Uygulama dili Türkçe; birimler °C, km/sa, %.

> **v2 yol haritası:** Bkz. [docs/V2-YONERGE.md](docs/V2-YONERGE.md).

---

## Mevcut durum

- **Sekmeler (4):** Bugün / Hafta / Uyarılar / Ayarlar — yüzen opak kapsül (`PillTabBar`).
- **Tasarım kimliği:** "Etiket kartı" — opak yüzeyler, 1.5px düz kenarlık, cam/blur/gradyan YOK.
- **Tema:** Açık/koyu elle seçilmiş paletler (`src/theme/tokens.ts`); sistem ayarını izler.
- **Yazı tipleri:** Bricolage Grotesque 800 (başlık) + DM Sans 400/500/700 (gövde), `expo-font` ile yüklenir.
- **i18n:** TR/EN (`src/i18n/`); dil cihaz diline göre seçilir (şu an TR).
- **Onay akışı:** İlk açılışta 4 adım — karşılama → gizlilik onayı (zorunlu, sürümlü) → konum →
  bildirim (atlanabilir). Onay `{version, acceptedAt}` olarak saklanır; Ayarlar'dan geri çekilebilir.
- **Hava verisi:** Yalnızca **Open-Meteo** (Forecast + Geocoding, WMO kodları) — anahtar gerektirmez.
  16 gün tahmin + 14 gün geçmiş. Önbellek 15 dk "taze" penceresi; ön plana dönüşte 30 dk'dan
  eskiyse yenilenir; pull-to-refresh var. Stale-while-revalidate: son veri anında gösterilir,
  arka planda tazelenir. Çevrimdışı/hata durumunda önbellek "Son güncelleme: HH:MM" ile gösterilir;
  uydurma veri üretilmez.
- **Öneri motoru:** `garmentCatalog` (32 parça) · `effectiveTemp` · `slots` (sabit 08–12 / 12–17 /
  17–22) · `outfitEngine` — deterministik; sıcaklık, yağış, kar, rüzgâr, güneş, nem, üşüme
  hassasiyeti, öğrenme ofseti ve iklim alışmasını dikkate alır.
- **Bildirim:** Yerel hatırlatma (akşam = yarının, sabah = bugünün kombini; gerçek tahminden,
  24 saatten eski veriyle planlanmaz). Ayarlar > Bildirim'den aç/kapa + saat.
- **Uyarılar sekmesi:** Yalnızca resmî kurum bağlantıları (MGM). Canlı başlık beslemesi yok —
  bkz. aşağıda.
- **Ayarlar:** Üşüme (5 kademe + canlı hava ölçeği), Bildirim, Konumlar, Gizlilik
  (onay geri çekme + veri silme), Hakkında.

## Veri ve gizlilik

- Konum/şehir koordinatları **yalnızca** `api.open-meteo.com` ve `geocoding-api.open-meteo.com`'a gider.
- Hesap, sunucu, analitik yok. Tercihler ve önbellek cihazda (AsyncStorage) tutulur.
- Onay metni uygulama içindeki Gizlilik adımında gösterilir; sürüm artarsa yeniden sorulur.
- **Play Store için gizlilik politikası URL'si gerekir** (konum verisi üçüncü tarafa gittiği için
  Console bunu zorunlu tutar). Politikada Open-Meteo'ya aktarılan koordinatlar belirtilmeli.

## Hava verisi atfı

Open-Meteo verisi **CC BY 4.0** lisansı altındadır; atıf Bugün ekranının alt bilgisinde ve
Ayarlar > Hakkında'da gösterilir.

## Resmî uyarı kaynakları (araştırma notu)

Uyarılar sekmesinde yalnızca açıldığı doğrulanan resmî sayfalar listelenir
(`src/constants/officialSources.ts`). Canlı başlık (RSS/CAP/JSON) bölümü **bilinçli olarak yok**:

- **MGM:** WMO Alerting Authority kaydında CAP Feed URL'si boş; uyarı sayfaları yalnızca HTML
  (kazıma yapılmaz).
- **AFAD:** `afad.gov.tr` istekleri 500 dönüyor (bot koruması); `/type/rss` akışları afet
  uyarısı değil akreditasyon/eğitim duyuruları içeriyor — uygun değil.
- Kural gereği HTML kazıma, User-Agent taklidi ve belgesiz iç uçlar kullanılmadı.

## Gereksinimler

- Node.js 22+ ve npm
- Telefonda **Expo Go** veya development build / APK (bildirimler için development build önerilir)
- İnternet (hava durumu ve şehir araması için)

API anahtarı gerekmez; `.env` yoktur.

## Çalıştırma

```bash
npm install
npx expo start
```

QR kodu Expo Go ile okut ya da `npx expo start --android` / `--ios`.

## Komutlar

```bash
npm test               # Birim testleri (Jest)
npm run typecheck      # TypeScript kontrolü
npm run lint           # ESLint
npm run check:contrast # WCAG AA kontrast denetimi (scripts/checkContrast.ts)
npx expo-doctor        # Bağılılık/yapılandırma teşhisi
```

## Proje yapısı

```
ne-giysem/
├─ app/
│  ├─ _layout.tsx          # font + onay kapısı + WeatherProvider + Stack
│  ├─ karsilama.tsx        # 4 adımlı onaylı karşılama
│  ├─ sehir-ara.tsx        # şehir arama modalı (transparentModal)
│  ├─ (tabs)/              # Bugün, Hafta, Uyarılar, Ayarlar + FloatingTabBar
│  └─ ayarlar/             # usume, konumlar, bildirimler
├─ src/
│  ├─ components/          # glass/ (Glass, GlassButton, GlassChip, GlassInput, GlassSegmented,
│  │                       #   IconBadge, ScreenBackground), FloatingTabBar, DayRow, sheets…
│  ├─ constants/           # config (eşikler, depolama anahtarları), officialSources, widget
│  ├─ hooks/               # useWeatherOutfit, useWeatherContext, useProfile, useDailyReminder, useTabFade
│  ├─ i18n/                # tr.json, en.json
│  ├─ logic/               # outfitEngine, slots, effectiveTemp, consent, notifications, widgetContent
│  ├─ services/            # weather (Open-Meteo), geocoding, location, http, notifications
│  ├─ storage/             # cache, consent, profileStore (AsyncStorage)
│  ├─ theme/               # tokens (palet), typography, spacing, useAppTheme
│  ├─ widgets/             # Android widget'ları (küçük/orta), taskHandler, ikon SVG'leri
│  └─ types/index.ts
├─ index.ts                # giriş: expo-router/entry + registerWidgetTaskHandler
├─ scripts/checkContrast.ts
├─ scripts/generate-widget-icons.mjs  # widget SVG ikonlarını Phosphor'dan üretir
├─ docs/V2-YONERGE.md
└─ __tests__/              # motor + onay + bildirim testleri
```

Kod içinde `@/...` takma adı `src/` klasörüne işaret eder.

## Hata durumları

İzin reddi, konum zaman aşımı, çevrimdışı, API hatası ve şema uyuşmazlığı ayrı
ekranlarla karşılanır; son başarılı veri önbellekten "Son güncelleme: HH:MM" ile
gösterilir. Uydurma veri üretilmez.

## Platform notları

- **Klavye:** Android'de `resize`, iOS'ta `KeyboardAvoidingView`; sheet alt kenarı
  her zaman klavyenin üstünde kalır.
- **Tema:** Sistem açık/koyu ayarını izler; hava durumuna göre palet DEĞİŞMEZ.
- **Erişilebilirlik:** Dokunma hedefleri ≥ 44×44, yazı boyutu 1.3× ile sınırlı,
  kontrast `npm run check:contrast` ile doğrulanır; karşılama `useReducedMotion` destekler.
- **Bildirimler:** `expo-notifications` native modül içerir — tam doğrulama için
  development build veya EAS preview APK gerekir (Expo Go'da sınırlı).
- **Tasarım:** Tek "Liquid Glass" malzemesi `src/theme/glass.ts` token'larından gelir
  (`Glass` varyantları: surface/chip/pill/sheet/input). Zemin `ScreenBackground`'da
  hava + gün/gece gradyanı + 3 yumuşak ışık küresi; üstte durum çubuğu scrim'i.
  Gerçek `BlurView` yalnızca sekme çubuğu, hero kart ve sheet'lerde; diğer kartlar
  yarı saydam dolgu + kenarlık (blur'suz). Kıyafet ikon eşlemesi `src/logic/itemIcons.ts`,
  satır gruplama `src/logic/outfitGrouping.ts` (ikisi de testli).
- **Android widget'ları:** `react-native-android-widget` native modül içerir —
  yalnızca development build / EAS APK'da çalışır, Expo Go'da görünmez.
  - İki widget: **Küçük (2×2)** ve **Orta (4×2)**; ikisi de yeniden boyutlandırılabilir,
    `updatePeriodMillis` 30 dk (Android alt sınırı).
  - Veri: uygulamanın AsyncStorage önbelleği + Open-Meteo; ≤30 dk taze önbellek
    doğrudan kullanılır, değilse Open-Meteo'dan yenilenir, olmazsa bayat veri
    "Güncel değil · SS:DD" etiketiyle gösterilir. 3 saatten eski veriyle öneri
    iddiası gösterilmez. Onay veya kayıtlı konum yoksa "Başlamak için dokun".
  - Dokunma uygulamayı açar (`OPEN_APP`); uygulama her başarılı hava durumu
    yenilemesinde `requestWidgetUpdate` ile widget'ları anında tazeler.
  - Palet konumun `is_day` değerine göre gündüz/gece seçilir; RemoteViews blur
    desteklemediği için düz yarı opak gradyan kullanılır.
  - Widget ikonları `scripts/generate-widget-icons.mjs` ile Phosphor defs'ten
    üretilir (`src/widgets/icons.ts` — elle düzenlemeyin).
  - Önizleme görseli eklenmedi; widget seçicide kütüphane varsayılanı görünür.
    Eklemek isterseniz `app.config.ts` içindeki `previewImage` alanına
    `assets/widget-preview/*.png` yolu verin.
  - Ekleme: ana ekranda boş alana uzun bas → Widget'lar → "Ne Giysem?" (Ayarlar'da
    adım adım yardım da var).

## Sorun giderme

- Metro/önbellek: `npx expo start --clear`
- Paket sürümü: `npx expo install --fix`
- Teşhis: `npx expo-doctor`
