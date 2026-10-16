# -*- coding: utf-8 -*-
import json
import re

with open(r'c:\Users\ROGSTRIX\Downloads\veyselustam\src\data\initialProducts.ts', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const INITIAL_VEYSELUSTAM_PRODUCTS: Product\[\] = (\[.*?\]);', content, re.DOTALL)
if not match:
    print('Hata: Ürün dizisi bulunamadı.')
    exit(1)

products = json.loads(match.group(1))

def calculate_new_price(p):
    title = (p.get('title') or '').lower()
    desc = (p.get('description') or '').lower()
    cat = (p.get('category') or '').lower()
    old_price = p.get('price', 0)
    
    # 1. Özel Çizim / Hizmet
    if 'çizim' in title or 'tasarım' in title and old_price < 2000:
        return 6000, "1. Hizmet / Tasarım Başlangıç"
    
    # İşçilik puanı hesaplama
    score = 0
    
    # Başlık ve Açıklamadaki Usta İşçilik İpuçları
    if 'nakkaş' in title or 'nakkaş' in desc or 'nakkaş' in cat:
        score += 35
    if 'zülfikar' in title or 'zulfikar' in title:
        score += 25
    if any(k in title or k in desc for k in ['hat sanatı', 'kaligrafi', 'oyması', 'oyma', 'kazıma', 'el oyması', 'kalem işi']):
        score += 25
    if any(k in title or k in desc for k in ['ayet', 'salavat', 'allahümme', 'buda geçer', 'ya baki', 'cevşen', 'vefk', 'bismillâhirrahmânirrahîm']):
        score += 20
    if any(k in title or k in desc for k in ['zümrüt', 'yakut', 'safir']):
        score += 20
    if any(k in title or k in desc for k in ['horasan', 'yemen', 'necef', 'akik']):
        score += 15
    if any(k in title or k in desc for k in ['özel yapım', 'gösterişli', 'ağır']):
        score += 10
        
    # Eski fiyata göre taban etki (orijinal oran korunumu)
    if old_price >= 8000:
        score += 25
    elif old_price >= 7000:
        score += 15
    elif old_price >= 6000:
        score += 10
        
    # Seviyelere göre fiyat belirleme
    if score >= 60:
        # 5. Kademe: Master Nakkaş / Hat & Özel Başyapıt
        # 11.500 - 13.900 TL
        base = 11500 + (score - 60) * 80
        tier = "5. Seviye (Usta Başyapıtı / Derin Rölyef & Hat)"
    elif score >= 40:
        # 4. Kademe: Yüksek Seviye İşçilik (Kaligrafi & Mikro Oymacılık)
        # 9.450 - 11.200 TL
        base = 9450 + (score - 40) * 85
        tier = "4. Seviye (Yüksek Seviye İşçilik & Kaligrafi)"
    elif score >= 25:
        # 3. Kademe: Orta-Üst İşçilik (Özel Horasan/Yemen Akik & Kalem İşlemeli)
        # 7.950 - 9.200 TL
        base = 7950 + (score - 25) * 80
        tier = "3. Seviye (Orta-Üst İşçilik / Doğal Akik & Kalemkar)"
    elif score >= 10:
        # 2. Kademe: Standart Usta İşçiliği El Yapımı Gümüş Yüzük
        # 6.850 - 7.750 TL
        base = 6850 + (score - 10) * 60
        tier = "2. Seviye (Standart Usta İşçiliği Yüzük)"
    else:
        # 1. Kademe: Giriş Seviyesi (Minimum 6.000 TL kuralı)
        # 6.000 - 6.650 TL
        base = 6000 + score * 50
        tier = "1. Seviye (Giriş Seviye El İşçiliği)"
        
    # Fiyatı 90'lı veya 50'li e-ticaret psikolojik sonuca yuvarla (örn: 7.890 veya 8.450)
    rounded_price = round(base / 50) * 50 - 1  # örn 7949 -> 7950 veya 7899
    # En az 6000 TL garanti
    final_price = max(6000, rounded_price)
    # Eğer sonu 49 ise 50 yapalım veya temiz görünüm için 90'a yuvarlayalım
    if final_price % 100 in [49, 99]:
        final_price = final_price
    else:
        final_price = (final_price // 50) * 50
        
    return int(final_price), tier

results = []
for p in products:
    new_price, tier = calculate_new_price(p)
    old_p = p.get('price', 0)
    results.append({
        'id': p.get('id'),
        'title': p.get('title'),
        'old': old_p,
        'new': new_price,
        'diff': new_price - old_p,
        'pct': int(((new_price - old_p) / old_p) * 100) if old_p > 0 else 0,
        'tier': tier
    })

print(f"Toplam {len(results)} ürün analiz edildi.")
print(f"Yeni Min Fiyat: {min(r['new'] for r in results)} TL")
print(f"Yeni Max Fiyat: {max(r['new'] for r in results)} TL")
print(f"Yeni Ortalama Fiyat: {sum(r['new'] for r in results) / len(results):.1f} TL")

print("\n--- KADEMELERE GÖRE DAĞILIM ---")
tiers_count = {}
for r in results:
    t = r['tier']
    tiers_count[t] = tiers_count.get(t, 0) + 1
for k, v in sorted(tiers_count.items()):
    print(f"{k}: {v} ürün")

print("\n--- ÖRNEK FİYAT DEĞİŞİMLERİ (10 Ürün) ---")
for r in results[:10]:
    print(f"[{r['id']}] {r['old']} TL -> {r['new']} TL (+%{r['pct']}) | {r['tier']} | {r['title'][:45]}...")
