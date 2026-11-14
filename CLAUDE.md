# Veysel Ustam: proje notları

Konya'da el yapımı 925 ayar gümüş yüzük satan Veysel Ustam'ın sitesi: veyselustam.com.
Projede iki kişi çalışıyor, ikisi de Claude Code kullanıyor. Sohbetler kişinin kendi
bilgisayarında kalır, bu yüzden kalıcı kurallar ve kararlar bu dosyada tutulur.
Yanıtları samimi ve sade Türkçeyle ver.

Depo herkese açık. Bu dosyaya ve koda şifre, anahtar, müşteri bilgisi veya güvenlik
açığı notu yazma.

## Ortak çalışma

- İşe başlamadan önce `git pull`, bitince commit ve push. `main`'e gönderilen kod Vercel
  üzerinden siteye çıkar.
- Aynı dosyada aynı anda çalışmayın. Çakışma olursa diğer kişinin değişikliğini silmeden
  birleştir.
- Önemli bir karar alınınca veya kalıcı bir kural çıkınca bu dosyayı güncelle.
- `.env.local` depoda yok, `.env.local.example` dosyasından oluşturulur.

## Kurallar

- Yalnızca ücretsiz araçlar. Ücretli API veya abonelik önerme.
- Sahibin admin şifresini kullanma. API anahtarını veya şifreyi üçüncü taraf panellere girme.
- Gerçek sipariş verme. Canlı veritabanına onay almadan yazma. Canlı sitede deneme hesabı açma.
- Müşteri yorumları yalnızca müşterinin izniyle ve değiştirilmeden kullanılır.
- Ürün görselleri:
  - İlk görsel gerçek fotoğraf olur, yapay zekâ görselleri ondan sonra gelir.
  - Görsellerde el olmaz. Düz arka plan yerine premium sahneler kullanılır
    (kadife ve fener, ıslak kayrak, antika kutu).
  - Yapay zekânın yazdığı yazı asla yayınlanmaz. Yazılı taşlarda gerçek taş görsele
    yerleştirilir (`scripts/ai_scenes/stone_swap.py`).
  - Ticari kullanımı yasak modeller kullanılmaz (FLUX.1 dev/Kontext dev gibi).
- "Yemen akik" ifadesi müşteriye gösterilmez, hep "Horasan akik" yazılır
  (`src/lib/horasanWording.ts`).

## Teknik yapı

- Next.js 14 App Router, Tailwind, Firebase (Auth ve Firestore), zustand.
- Firebase Storage bu planda çalışmıyor. Admin'den yüklenen fotoğraflar tarayıcıda
  küçültülür (`src/lib/imageCompress.ts`), Firestore `media` koleksiyonuna yazılır ve
  `/api/media/<id>` üzerinden sunulur.
- Admin'den yüklenen videolar yalnızca yükleyen tarayıcıda durur. Kalıcı video için
  `public/videos/` kullanılır.
- `firestore.rules` otomatik yayınlanmaz. Değişince Firebase konsolundan elle yayınlanmalı.
- Online satış anahtarı: `src/lib/shop.ts` içindeki `SALES_OPEN`. Şu an açık. Online
  ödeme yok, sipariş sonrası müşteriyle iletişime geçilir (kapıda ödeme veya havale).

## Ürünler ve dil

- Ürün ekleme adımları için `urun-ekle` becerisine bak.
- Kod içindeki ürünler `src/data/initialProducts.ts` dosyasında. `/admin` açılınca eksik
  olanlar Firestore'a kopyalanır, ürün kodları da (VU-1001 ve sonrası) o sırada verilir.
- Site 6 dilde: tr, en, es, de, ar, ru. Sayfada karışık dil görünmemeli.
  - Arayüz metinleri: `src/i18n/translations.ts`
  - Katalog metinleri: `src/i18n/catalogContent.ts`
- Ürün başlıkları çevirilerle eşleştirildiği için rastgele değiştirilmemeli.
- Menüler ve alt kategoriler: `src/lib/menus.ts`.
- Dil adresleri: Türkçe adresler öneksiz (`/`, `/product/x`). Diğer diller önekli
  (`/en`, `/es`, `/de`, `/ar`, `/ru`, `/en/product/x`). Dil `src/lib/locale.ts` ile
  adresten okunur (`LanguageContext`). Her sayfanın hreflang ve canonical etiketleri
  `src/lib/localeSeo.tsx` ile üretilir, sitemap 6 dili birlikte listeler. `/tr` ana
  adrese yönlendirilir. Yalnızca anasayfa ve ürün sayfaları dil adresine sahip;
  admin, sepet, giriş ve yasal sayfalar Türkçe kalır. Yeni dil adresi gereken bir
  sayfa eklenirse `isLocalizablePath` ve `src/app/[lang]` altına eklenmeli.
- Pinterest ve Meta katalogları `/feed/meta.csv` üzerinden beslenir.

## Kontrol ve yayın

1. `npx tsc --noEmit -p .` (`guzel/`, `scratch/` ve `scripts/` altındaki hatalar önemsenmez).
2. `npx next build`.
3. Görünen değişiklikleri `.claude/launch.json` içindeki `prod` önizlemesinde (port 3005) dene.
4. Commit ve `main`'e push. Vercel durumunun başarılı olduğunu kontrol et.

## Depoda olmayanlar

- Instagram ve Pinterest çalışma klasörleri (`veyselustaminstagram`, `veyselustampinterest`)
  büyük olduğu için depoda değil, ayrıca paylaşılıyor.
- Yerel yapay zekâ görsel kurulumu (ComfyUI ve Qwen-Image-Edit, bkz. `scripts/ai_scenes/`)
  bilgisayara özeldir, her makinede ayrıca kurulmalı.

## Bekleyen işler

Sahibin elle yapacakları:
- `firestore.rules` dosyasının güncel hâlini Firebase konsolundan yayınlamak.
- `/admin` panelini bir kez açıp kayıt ve ürün kodu işlemlerinin bitmesini beklemek.
- Küçük bir deneme siparişiyle siparişin admin'e düştüğünü kontrol edip iptal etmek.
- Ortağı GitHub'a ve Firebase'e eklemek; Instagram ve Pinterest klasörlerini Drive'dan paylaşmak.

Kod tarafında:
- Yeni sipariş bildirimi (ör. müşterinin sipariş özetini WhatsApp'tan göndermesi).
- Mesafeli Satış Sözleşmesi, Ön Bilgilendirme Formu ve onay kutusu; satıcı bilgileri.
- İngilizce "Free Worldwide Shipping" yazısının netleştirilmesi; formda ülke alanı yok.
- Ölçünün kendiliğinden seçili gelmesi yerine müşteriye seçtirilmesi.
- Hilal yüzüğündeki Osmanlıca yazının metni; Süleyman mührü ayetinin teyidi.
- Yemen Akik alt kategorisi kaldırılacak mı?
- İndirimler gerçekten yalnızca üyelere mi uygulanacak? (Şu an sadece not gösteriliyor.)
