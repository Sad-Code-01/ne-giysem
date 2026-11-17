# Ne Giysem? — Gizlilik Politikası

**Son güncelleme:** 17 Kasım 2026
**İletişim:** sadcode (uygulama geliştiricisi)

Bu politika, "Ne Giysem?" mobil uygulamasının (bundles: `com.sadcode.negiysem`, `com.sadik.negiysem`) hangi verileri nasıl işlediğini açıklar.

## 1. Toplanan veriler

Uygulama **hesap gerektirmez** ve kişisel hesap verisi toplamaz. İşlenen veriler:

- **Konum:** GPS ile mevcut konum veya elle seçilen şehir/ilçe. Koordinatlar yalnızca hava tahmini almak için **Open-Meteo** API'sine gönderilir. Seçtiğiniz şehirler cihazınızda yerel olarak (AsyncStorage) saklanır; sunucularımıza yüklenmez.
- **Tercihler:** üşüme duyarlılığı, bildirim saati, tema seçimi, widget arka plan modu — tümü cihazınızda yerel olarak saklanır.
- **Hava durumu verisi:** Open-Meteo'dan anlık alınır; tarafımızca saklanmaz (cihazda kısa süreli önbellek tutulur).

## 2. Üçüncü taraf servisler

- **Open-Meteo** (open-meteo.com): hava tahmini için koordinat/sorgu gönderilir. Kendi gizlilik politikaları geçerlidir.
- **Android widget'ları:** hava özeti cihazınızda üretilir; veri dışarı gönderilmez.

## 3. Bildirimler

Günlük kıyafet hatırlatması yalnızca siz açarsanız ve izin verirseniz gönderilir. Konum veya kişisel veri içermez; yalnızca hava durumuna dayalı kıyafet önerisi metni içerir.

## 4. İzinler

- **Konum (ön plan):** hava durumu ve öneri için. İzin vermeden şehir arama ile devam edebilirsiniz.
- **Bildirimler:** yalnızca hatırlatma için istenir.

## 5. Veri paylaşımı ve satışı

Kişisel veri **satılmaz**, reklam amacıyla paylaşılmaz, analiz/izleme SDK'sı içermez.

## 6. Veri silme

Tüm veriler cihazınızda saklanır. Uygulama içinden "Verileri sıfırla / hesabı kaldır" ile silebilir veya uygulamayı kaldırarak tüm yerel verileri temizleyebilirsiniz.

## 7. Çocuklar

Uygulama her yaş grubuna uygundur; bilerek çocuk verisi toplanmaz.

## 8. Değişiklikler

Politika güncellenirse bu sayfa güncel tarihle yenilenir.
