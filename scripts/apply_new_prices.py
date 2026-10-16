# -*- coding: utf-8 -*-
import json
import re

DATA_PATH = r'c:\Users\ROGSTRIX\Downloads\veyselustam\src\data\initialProducts.ts'

with open(DATA_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const INITIAL_VEYSELUSTAM_PRODUCTS: Product\[\] = (\[.*?\]);', content, re.DOTALL)
if not match:
    print('Hata: initialProducts.ts içerisinde ürün listesi bulunamadı.')
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
    if any(k in title or k in desc for k in ['ayet', 'salavat', 'allahümme', 'buda geçer', 'ya baki', 'cevşen', 'vefk', 'bismillâhirrahmânirrahîm', 'inşirah']):
        score += 20
    if any(k in title or k in desc for k in ['zümrüt', 'yakut', 'safir']):
        score += 20
    if any(k in title or k in desc for k in ['horasan', 'yemen', 'necef', 'akik']):
        score += 15
    if any(k in title or k in desc for k in ['özel yapım', 'gösterişli', 'ağır']):
        score += 10
        
    # Eski fiyata göre taban etki
    if old_price >= 8500:
        score += 25
    elif old_price >= 7000:
        score += 15
    elif old_price >= 5500:
        score += 10
        
    # Kademeli fiyatlandırma
    if score >= 60:
        # 5. Kademe: Usta Başyapıtı (11.850 - 14.850 TL)
        base = 11850 + (score - 60) * 75
        tier = "Kademe 5 (Usta Başyapıtı / Nakkaş & Rölyef)"
    elif score >= 40:
        # 4. Kademe: Yüksek Seviye İşçilik & Kaligrafi (9.450 - 11.500 TL)
        base = 9450 + (score - 40) * 80
        tier = "Kademe 4 (Yüksek Seviye İşçilik & Mikro Hat)"
    elif score >= 25:
        # 3. Kademe: Orta-Üst İşçilik (7.850 - 8.950 TL)
        base = 7850 + (score - 25) * 65
        tier = "Kademe 3 (Orta-Üst İşçilik / Horasan-Yemen Akik)"
    elif score >= 10:
        # 2. Kademe: Standart Usta İşçiliği (6.850 - 7.500 TL)
        base = 6850 + (score - 10) * 40
        tier = "Kademe 2 (Standart Usta İşçiliği Gümüş)"
    else:
        # 1. Kademe: Giriş Seviyesi (Minimum 6.000 TL)
        base = 6000 + score * 40
        tier = "Kademe 1 (Giriş Seviye El İşçiliği)"
        
    # 50'li yuvarlama (örn: 7.850, 7.900, 8.450, 9.200)
    rounded = int(round(base / 50.0) * 50)
    final_price = max(6000, min(14850, rounded))
    
    return final_price, tier

# Ürünleri güncelle
updated_products = []
summary = []

for p in products:
    old_p = p.get('price', 0)
    new_p, tier = calculate_new_price(p)
    
    p['price'] = new_p
    # Eğer kampanya veya originalPrice varsa orantılı ayarla
    if p.get('originalPrice'):
        p['originalPrice'] = int(round(new_p * 1.25 / 50.0) * 50)
        
    updated_products.append(p)
    summary.append({
        'id': p.get('id'),
        'title': p.get('title'),
        'old': old_p,
        'new': new_p,
        'tier': tier
    })

# Yeni içeriği dosyaya yaz
formatted_json = json.dumps(updated_products, ensure_ascii=False, indent=2)
new_file_content = f"""import {{ Product }} from "@/types";

export const INITIAL_VEYSELUSTAM_PRODUCTS: Product[] = {formatted_json};
"""

with open(DATA_PATH, 'w', encoding='utf-8') as f:
    f.write(new_file_content)

print(f"BAŞARILI: {len(updated_products)} ürünün fiyatı güncellendi ve {DATA_PATH} dosyasına yazıldı.")
print(f"Minimum Fiyat: {min(p['price'] for p in updated_products)} TL (Garanti >= 6000 TL)")
print(f"Maksimum Fiyat: {max(p['price'] for p in updated_products)} TL")
print(f"Ortalama Fiyat: {sum(p['price'] for p in updated_products) / len(updated_products):.0f} TL")
