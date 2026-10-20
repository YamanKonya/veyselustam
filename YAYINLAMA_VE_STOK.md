# Canlıya alma ve kasa stoğu

## 1. Canlıya alma (Vercel)

Site GitHub'a (`main` dalı) gönderildiğinde Vercel otomatik yayınlar.
Yayının durumunu vercel.com → **veyselustam** projesi → **Deployments** sekmesinde görürsün.

Vercel'de bir kez kontrol edilmesi gerekenler (**Project → Settings → Environment Variables**):

| Değişken | Not |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` ve diğer `NEXT_PUBLIC_FIREBASE_*` | `.env.local` dosyandaki değerlerle aynı olmalı (zaten varsa dokunma) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | İsteğe bağlı. Yönetici e-postası; girilmezse `veyseloztoprak@gmail.com` kullanılır |

Değişken eklersen/değiştirirsen **Deployments → son yayın → Redeploy** de, yoksa yeni değer kullanılmaz.

## 2. Firebase kurallarını güncelle (kasa stoğu için şart)

Kasa stoğunun satışta düşmesi için yeni kuralların yayınlanması gerekir:

1. Firebase konsolu → **Firestore Database → Rules**
2. Depodaki `firestore.rules` dosyasının **tamamını** yapıştır → **Publish**

Kurallar yayınlanana kadar siparişler yine alınır ama stok düşmez.

## 3. Sidre kasasını kurma

1. `/admin` → **Kasa Stokları** → kasa adı `Sidre`, stok örneğin `12` → **Kasa ekle**
2. **Ürün & Katalog Yönetimi** → Sidre Akik ürününü düzenle → **Stok kasası: Sidre** → kaydet
3. Aynısını Sidre Hematit, Sidre Lâ ilâhe illallah… için yap

Bundan sonra:
- Bu ürünlerden hangisi satılırsa satılsın Sidre stoğu adet kadar düşer.
- Sidre stoğu 0 olunca bağlı ürünlerin hepsi sitede **Tükendi** görünür ve sepete eklenemez.
- Yeni kasa geldiğinde **Kasa Stokları** sayfasından stoğu artır.
- Bir siparişi **Sipariş Takibi**'nde **İptal** yaparsan düşülen stok geri eklenir (bir kez).

Kasaya bağlı olmayan ürünlerde stok, ürün formundaki **Stok adedi** alanından yönetilir ve satışta o düşer.
