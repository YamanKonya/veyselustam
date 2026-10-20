# Yönetim paneli güvenliği (Firebase)

Yönetici girişi artık Firebase Authentication ile yapılıyor; ürün/ayar yazma ve
sipariş listeleme yetkisini Firebase sunucusu `firestore.rules` ile kontrol ediyor.
Tarayıcıdaki kontrol atlatılsa bile veritabanına yazılamaz.

Kim ne yapabilir:

| Veri | Herkes | Giriş yapmış müşteri | Yönetici |
|---|---|---|---|
| Ürünler | okur | okur | okur + yazar + siler |
| Siparişler | yeni sipariş verir, kendi sipariş numarasıyla tek siparişi açar | aynı | hepsini listeler, durum günceller |
| Müşteri profili (`users`) | – | yalnızca kendisininkini; kendine admin rolü veremez | hepsini okur |
| Ayarlar (`settings`) | yalnızca `adminLogin` (kullanıcı adı → e-posta) | aynı | okur + yazar |
| `admins` listesi | – | yalnızca kendi kaydı var mı | aynı (siteden kimse yazamaz) |
| Storage dosyaları | okur | okur | yükler + siler |

## Bir kerelik kurulum (Firebase konsolu)

1. **Authentication → Sign-in method** sekmesinde **Email/Password** açık olsun.
2. **Authentication → Users → Add user**:
   e-posta `veyseloztoprak@gmail.com` (veya `.env.local` içindeki `NEXT_PUBLIC_ADMIN_EMAIL`),
   şifre `2026` kabul edilmez (Firebase en az 6 karakter ister) → örn. `veysel2026`.
   Oluşan satırdaki **User UID** değerini kopyala.
3. **Firestore Database → Data → Start collection**: koleksiyon adı `admins`,
   belge kimliği = kopyaladığın UID, içine bir alan: `email` (string) = yöneticinin e-postası.
4. (İsteğe bağlı) `settings/adminCredentials` belgesi varsa sil; eski şifre özeti artık kullanılmıyor.
5. Kuralları yayınla (aşağıdaki iki yoldan biri).

Giriş: `/admin` → kullanıcı adı `veysel`, şifre 2. adımda verdiğin şifre.
Panelde **Giriş Bilgileri** sayfasından şifre ve görünen kullanıcı adı değiştirilebilir.

## Kuralları yayınlama

**Konsoldan (en kolayı):**
- Firestore Database → **Rules** → `firestore.rules` dosyasının içeriğini yapıştır → **Publish**.
- Storage → **Rules** → `storage.rules` içeriğini yapıştır → **Publish**
  (Storage hiç açılmadıysa bu adımı atla).

**Komut satırından:**
```
npm install -g firebase-tools
firebase login
firebase use --add            # projeyi seç
firebase deploy --only firestore:rules,storage
```

Önce 1–3. adımları yap: kurallar yayınlandığı anda `admins` kaydı olmayan hesap ürün kaydedemez.
