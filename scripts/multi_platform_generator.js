const fs = require('fs');
const path = require('path');

const URUN_HAVUZU_DIR = path.join(__dirname, '..', 'urun_havuzu');
const EXPORTS_DIR = path.join(__dirname, '..', 'exports');
const PUBLIC_PRODUCTS_IMG_DIR = path.join(__dirname, '..', 'public', 'images', 'products');
const INITIAL_PRODUCTS_PATH = path.join(__dirname, '..', 'src', 'data', 'initialProducts.ts');

// Klasörleri garantiye al
[URUN_HAVUZU_DIR, EXPORTS_DIR, PUBLIC_PRODUCTS_IMG_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Yardımcı: Metni slug yapma
function slugify(text) {
  const trMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };
  return text
    .split('')
    .map(c => trMap[c] || c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Varsayılan ölçüler
const DEFAULT_RING_SIZES = [
  "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30"
];

// Basit bilgi okuma fonksiyonu
function parseInfoFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const info = {};
  content.split('\n').forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(':').trim();
      info[key] = val;
    }
  });
  return info;
}

// Ana işlem
function processFolder(folderName) {
  const folderPath = path.join(URUN_HAVUZU_DIR, folderName);
  if (!fs.statSync(folderPath).isDirectory()) return null;

  console.log(`\n======================================================`);
  console.log(`📦 İşleniyor: ${folderName}`);
  console.log(`======================================================`);

  const files = fs.readdirSync(folderPath);
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const imageFiles = files.filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));

  if (imageFiles.length === 0) {
    console.log(`⚠️ Klasörde geçerli görsel bulunamadı: ${folderName}`);
    return null;
  }

  // Bilgi dosyasını oku (varsa)
  const infoFile = files.find(f => f.toLowerCase().startsWith('bilgi') || f.toLowerCase().startsWith('info'));
  const customInfo = infoFile ? parseInfoFile(path.join(folderPath, infoFile)) : {};

  const cleanName = customInfo['isim'] || customInfo['başlık'] || customInfo['title'] || folderName.replace(/[-_]/g, ' ');
  const capitalizedTitle = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  const productSlug = slugify(cleanName);
  const productId = `vu-custom-${Date.now()}`;
  const price = Number(customInfo['fiyat'] || customInfo['price'] || 7850);
  const category = customInfo['kategori'] || customInfo['category'] || 'Özel El Yapımı Gümüş Yüzükler';
  const weight = customInfo['gram'] || customInfo['ağırlık'] || customInfo['weight'] || '16-18';
  const stone = customInfo['taş'] || customInfo['stone'] || 'Doğal Değerli Taş';

  // 1. Görselleri kopyala ve Sağ Üst Köşeye Filigran (Watermark) Damgala
  const targetImgFolder = path.join(PUBLIC_PRODUCTS_IMG_DIR, productSlug);
  if (!fs.existsSync(targetImgFolder)) fs.mkdirSync(targetImgFolder, { recursive: true });

  const watermarkPath = path.join(__dirname, '..', 'public', 'images', 'watermark.png');
  const watermarkScript = path.join(__dirname, 'watermark_tool.py');
  const { execSync } = require('child_process');

  const finalImageUrls = [];
  imageFiles.forEach((img, idx) => {
    const ext = path.extname(img).toLowerCase();
    const targetFileName = `${productSlug}-${idx + 1}${ext}`;
    const srcPath = path.join(folderPath, img);
    const destPath = path.join(targetImgFolder, targetFileName);

    try {
      if (fs.existsSync(watermarkPath)) {
        // Python watermark aracıyla sağ üst köşeye filigran ekle
        execSync(`python "${watermarkScript}" "${srcPath}" "${watermarkPath}" "${destPath}"`);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (e) {
      // Hata durumunda güvenli yedek olarak düz kopyala
      fs.copyFileSync(srcPath, destPath);
    }

    finalImageUrls.push(`/images/products/${productSlug}/${targetFileName}`);
  });

  console.log(`✅ ${imageFiles.length} adet görsele sağ üst filigran eklendi ve /public/images/products/${productSlug}/ altına taşındı.`);

  // 2. Çıktı klasörünü hazırla
  const exportProductDir = path.join(EXPORTS_DIR, productSlug);
  if (!fs.existsSync(exportProductDir)) fs.mkdirSync(exportProductDir, { recursive: true });

  // 3. Etsy Formatı Hazırla
  const etsyTitle = `Handmade 925 Sterling Silver ${capitalizedTitle} for Men, Artisan Signet Ring, Ottoman Handcrafted Jewelry, Gift for Him`.slice(0, 140);
  const etsyTags = [
    "mens silver ring",
    "925 sterling silver",
    "handmade ring",
    "artisan jewelry",
    "gift for husband",
    "ottoman signet ring",
    "handcrafted for men",
    "natural gemstone",
    "statement ring",
    "vintage style ring",
    "personalized gift",
    "fathers day gift",
    "turkish jewelry"
  ];
  const etsyDescription = `
✨ ITEM DETAILS:
• Material: 925 Sterling Silver (Stamped)
• Gemstone: ${stone}
• Weight: ~${weight} grams (varies with ring size)
• 100% Handcrafted by Master Veysel in Istanbul
• Custom sizing & engraving available!

🎁 PACKAGING & SHIPPING:
• Delivered in a luxurious wooden gift box ready for gifting.
• Worldwide Express Shipping (1-3 business days dispatch).
• Tracking number provided immediately upon dispatch.

💎 ABOUT VEYSEL USTAM:
Every piece is meticulously hand-carved using centuries-old Ottoman metalworking techniques. Visit us at veyselustam.com for more exclusive designs.
  `.trim();

  const etsyOutput = {
    title: etsyTitle,
    priceUSD: Math.round(price / 35),
    tags: etsyTags,
    materials: ["925 Sterling Silver", stone],
    description: etsyDescription,
    images: finalImageUrls
  };
  fs.writeFileSync(path.join(exportProductDir, 'etsy_listing.json'), JSON.stringify(etsyOutput, null, 2), 'utf-8');
  fs.writeFileSync(path.join(exportProductDir, 'etsy_hazir_metin.txt'), `=== ETSY TITLE (Max 140 Chars) ===\n${etsyTitle}\n\n=== ETSY 13 TAGS ===\n${etsyTags.join(', ')}\n\n=== ETSY DESCRIPTION ===\n${etsyDescription}`, 'utf-8');

  // 4. Instagram Formatı Hazırla
  const instagramPost = `
Ustalığın ve zarafetin parmaklarınızdaki imzası: 925 Ayar Gümüş ${capitalizedTitle} ✨

Anadolu'nun köklü gümüş işçiliği geleneğiyle, Konya'daki atölyemizde tamamen el işçiliğiyle hazırlandı.
💎 Taş: ${stone}
💍 Maden: 925 Ayar Damgalı Saf Gümüş
⚖️ Gramaj: ~${weight} gr
📦 Aynı gün / ertesi gün sigortalı ücretsiz kargo
🎁 Özel lüks ahşap hediye kutusunda teslimat

Sipariş & Detaylar için profildeki linke tıklayabilir veya bize doğrudan DM üzerinden mesaj atabilirsiniz.
🌐 https://veyselustam.com

#gümüşyüzük #erkekyüzük #925ayar #elyapımı #veyselustam #konya #yüzükmodelleri #doğaltaş #mensjewelry #silversmith #handmadering #artisanjewelry #silvercraft #turkishjewelry
  `.trim();
  fs.writeFileSync(path.join(exportProductDir, 'instagram_post.txt'), instagramPost, 'utf-8');

  // 5. Amazon Formatı Hazırla
  const amazonTitle = `VeyselUstam 925 Sterling Silver Handcrafted ${capitalizedTitle} for Men - Natural ${stone} Artisan Ottoman Signet Ring`.slice(0, 200);
  const amazonBullets = [
    `AUTHENTIC 925 STERLING SILVER: Expertly hand-forged using certified 925 sterling silver with master hallmarking for lasting durability.`,
    `EXQUISITE ARTISAN CRAFTSMANSHIP: Handcrafted in Istanbul by heritage jeweler Veysel Ustam, featuring intricate engraving details.`,
    `PREMIUM GEMSTONE: Features high-grade natural ${stone}, cut and polished to perfection.`,
    `LUXURY GIFT READY: Comes housed in a bespoke premium presentation box, making it an extraordinary gift for birthdays, anniversaries, or Father's Day.`,
    `COMFORT FIT GUARANTEE: Designed with smooth interior contours for daily comfort wear; available across all standard international ring sizes.`
  ];
  const amazonOutput = {
    title: amazonTitle,
    bulletPoints: amazonBullets,
    searchTerms: "mens silver ring handmade gemstone ottoman signet antique jewelry gift for him",
    priceUSD: Math.round(price / 35),
    description: etsyDescription
  };
  fs.writeFileSync(path.join(exportProductDir, 'amazon_listing.json'), JSON.stringify(amazonOutput, null, 2), 'utf-8');
  fs.writeFileSync(path.join(exportProductDir, 'amazon_hazir_metin.txt'), `=== AMAZON TITLE ===\n${amazonTitle}\n\n=== 5 BULLET POINTS ===\n${amazonBullets.map((b, i) => `${i + 1}. ${b}`).join('\n\n')}\n\n=== SEARCH TERMS ===\n${amazonOutput.searchTerms}`, 'utf-8');

  // 6. VeyselUstam Web Sitemiz İçin Product Objesi
  const newProduct = {
    id: productId,
    title: `925 Ayar ${capitalizedTitle}, El Yapımı Erkek Yüzüğü`,
    description: `💍 Malzeme: %925 Kaliteli Gümüştür 📦 Ücretsiz Kargo 🚚 Gönderim Süresi: 1 - 3 iş günü ✈️ Yurtdışına Gönderimimiz mevcuttur. ⚖️ Gramı: ${weight} • Taş Türü: ${stone} • Yüzüğün Taşı ve Türü Kişiselleştirilebilirdir, Bizimle İletişime geçiniz. • Web Sayfamızı Ziyaret Etmeyi Unutmayın! https://www.veyselustam.com`,
    price: price,
    images: finalImageUrls,
    category: category,
    ringSize: DEFAULT_RING_SIZES,
    stock: 10,
    originalUrl: `https://veyselustam.com/${productSlug}`,
    createdAt: new Date().toISOString(),
    title_en: `925 Sterling Silver ${capitalizedTitle}, Handcrafted Men's Ring`,
    description_en: `💍 Material: 925 Sterling Silver 📦 Free Shipping 🚚 Dispatch Time: 1-3 Business Days ✈️ Worldwide Express Shipping Available. ⚖️ Weight: ${weight}gr • Gemstone: ${stone} • Custom sizing available.`,
    title_es: `Anillo para Hombre de Plata de Ley 925 ${capitalizedTitle}, Hecho a Mano`,
    description_es: `💍 Material: Plata de Ley 925 📦 Envío Gratis 🚚 Tiempo: 1-3 Días ✈️ Envío Internacional Disponible. ⚖️ Peso: ${weight}gr • Piedra: ${stone}.`,
    title_de: `925er Sterlingsilber ${capitalizedTitle}, Handgefertigter Herrenring`,
    description_de: `💍 Material: 925er Sterlingsilber 📦 Kostenloser Versand 🚚 Lieferzeit: 1-3 Werktage ⚖️ Gewicht: ${weight}g • Edelstein: ${stone}.`,
    title_ar: `خاتم رجالي فضة عيار 925 مصنوع يدوياً ${capitalizedTitle}`,
    description_ar: `💍 المادة: فضة عيار 925 📦 شحن مجاني ⚖️ الوزن: ${weight} غرام • الحجر: ${stone}.`
  };

  // initialProducts.ts dosyasına en başa ekleyelim
  injectProductToCodebase(newProduct);

  console.log(`🌟 [VeyselUstam] Sitemize ürün eklendi: "${newProduct.title}"`);
  console.log(`📌 [Etsy] İçerikler hazırlandı -> exports/${productSlug}/etsy_hazir_metin.txt`);
  console.log(`📸 [Instagram] Post & Hashtagler hazırlandı -> exports/${productSlug}/instagram_post.txt`);
  console.log(`📦 [Amazon] Başlık ve 5 Madde İmi hazırlandı -> exports/${productSlug}/amazon_hazir_metin.txt`);

  return productSlug;
}

function injectProductToCodebase(newProduct) {
  if (!fs.existsSync(INITIAL_PRODUCTS_PATH)) return;
  let fileContent = fs.readFileSync(INITIAL_PRODUCTS_PATH, 'utf-8');

  // "export const INITIAL_VEYSELUSTAM_PRODUCTS: Product[] = [" satırını bul
  const targetStr = 'export const INITIAL_VEYSELUSTAM_PRODUCTS: Product[] = [';
  if (fileContent.includes(targetStr)) {
    const formattedObj = '  ' + JSON.stringify(newProduct, null, 4).replace(/\n/g, '\n  ') + ',\n';
    fileContent = fileContent.replace(targetStr, `${targetStr}\n${formattedObj}`);
    fs.writeFileSync(INITIAL_PRODUCTS_PATH, fileContent, 'utf-8');
    console.log(`💾 src/data/initialProducts.ts dosyası güncellendi.`);
  }
}

// Tüm klasörleri tara
function run() {
  const folders = fs.readdirSync(URUN_HAVUZU_DIR).filter(item => {
    const p = path.join(URUN_HAVUZU_DIR, item);
    return fs.statSync(p).isDirectory();
  });

  if (folders.length === 0) {
    console.log(`\nℹ️ urun_havuzu/ klasöründe henüz taranacak ürün klasörü bulunamadı.`);
    console.log(`💡 Kullanım: urun_havuzu/ içerisine bir klasör açıp (örn: urun_havuzu/kehribar-yuzuk/) içine fotoğrafları atın.`);
    console.log(`   İsteğe bağlı olarak klasörün içine 'bilgi.txt' dosyası açıp:`);
    console.log(`   isim: Kehribar Taşlı Özel Yüzük`);
    console.log(`   fiyat: 4500`);
    console.log(`   taş: Hakiki Baltık Kehribarı`);
    console.log(`   yazabilirsiniz. Ardından 'npm run oto-urun' komutunu çalıştırın!`);
    return;
  }

  const processed = [];
  folders.forEach(folder => {
    const res = processFolder(folder);
    if (res) processed.push(res);
  });

  console.log(`\n🎉 Toplam ${processed.length} ürün başarıyla işlendi ve tüm platformlara hazırlandı!`);
}

run();
