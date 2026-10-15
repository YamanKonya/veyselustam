const fs = require('fs');
const path = './src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

const newKeys = {
    tr: `    hero_slide1_badge: "GELENEKSEL EL İŞÇİLİĞİ",
    hero_slide1_title: "Özel Tasarım Gümüş Yüzükler",
    hero_slide1_desc: "Nesiller boyu aktarılan ustalık ve özenle işlenen gümüşün zarafeti parmaklarınızda hayat buluyor.",
    hero_slide1_btn: "KOLEKSİYONU KEŞFET",
    hero_slide2_badge: "DOĞAL TAŞLARIN BÜYÜSÜ",
    hero_slide2_title: "Hakiki Akik ve Zümrüt",
    hero_slide2_desc: "Özenle seçilmiş doğal taşlar ve eşsiz el oyması motiflerle tarzınıza asalet katın.",
    hero_slide2_btn: "ŞİMDİ İNCELE",
    banner_craft_title: "EL İŞÇİLİĞİ",
    banner_craft_desc: "Özel Tasarımlar",
    banner_stone_title: "DOĞAL TAŞ",
    banner_stone_desc: "Akik ve Zümrüt",
    banner_custom_title: "ÖZEL SİPARİŞ",
    banner_custom_desc: "İsme Özel Oyma",
    search_results: "Arama Sonuçları",
    search_results_for: '"{query}" için {count} sonuç bulundu.',
    search_no_results: "Aradığınız kritere uygun ürün bulunamadı.",
    tab_new: "YENİ ÜRÜNLER",
    tab_bestseller: "ÇOK SATANLAR",
    tab_collection: "ÖZEL KOLEKSİYON",
    btn_inspect: "İncele",
    btn_add_to_cart: "SEPETE EKLE",
    seo_title: "VEYSEL USTAM - ÖZEL TASARIM YÜZÜKLER",
    seo_desc: "Gümüş işçiliğinde yılların verdiği tecrübe ile en özel doğal taşları, usta ellerde şekillendirerek size özel yüzüklere dönüştürüyoruz.",
    recent_products: "Son Gezilen Ürünler",`,
    en: `    hero_slide1_badge: "TRADITIONAL HANDCRAFT",
    hero_slide1_title: "Custom Design Silver Rings",
    hero_slide1_desc: "Mastery passed down through generations and the elegance of carefully crafted silver comes to life on your fingers.",
    hero_slide1_btn: "EXPLORE COLLECTION",
    hero_slide2_badge: "MAGIC OF NATURAL STONES",
    hero_slide2_title: "Genuine Agate & Emerald",
    hero_slide2_desc: "Add nobility to your style with carefully selected natural stones and unique hand-carved motifs.",
    hero_slide2_btn: "VIEW NOW",
    banner_craft_title: "HANDCRAFT",
    banner_craft_desc: "Custom Designs",
    banner_stone_title: "NATURAL STONE",
    banner_stone_desc: "Agate & Emerald",
    banner_custom_title: "CUSTOM ORDER",
    banner_custom_desc: "Custom Name Engraving",
    search_results: "Search Results",
    search_results_for: 'Found {count} results for "{query}".',
    search_no_results: "No products found matching your criteria.",
    tab_new: "NEW ARRIVALS",
    tab_bestseller: "BEST SELLERS",
    tab_collection: "SPECIAL COLLECTION",
    btn_inspect: "View",
    btn_add_to_cart: "ADD TO CART",
    seo_title: "VEYSEL USTAM - CUSTOM DESIGN RINGS",
    seo_desc: "With years of experience in silver craftsmanship...",
    recent_products: "Recently Viewed",`,
    es: `    hero_slide1_badge: "ARTESANÍA TRADICIONAL",
    hero_slide1_title: "Anillos de Plata de Diseño Especial",
    hero_slide1_desc: "La maestría transmitida de generación en generación...",
    hero_slide1_btn: "EXPLORAR COLECCIÓN",
    hero_slide2_badge: "MAGIA DE PIEDRAS NATURALES",
    hero_slide2_title: "Ágata Genuina y Esmeralda",
    hero_slide2_desc: "Agregue nobleza a su estilo...",
    hero_slide2_btn: "VER AHORA",
    banner_craft_title: "ARTESANÍA",
    banner_craft_desc: "Diseños Especiales",
    banner_stone_title: "PIEDRA NATURAL",
    banner_stone_desc: "Ágata y Esmeralda",
    banner_custom_title: "PEDIDO ESPECIAL",
    banner_custom_desc: "Grabado de Nombre",
    search_results: "Resultados de la búsqueda",
    search_results_for: 'Se encontraron {count} resultados para "{query}".',
    search_no_results: "No se encontraron productos.",
    tab_new: "NUEVOS",
    tab_bestseller: "MÁS VENDIDOS",
    tab_collection: "COLECCIÓN ESPECIAL",
    btn_inspect: "Ver",
    btn_add_to_cart: "AÑADIR A LA CESTA",
    seo_title: "VEYSEL USTAM - ANILLOS DE DISEÑO",
    seo_desc: "Con años de experiencia en orfebrería de plata...",
    recent_products: "Visto Recientemente",`,
    de: `    hero_slide1_badge: "TRADITIONELLE HANDWERKSKUNST",
    hero_slide1_title: "Silberringe im Sonderdesign",
    hero_slide1_desc: "Die von Generation zu Generation weitergegebene Meisterschaft...",
    hero_slide1_btn: "KOLLEKTION ENTDECKEN",
    hero_slide2_badge: "MAGIE DER NATURSTEINE",
    hero_slide2_title: "Echter Achat & Smaragd",
    hero_slide2_desc: "Verleihen Sie Ihrem Stil Adel...",
    hero_slide2_btn: "JETZT ANSEHEN",
    banner_craft_title: "HANDWERK",
    banner_craft_desc: "Sonderdesigns",
    banner_stone_title: "NATURSTEIN",
    banner_stone_desc: "Achat & Smaragd",
    banner_custom_title: "SONDERBESTELLUNG",
    banner_custom_desc: "Namensgravur",
    search_results: "Suchergebnisse",
    search_results_for: '{count} Ergebnisse für "{query}" gefunden.',
    search_no_results: "Keine Produkte gefunden.",
    tab_new: "NEUHEITEN",
    tab_bestseller: "BESTSELLER",
    tab_collection: "SONDERKOLLEKTION",
    btn_inspect: "Ansehen",
    btn_add_to_cart: "IN DEN WARENKORB",
    seo_title: "VEYSEL USTAM - DESIGNRINGE",
    seo_desc: "Mit jahrelanger Erfahrung in der Silberverarbeitung...",
    recent_products: "Zuletzt Angesehen",`,
    ar: `    hero_slide1_badge: "صناعة يدوية تقليدية",
    hero_slide1_title: "خواتم فضة بتصميم خاص",
    hero_slide1_desc: "الإتقان المتوارث عبر الأجيال وأناقة الفضة المشغولة بعناية تنبض بالحياة على أصابعك.",
    hero_slide1_btn: "استكشف المجموعة",
    hero_slide2_badge: "سحر الأحجار الطبيعية",
    hero_slide2_title: "عقيق أصلي وزمرد",
    hero_slide2_desc: "أضف النبل إلى أسلوبك مع الأحجار الطبيعية المختارة بعناية والزخارف المنحوتة يدوياً.",
    hero_slide2_btn: "تصفح الآن",
    banner_craft_title: "صناعة يدوية",
    banner_craft_desc: "تصاميم خاصة",
    banner_stone_title: "حجر طبيعي",
    banner_stone_desc: "عقيق وزمرد",
    banner_custom_title: "طلب خاص",
    banner_custom_desc: "حفر اسم مخصص",
    search_results: "نتائج البحث",
    search_results_for: 'تم العثور على {count} نتائج لـ "{query}".',
    search_no_results: "لم يتم العثور على منتجات تطابق معاييرك.",
    tab_new: "وصل حديثاً",
    tab_bestseller: "الأكثر مبيعاً",
    tab_collection: "مجموعة خاصة",
    btn_inspect: "عرض",
    btn_add_to_cart: "أضف إلى السلة",
    seo_title: "فيسل أوستام - خواتم بتصميم خاص",
    seo_desc: "مع سنوات من الخبرة في صياغة الفضة...",
    recent_products: "شوهدت مؤخرا",`
};

const languages = ['tr', 'en', 'es', 'de', 'ar'];

for (const lang of languages) {
    const searchString = lang + ': {';
    const langIndex = content.indexOf(searchString);
    if (langIndex === -1) {
        console.error("Could not find block for " + lang);
        continue;
    }
    
    const navWhatsAppIndex = content.indexOf('nav_whatsapp_support', langIndex);
    if (navWhatsAppIndex === -1) {
        console.error("Could not find nav_whatsapp_support in " + lang);
        continue;
    }
    
    const newlineIndex = content.indexOf('\\n', navWhatsAppIndex);
    
    content = content.slice(0, newlineIndex) + '\\n' + newKeys[lang] + content.slice(newlineIndex);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Translations updated successfully.');
