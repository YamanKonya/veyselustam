import { Language } from "./translations";

// Hand-written, complete translations for the shop's original catalogue.
// Each seed product maps to a title, a short story (what is engraved and what it
// means) and spec values; the description is assembled per language so every
// language reads as one clean text instead of a mix of Turkish and translations.

type L = Record<Language, string>;

type StoneKey =
  | "natural_gem"
  | "horasan_agate"
  | "yemen_agate"
  | "agate"
  | "red_agate"
  | "yellow_agate"
  | "onyx"
  | "black_onyx"
  | "jasper"
  | "hematite";

interface CatalogEntry {
  title: string; // key in TITLES
  story?: string; // key in STORIES
  stone?: StoneKey;
  weight?: string;
  sacred?: boolean; // carries a holy inscription → care note
  service?: boolean; // design service, not a physical piece
}

const STONES: Record<StoneKey, L> = {
  natural_gem: { tr: "Doğal değerli taş", en: "Natural gemstone", es: "Piedra preciosa natural", de: "Natürlicher Edelstein", ar: "حجر كريم طبيعي" },
  horasan_agate: { tr: "Doğal Horasan akiki", en: "Natural Khorasan agate", es: "Ágata natural de Jorasán", de: "Natürlicher Chorasan-Achat", ar: "عقيق خراساني طبيعي" },
  yemen_agate: { tr: "Doğal Yemen akiki", en: "Natural Yemeni agate", es: "Ágata natural de Yemen", de: "Natürlicher jemenitischer Achat", ar: "عقيق يمني طبيعي" },
  agate: { tr: "Doğal akik", en: "Natural agate", es: "Ágata natural", de: "Natürlicher Achat", ar: "عقيق طبيعي" },
  red_agate: { tr: "Doğal kızıl akik", en: "Natural red agate", es: "Ágata roja natural", de: "Natürlicher roter Achat", ar: "عقيق أحمر طبيعي" },
  yellow_agate: { tr: "Doğal sarı akik", en: "Natural yellow agate", es: "Ágata amarilla natural", de: "Natürlicher gelber Achat", ar: "عقيق أصفر طبيعي" },
  onyx: { tr: "Doğal oniks", en: "Natural onyx", es: "Ónix natural", de: "Natürlicher Onyx", ar: "أونيكس طبيعي" },
  black_onyx: { tr: "Doğal siyah oniks", en: "Natural black onyx", es: "Ónix negro natural", de: "Natürlicher schwarzer Onyx", ar: "أونيكس أسود طبيعي" },
  jasper: { tr: "Doğal jasper (casper)", en: "Natural jasper", es: "Jaspe natural", de: "Natürlicher Jaspis", ar: "يشب طبيعي" },
  hematite: { tr: "Doğal hematit", en: "Natural hematite", es: "Hematita natural", de: "Natürlicher Hämatit", ar: "هيماتيت طبيعي" },
};

const LABELS: Record<Language, {
  material: string; materialValue: string; stone: string; weight: string; weightValue: (w: string) => string;
  craft: string; craftValue: string; shipping: string; shippingValue: string; personalise: string; care: string;
  serviceNote: string;
}> = {
  tr: {
    material: "Malzeme", materialValue: "925 ayar gümüş",
    stone: "Taş", weight: "Ağırlık", weightValue: (w) => `yaklaşık ${w} g`,
    craft: "İşçilik", craftValue: "Tamamen el yapımı",
    shipping: "Gönderim", shippingValue: "1–3 iş gününde ücretsiz kargo; yurt dışına gönderim yapılır",
    personalise: "Taş ve yazı kişiye özel yapılabilir; detaylar için bizimle iletişime geçin.",
    care: "Üzerinde mübarek yazı bulunduğundan, tuvalet gibi yerlere girerken yüzüğü çıkarmanızı rica ederiz.",
    serviceNote: "Fiyat ve teslim süresi tasarıma göre belirlenir; sipariş öncesi bizimle iletişime geçin.",
  },
  en: {
    material: "Material", materialValue: "925 sterling silver",
    stone: "Stone", weight: "Weight", weightValue: (w) => `approx. ${w} g`,
    craft: "Craftsmanship", craftValue: "Entirely handmade",
    shipping: "Shipping", shippingValue: "Free shipping within 1–3 business days; we ship worldwide",
    personalise: "The stone and inscription can be personalised; contact us for details.",
    care: "As it bears a sacred inscription, we kindly ask that you remove the ring before entering the restroom.",
    serviceNote: "Price and delivery time depend on the design; please contact us before ordering.",
  },
  es: {
    material: "Material", materialValue: "Plata de ley 925",
    stone: "Piedra", weight: "Peso", weightValue: (w) => `aprox. ${w} g`,
    craft: "Elaboración", craftValue: "Totalmente hecho a mano",
    shipping: "Envío", shippingValue: "Envío gratuito en 1–3 días hábiles; enviamos a todo el mundo",
    personalise: "La piedra y la inscripción pueden personalizarse; contáctenos para más detalles.",
    care: "Al llevar una inscripción sagrada, le rogamos que se quite el anillo antes de entrar al baño.",
    serviceNote: "El precio y el plazo de entrega dependen del diseño; contáctenos antes de realizar el pedido.",
  },
  de: {
    material: "Material", materialValue: "925er Sterlingsilber",
    stone: "Stein", weight: "Gewicht", weightValue: (w) => `ca. ${w} g`,
    craft: "Verarbeitung", craftValue: "Vollständig von Hand gefertigt",
    shipping: "Versand", shippingValue: "Kostenloser Versand in 1–3 Werktagen; wir liefern weltweit",
    personalise: "Stein und Inschrift können individuell gestaltet werden; sprechen Sie uns gerne an.",
    care: "Da der Ring eine heilige Inschrift trägt, bitten wir Sie, ihn vor dem Betreten der Toilette abzulegen.",
    serviceNote: "Preis und Lieferzeit richten sich nach dem Entwurf; bitte kontaktieren Sie uns vor der Bestellung.",
  },
  ar: {
    material: "الخامة", materialValue: "فضة عيار 925",
    stone: "الحجر", weight: "الوزن", weightValue: (w) => `حوالي ${w} غرام`,
    craft: "الصنعة", craftValue: "مصنوع يدويًا بالكامل",
    shipping: "الشحن", shippingValue: "شحن مجاني خلال 1–3 أيام عمل، ونشحن إلى جميع أنحاء العالم",
    personalise: "يمكن تخصيص الحجر والنقش حسب الطلب؛ تواصل معنا لمزيد من التفاصيل.",
    care: "لأن الخاتم يحمل نقشًا مباركًا، نرجو خلعه قبل دخول دورة المياه.",
    serviceNote: "يُحدَّد السعر ومدة التسليم حسب التصميم؛ يرجى التواصل معنا قبل الطلب.",
  },
};

const TITLES: Record<string, L> = {
  zulfikar: {
    tr: "Zülfikâr Nakkaş İşlemeli El Yapımı Gümüş Erkek Yüzüğü",
    en: "Zulfiqar Hand-Engraved Sterling Silver Men's Ring",
    es: "Anillo de hombre Zulfiqar en plata 925 grabado a mano",
    de: "Zulfiqar-Herrenring aus 925er Silber, von Hand graviert",
    ar: "خاتم رجالي ذو الفقار من الفضة عيار 925 منقوش يدويًا",
  },
  horasan: {
    tr: "El Yapımı Horasan Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Handcrafted Khorasan Agate Sterling Silver Men's Ring",
    es: "Anillo de hombre en plata 925 con ágata de Jorasán, hecho a mano",
    de: "Handgefertigter Herrenring aus 925er Silber mit Chorasan-Achat",
    ar: "خاتم رجالي من الفضة عيار 925 بحجر العقيق الخراساني، صناعة يدوية",
  },
  ottoman_necklace: {
    tr: "El Oyması Akik Taşlı Osmanlı Gümüş Kolye",
    en: "Hand-Engraved Ottoman Silver Necklace with Agate",
    es: "Collar otomano de plata grabado a mano con ágata",
    de: "Osmanische Silberkette mit Achat, von Hand graviert",
    ar: "قلادة عثمانية من الفضة بحجر العقيق منقوشة يدويًا",
  },
  suleyman_necklace: {
    tr: "Hz. Süleyman Mührü Kazınmış Hematit Taşlı Kadın Kolye",
    en: "Seal of Solomon Engraved Hematite Women's Necklace",
    es: "Collar de mujer de hematita con el Sello de Salomón grabado",
    de: "Damenkette mit Hämatit und eingraviertem Siegel Salomons",
    ar: "قلادة نسائية بحجر الهيماتيت منقوش عليها خاتم سليمان",
  },
  salavat_necklace: {
    tr: "Salavat-ı Şerife Oymalı Akik Taşlı Kadın Kolye",
    en: "Salawat Engraved Agate Women's Necklace",
    es: "Collar de mujer de ágata con la salawat grabada",
    de: "Damenkette mit Achat und eingravierter Salawat",
    ar: "قلادة نسائية بحجر العقيق منقوش عليها الصلاة على النبي ﷺ",
  },
  subbuh: {
    tr: "“Subbûhun Kuddûsun” Kazınmış Oniks Taşlı Gümüş Erkek Yüzüğü",
    en: "“Subbuhun Quddusun” Engraved Onyx Silver Men's Ring",
    es: "Anillo de hombre en plata con ónix grabado «Subbuhun Quddusun»",
    de: "Herrenring aus Silber mit Onyx, graviert mit „Subbuhun Quddusun“",
    ar: "خاتم رجالي من الفضة بحجر الأونيكس منقوش عليه «سُبُّوحٌ قُدُّوسٌ»",
  },
  tevhid_agate: {
    tr: "Kelime-i Tevhid Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Shahada Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata y la Shahada grabada",
    de: "Herrenring aus Silber mit Achat und eingravierter Schahada",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه كلمة التوحيد",
  },
  tevhid_onyx: {
    tr: "Kelime-i Tevhid Kazınmış Oniks Taşlı Gümüş Erkek Yüzüğü",
    en: "Shahada Engraved Onyx Silver Men's Ring",
    es: "Anillo de hombre en plata con ónix y la Shahada grabada",
    de: "Herrenring aus Silber mit Onyx und eingravierter Schahada",
    ar: "خاتم رجالي من الفضة بحجر الأونيكس منقوش عليه كلمة التوحيد",
  },
  fatiha_agate: {
    tr: "Fatiha Suresi Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Surah Al-Fatiha Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata y la sura Al-Fatiha grabada",
    de: "Herrenring aus Silber mit Achat und eingravierter Sure Al-Fatiha",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه سورة الفاتحة",
  },
  hu_allah: {
    tr: "“Hû Allah” Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "“Hu Allah” Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata grabada «Hu Allah»",
    de: "Herrenring aus Silber mit Achat, graviert mit „Hu Allah“",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه «هو الله»",
  },
  custom_name: {
    tr: "Kişiye Özel İsim Hat Yazılı Akik Taşlı Gümüş Yüzük",
    en: "Personalised Name Calligraphy Agate Silver Ring",
    es: "Anillo de plata con ágata y nombre personalizado en caligrafía",
    de: "Silberring mit Achat und personalisierter Namenskalligrafie",
    ar: "خاتم فضة بحجر العقيق مع اسم مخصص بالخط العربي",
  },
  hasbiyallah: {
    tr: "“Hasbiyallâh” Kazınmış Sarı Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "“Hasbiyallah” Engraved Yellow Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata amarilla grabada «Hasbiyallah»",
    de: "Herrenring aus Silber mit gelbem Achat, graviert mit „Hasbiyallah“",
    ar: "خاتم رجالي من الفضة بحجر العقيق الأصفر منقوش عليه «حسبي الله»",
  },
  hic_agate: {
    tr: "Tasavvufi “Hiç” Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Sufi “Hiç” (Nothingness) Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata grabada «Hiç» (la nada sufí)",
    de: "Herrenring aus Silber mit Achat, graviert mit dem Sufi-Wort „Hiç“ (Nichts)",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه كلمة «هيچ» الصوفية",
  },
  hic_onyx: {
    tr: "Tasavvufi “Hiç” Kazınmış Oniks Taşlı Gümüş Erkek Yüzüğü",
    en: "Sufi “Hiç” (Nothingness) Engraved Onyx Silver Men's Ring",
    es: "Anillo de hombre en plata con ónix grabado «Hiç» (la nada sufí)",
    de: "Herrenring aus Silber mit Onyx, graviert mit dem Sufi-Wort „Hiç“ (Nichts)",
    ar: "خاتم رجالي من الفضة بحجر الأونيكس منقوش عليه كلمة «هيچ» الصوفية",
  },
  lagalibe_black_onyx: {
    tr: "“Lâ Gâlibe İllallah” Kazınmış Siyah Oniks Taşlı Gümüş Erkek Yüzüğü",
    en: "“La Ghaliba Illallah” Engraved Black Onyx Silver Men's Ring",
    es: "Anillo de hombre en plata con ónix negro grabado «La Ghaliba Illallah»",
    de: "Herrenring aus Silber mit schwarzem Onyx, graviert mit „La Ghaliba Illallah“",
    ar: "خاتم رجالي من الفضة بحجر الأونيكس الأسود منقوش عليه «لا غالب إلا الله»",
  },
  lagalibe_red_agate: {
    tr: "“Lâ Gâlibe İllallah” Kazınmış Kırmızı Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "“La Ghaliba Illallah” Engraved Red Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata roja grabada «La Ghaliba Illallah»",
    de: "Herrenring aus Silber mit rotem Achat, graviert mit „La Ghaliba Illallah“",
    ar: "خاتم رجالي من الفضة بحجر العقيق الأحمر منقوش عليه «لا غالب إلا الله»",
  },
  bismillah: {
    tr: "Besmele Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Bismillah Calligraphy Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata y la basmala en caligrafía",
    de: "Herrenring aus Silber mit Achat und Basmala-Kalligrafie",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه البسملة",
  },
  suleyman_tilsim: {
    tr: "Hz. Süleyman Mührü ve Ayetlerle Çevrili Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Seal of Solomon Agate Silver Men's Ring Encircled with Verses",
    es: "Anillo de hombre en plata con ágata, Sello de Salomón y aleyas grabadas",
    de: "Herrenring aus Silber mit Achat, Siegel Salomons und umlaufenden Versen",
    ar: "خاتم رجالي من الفضة بحجر العقيق عليه خاتم سليمان ومحاط بالآيات",
  },
  allah_agate: {
    tr: "Allah Lafzı Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "“Allah” Calligraphy Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata y el nombre «Allah» grabado",
    de: "Herrenring aus Silber mit Achat und eingraviertem Namen „Allah“",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه لفظ الجلالة",
  },
  allah_onyx: {
    tr: "Allah Lafzı Kazınmış Oniks Taşlı Gümüş Erkek Yüzüğü",
    en: "“Allah” Calligraphy Onyx Silver Men's Ring",
    es: "Anillo de hombre en plata con ónix y el nombre «Allah» grabado",
    de: "Herrenring aus Silber mit Onyx und eingraviertem Namen „Allah“",
    ar: "خاتم رجالي من الفضة بحجر الأونيكس منقوش عليه لفظ الجلالة",
  },
  salavat_ring: {
    tr: "Salavat-ı Şerife Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Salawat Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata y la salawat grabada",
    de: "Herrenring aus Silber mit Achat und eingravierter Salawat",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه الصلاة على النبي ﷺ",
  },
  tevbe129: {
    tr: "Tevbe Suresi 129. Ayet Kazınmış Kızıl Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Surah At-Tawbah 9:129 Engraved Red Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata roja y la aleya 9:129 (At-Tawba) grabada",
    de: "Herrenring aus Silber mit rotem Achat und eingraviertem Vers 9:129 (At-Tauba)",
    ar: "خاتم رجالي من الفضة بحجر العقيق الأحمر منقوش عليه الآية 129 من سورة التوبة",
  },
  kefa: {
    tr: "“Kefâ Bi'l-Mevti Vâizâ” Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "“Death Suffices as an Admonisher” Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata grabada «Basta la muerte como consejera»",
    de: "Herrenring aus Silber mit Achat, graviert mit „Der Tod genügt als Mahner“",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه «كفى بالموت واعظًا»",
  },
  fatih_seal: {
    tr: "Fatih Sultan Mehmed Han Mühürlü Jasper Taşlı Gümüş Erkek Yüzüğü",
    en: "Sultan Mehmed the Conqueror Seal Jasper Silver Men's Ring",
    es: "Anillo de hombre en plata con jaspe y el sello del sultán Mehmed II",
    de: "Herrenring aus Silber mit Jaspis und dem Siegel Sultan Mehmeds II.",
    ar: "خاتم رجالي من الفضة بحجر اليشب منقوش عليه ختم السلطان محمد الفاتح",
  },
  yasin58: {
    tr: "Yâsîn Suresi 58. Ayet Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Surah Ya-Sin 36:58 Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata y la aleya 36:58 (Ya-Sin) grabada",
    de: "Herrenring aus Silber mit Achat und eingraviertem Vers 36:58 (Ya-Sin)",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه الآية 58 من سورة يس",
  },
  el_mulku: {
    tr: "“El-Mülkü Lillâh” Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "“Al-Mulku Lillah” Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata grabada «Al-Mulku Lillah»",
    de: "Herrenring aus Silber mit Achat, graviert mit „Al-Mulku Lillah“",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه «الملك لله»",
  },
  musavvir: {
    tr: "“El-Musavvir” El Oyması Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "“Al-Musawwir” Hand-Carved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata tallada a mano «Al-Musawwir»",
    de: "Herrenring aus Silber mit handgeschnitztem Achat „Al-Musawwir“",
    ar: "خاتم رجالي من الفضة بحجر العقيق المنقوش يدويًا «المصوِّر»",
  },
  musavvir_horasan: {
    tr: "El Oyması “El-Musavvir” Horasan Akik Taşlı Gümüş Yüzük",
    en: "Hand-Carved “Al-Musawwir” Khorasan Agate Silver Ring",
    es: "Anillo de plata con ágata de Jorasán tallada a mano «Al-Musawwir»",
    de: "Silberring mit handgeschnitztem Chorasan-Achat „Al-Musawwir“",
    ar: "خاتم فضة بحجر العقيق الخراساني المنقوش يدويًا «المصوِّر»",
  },
  seref_sems: {
    tr: "Şerefü'ş-Şems El Oyması Sarı Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Sharaf al-Shams Hand-Carved Yellow Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata amarilla tallada a mano «Sharaf al-Shams»",
    de: "Herrenring aus Silber mit handgeschnitztem gelbem Achat „Sharaf al-Shams“",
    ar: "خاتم رجالي من الفضة بحجر العقيق الأصفر المنقوش يدويًا «شرف الشمس»",
  },
  ilahi: {
    tr: "“İlâhî Ente Maksûdî” Kazınmış Kırmızı Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "“Ilahi Anta Maqsudi” Engraved Red Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata roja grabada «Ilahi Anta Maqsudi»",
    de: "Herrenring aus Silber mit rotem Achat, graviert mit „Ilahi Anta Maqsudi“",
    ar: "خاتم رجالي من الفضة بحجر العقيق الأحمر منقوش عليه «إلهي أنت مقصودي»",
  },
  suleyman: {
    tr: "Hz. Süleyman Mührü Kazınmış Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Seal of Solomon Engraved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata y el Sello de Salomón grabado",
    de: "Herrenring aus Silber mit Achat und eingraviertem Siegel Salomons",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش عليه خاتم سليمان",
  },
  suleyman_gold: {
    tr: "Hz. Süleyman Mührü Kazınmış Altın Kaplamalı Akik Taşlı Gümüş Yüzük",
    en: "Seal of Solomon Agate Silver Ring with Gold Plating",
    es: "Anillo de plata con ágata, Sello de Salomón y baño de oro",
    de: "Silberring mit Achat, Siegel Salomons und Vergoldung",
    ar: "خاتم فضة بحجر العقيق منقوش عليه خاتم سليمان مع طلاء ذهبي",
  },
  ecirna: {
    tr: "“Allâhümme Ecirnâ Mine'n-Nâr” Kazınmış Gümüş Erkek Yüzüğü",
    en: "“Allahumma Ajirna Min an-Nar” Engraved Silver Men's Ring",
    es: "Anillo de hombre en plata grabado «Allahumma Ajirna min an-Nar»",
    de: "Herrenring aus Silber, graviert mit „Allahumma Ajirna min an-Nar“",
    ar: "خاتم رجالي من الفضة منقوش عليه «اللهم أجرنا من النار»",
  },
  hud: {
    tr: "Hûd Suresi El Oyması Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Surah Hud Hand-Carved Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata tallada a mano con la sura Hud",
    de: "Herrenring aus Silber mit handgeschnitztem Achat – Sure Hud",
    ar: "خاتم رجالي من الفضة بحجر العقيق منقوش يدويًا بآية من سورة هود",
  },
  ya_malik: {
    tr: "“Yâ Mâlike'l-Mülk” El Oyması Oniks Taşlı Gümüş Yüzük",
    en: "“Ya Malik al-Mulk” Hand-Carved Onyx Silver Ring",
    es: "Anillo de plata con ónix tallado a mano «Ya Malik al-Mulk»",
    de: "Silberring mit handgeschnitztem Onyx „Ya Malik al-Mulk“",
    ar: "خاتم فضة بحجر الأونيكس المنقوش يدويًا «يا مالك الملك»",
  },
  insirah: {
    tr: "İnşirâh Suresi 6. Ayet Kazınmış Sarı Akik Taşlı Gümüş Yüzük",
    en: "Surah Ash-Sharh 94:6 Engraved Yellow Agate Silver Ring",
    es: "Anillo de plata con ágata amarilla y la aleya 94:6 (Ash-Sharh) grabada",
    de: "Silberring mit gelbem Achat und eingraviertem Vers 94:6 (Asch-Scharh)",
    ar: "خاتم فضة بحجر العقيق الأصفر منقوش عليه الآية 6 من سورة الشرح",
  },
  design: {
    tr: "Kişiye Özel Çizim ve Tasarım",
    en: "Bespoke Drawing & Design",
    es: "Dibujo y diseño a medida",
    de: "Individuelle Zeichnung & Gestaltung",
    ar: "رسم وتصميم حسب الطلب",
  },
  sems: {
    tr: "Şems Suresi El Yapımı Yemen Akik Taşlı Gümüş Erkek Yüzüğü",
    en: "Surah Ash-Shams Handcrafted Yemeni Agate Silver Men's Ring",
    es: "Anillo de hombre en plata con ágata yemení y la sura Ash-Shams, hecho a mano",
    de: "Handgefertigter Herrenring aus Silber mit jemenitischem Achat – Sure Asch-Schams",
    ar: "خاتم رجالي من الفضة بحجر العقيق اليمني بآية من سورة الشمس، صناعة يدوية",
  },
  fatiha_silver: {
    tr: "Fatiha Suresi İşlemeli El Yapımı Gümüş Erkek Yüzüğü",
    en: "Surah Al-Fatiha Handcrafted Silver Men's Ring",
    es: "Anillo de hombre en plata con la sura Al-Fatiha, hecho a mano",
    de: "Handgefertigter Herrenring aus Silber mit der Sure Al-Fatiha",
    ar: "خاتم رجالي من الفضة منقوش عليه سورة الفاتحة، صناعة يدوية",
  },
  mumin44: {
    tr: "Mü'min Suresi 44. Ayet Yazılı Akik Taşlı Gümüş Yüzük",
    en: "Surah Ghafir 40:44 Engraved Agate Silver Ring",
    es: "Anillo de plata con ágata y la aleya 40:44 (Ghafir) grabada",
    de: "Silberring mit Achat und eingraviertem Vers 40:44 (Ghafir)",
    ar: "خاتم فضة بحجر العقيق منقوش عليه الآية 44 من سورة غافر",
  },
  kalem52: {
    tr: "Kalem Suresi Yazılı El Yapımı Hematit Taşlı Gümüş Yüzük",
    en: "Surah Al-Qalam Engraved Hematite Silver Ring",
    es: "Anillo de plata con hematita y la sura Al-Qalam grabada",
    de: "Silberring mit Hämatit und eingravierter Sure Al-Qalam",
    ar: "خاتم فضة بحجر الهيماتيت منقوش عليه آية من سورة القلم",
  },
  kufi_tevhid: {
    tr: "Kûfi Hat Kelime-i Tevhid Gümüş Yüzük",
    en: "Kufic Calligraphy Shahada Sterling Silver Ring",
    es: "Anillo de plata 925 con la Shahada en caligrafía cúfica",
    de: "Ring aus 925er Silber mit Schahada in kufischer Kalligrafie",
    ar: "خاتم فضة عيار 925 بكلمة التوحيد بالخط الكوفي",
  },
  ayetel_octagon: {
    tr: "Ayetel Kürsî Altın Yazılı Sekizgen Akik Yüzük – Kûfi Hat, Selçuklu Motifli",
    en: "Ayat al-Kursi Gold-Lettered Octagonal Agate Ring – Kufic & Seljuk Motifs",
    es: "Anillo octogonal de ágata con Ayat al-Kursi en oro – motivos cúficos y selyúcidas",
    de: "Achteckiger Achatring mit Ayat al-Kursi in Gold – kufische & seldschukische Motive",
    ar: "خاتم عقيق ثماني الشكل بآية الكرسي بأحرف ذهبية – زخارف كوفية وسلجوقية",
  },
  buda_gecer: {
    tr: "“Bu da Geçer Yâ Hû” Kızıl Akik Taşlı Gümüş Yüzük",
    en: "“This Too Shall Pass” Red Agate Silver Ring",
    es: "Anillo de plata con ágata roja «Esto también pasará»",
    de: "Silberring mit rotem Achat „Auch das geht vorüber“",
    ar: "خاتم فضة بحجر العقيق الأحمر «هذا أيضًا سيمضي»",
  },
  ayetel_nakkas: {
    tr: "Ayetel Kürsî Nakkaş Oymalı Akik Taşlı El Yapımı Gümüş Yüzük",
    en: "Ayat al-Kursi Hand-Carved Agate Silver Ring",
    es: "Anillo de plata con ágata tallada a mano con Ayat al-Kursi",
    de: "Silberring mit handgeschnitztem Achat – Ayat al-Kursi",
    ar: "خاتم فضة بحجر العقيق منقوش يدويًا بآية الكرسي",
  },
};

const STORIES: Record<string, L> = {
  zulfikar: {
    tr: "Zülfikâr motifi, nakkaş oyma tekniğiyle kasaya elde işlenmiştir. Güçlü duruşuyla günlük kullanıma da özel günlere de yakışan bir erkek yüzüğü.",
    en: "The Zulfiqar motif is engraved into the band by hand using the traditional nakkaş carving technique. A bold men's ring that suits both everyday wear and special occasions.",
    es: "El motivo Zulfiqar está grabado a mano en el aro con la técnica tradicional de talla nakkaş. Un anillo de hombre de carácter fuerte, ideal para el día a día y para ocasiones especiales.",
    de: "Das Zulfiqar-Motiv ist in traditioneller Nakkaş-Gravurtechnik von Hand in die Ringschiene geschnitten. Ein markanter Herrenring für den Alltag wie für besondere Anlässe.",
    ar: "نُقش زخرف ذو الفقار يدويًا على جسم الخاتم بتقنية النقّاش التقليدية. خاتم رجالي ذو حضور قوي يناسب الاستخدام اليومي والمناسبات الخاصة.",
  },
  horasan: {
    tr: "Doğal Horasan akikiyle elde işlenen, gösterişli ve güçlü duruşlu bir erkek yüzüğü. Bir erkeğe verilebilecek en anlamlı hediyelerden biri.",
    en: "An imposing men's ring, worked by hand around a natural Khorasan agate. One of the most meaningful gifts you can give a man.",
    es: "Un imponente anillo de hombre, trabajado a mano alrededor de un ágata natural de Jorasán. Uno de los regalos más especiales para un hombre.",
    de: "Ein eindrucksvoller Herrenring, von Hand rund um einen natürlichen Chorasan-Achat gefertigt. Eines der bedeutungsvollsten Geschenke für einen Mann.",
    ar: "خاتم رجالي فخم مصنوع يدويًا حول حجر عقيق خراساني طبيعي، ومن أثمن الهدايا التي يمكن تقديمها للرجل.",
  },
  ottoman_necklace: {
    tr: "Gümüş üzerine el oymasıyla işlenmiş, akik taşlı Osmanlı kolye. Vintage çizgisiyle her kombine karakter katar.",
    en: "An Ottoman necklace with an agate stone, its silver hand-engraved with traditional motifs. Its vintage character lifts any outfit.",
    es: "Collar otomano con piedra de ágata y plata grabada a mano con motivos tradicionales. Su estilo vintage aporta carácter a cualquier conjunto.",
    de: "Eine osmanische Kette mit Achat, das Silber von Hand mit traditionellen Motiven graviert. Ihr Vintage-Charakter verleiht jedem Outfit Ausdruck.",
    ar: "قلادة عثمانية بحجر العقيق، فضتها منقوشة يدويًا بزخارف تقليدية، وطابعها العتيق يضفي تميزًا على كل إطلالة.",
  },
  suleyman_necklace: {
    tr: "Hematit taşın üzerine Hz. Süleyman'ın mührü elde kazınmıştır. Zarif ve anlamlı bir kadın kolyesi.",
    en: "The Seal of Solomon is hand-engraved onto a hematite stone. An elegant, meaningful necklace for women.",
    es: "El Sello de Salomón está grabado a mano sobre una piedra de hematita. Un collar femenino elegante y lleno de significado.",
    de: "Das Siegel Salomons ist von Hand in einen Hämatit graviert. Eine elegante, bedeutungsvolle Damenkette.",
    ar: "نُقش خاتم سليمان عليه السلام يدويًا على حجر الهيماتيت؛ قلادة نسائية أنيقة وذات معنى.",
  },
  salavat_necklace: {
    tr: "Akik taşın üzerine Salavat-ı Şerife elde oyulmuştur. Zarif ve anlamlı bir kadın kolyesi.",
    en: "A salawat — the blessing upon the Prophet ﷺ — is hand-carved onto the agate. An elegant, meaningful necklace for women.",
    es: "Sobre el ágata está tallada a mano una salawat, la bendición sobre el Profeta ﷺ. Un collar femenino elegante y lleno de significado.",
    de: "In den Achat ist von Hand eine Salawat – der Segensgruß auf den Propheten ﷺ – geschnitten. Eine elegante, bedeutungsvolle Damenkette.",
    ar: "نُقشت الصلاة على النبي ﷺ يدويًا على حجر العقيق؛ قلادة نسائية أنيقة وذات معنى.",
  },
  subbuh: {
    tr: "Taşın üzerinde “Subbûhun Kuddûsun Rabbunâ ve Rabbü'l-melâiketi ve'r-rûh” yazılıdır: Hz. İbrâhim'in (a.s.) dilinden düşürmediği zikir.",
    en: "The stone bears the words “Subbuhun Quddusun, Rabbuna wa Rabbul-mala'ikati war-Ruh” — the remembrance that Prophet Ibrahim (peace be upon him) never ceased to repeat.",
    es: "La piedra lleva las palabras «Subbuhun Quddusun, Rabbuna wa Rabbul-mala'ikati war-Ruh», el dhikr que el profeta Ibrahim (la paz sea con él) repetía sin cesar.",
    de: "Der Stein trägt die Worte „Subbuhun Quddusun, Rabbuna wa Rabbul-mala'ikati war-Ruh“ – das Gedenken, das der Prophet Ibrahim (Friede sei mit ihm) unablässig sprach.",
    ar: "نُقش على الحجر: «سُبُّوحٌ قُدُّوسٌ ربُّنا وربُّ الملائكةِ والرُّوح»، الذكر الذي لم يكن يفارق لسان سيدنا إبراهيم عليه السلام.",
  },
  tevhid: {
    tr: "Taşın üzerine hat sanatıyla Kelime-i Tevhid kazınmıştır: “Lâ ilâhe illallah Muhammedün Resûlullah” — Allah'tan başka ilah yoktur, Muhammed Allah'ın elçisidir.",
    en: "The Shahada is engraved onto the stone in calligraphy: “La ilaha illallah, Muhammadun Rasulullah” — there is no god but Allah, and Muhammad is the Messenger of Allah.",
    es: "La Shahada está grabada en la piedra en caligrafía: «La ilaha illallah, Muhammadun Rasulullah», no hay más dios que Allah y Muhammad es el Mensajero de Allah.",
    de: "Die Schahada ist in Kalligrafie in den Stein graviert: „La ilaha illallah, Muhammadun Rasulullah“ – es gibt keinen Gott außer Allah, und Muhammad ist der Gesandte Allahs.",
    ar: "نُقشت كلمة التوحيد على الحجر بالخط العربي: «لا إله إلا الله محمد رسول الله».",
  },
  fatiha: {
    tr: "Akik taşın üzerine Fatiha Suresi elde kazınmıştır.",
    en: "Surah Al-Fatiha, the opening chapter of the Qur'an, is hand-engraved onto the agate.",
    es: "La sura Al-Fatiha, la que abre el Corán, está grabada a mano sobre el ágata.",
    de: "Die Sure Al-Fatiha, die Eröffnungssure des Korans, ist von Hand in den Achat graviert.",
    ar: "نُقشت سورة الفاتحة يدويًا على حجر العقيق.",
  },
  hu_allah: {
    tr: "Taşın ortasında “Hû Allah” yazılıdır; yüzüğün yanlarında sırasıyla “Lâ ilâhe illallah”, “Lâ gâlibe illallah” ve “El-kuvvetü lillâh” işlenmiştir.",
    en: "“Hu Allah” sits at the centre of the stone, while the sides of the ring carry “La ilaha illallah”, “La ghaliba illallah” and “Al-quwwatu lillah” in turn.",
    es: "«Hu Allah» ocupa el centro de la piedra, y los laterales del anillo llevan «La ilaha illallah», «La ghaliba illallah» y «Al-quwwatu lillah».",
    de: "„Hu Allah“ steht in der Mitte des Steins, die Seiten des Rings tragen nacheinander „La ilaha illallah“, „La ghaliba illallah“ und „Al-quwwatu lillah“.",
    ar: "يتوسط الحجرَ نقشُ «هو الله»، وعلى جانبي الخاتم على التوالي: «لا إله إلا الله»، «لا غالب إلا الله»، «القوة لله».",
  },
  custom_name: {
    tr: "Fotoğraftaki örnekte taşın üzerine hat sanatıyla “Moody” ismi yazılmıştır. Siparişinizden sonra bizimle iletişime geçip taşa yazılacak ismi bildirmeniz yeterli.",
    en: "In the example shown, the name “Moody” is written on the stone in calligraphy. After ordering, simply contact us with the name you would like engraved.",
    es: "En el ejemplo de la foto, el nombre «Moody» está escrito en la piedra en caligrafía. Tras su pedido, contáctenos e indíquenos el nombre que desea grabar.",
    de: "Im gezeigten Beispiel steht der Name „Moody“ in Kalligrafie auf dem Stein. Teilen Sie uns nach der Bestellung einfach den gewünschten Namen mit.",
    ar: "في المثال المعروض كُتب اسم «Moody» على الحجر بالخط العربي. بعد الطلب، تواصل معنا وأخبرنا بالاسم الذي تريد نقشه.",
  },
  hasbiyallah: {
    tr: "Taşa Tevbe Suresi'nin 129. ayeti işlenmiştir: “Hasbiyallâhü lâ ilâhe illâ hû, aleyhi tevekkeltü ve hüve rabbü'l-arşi'l-azîm” — Allah bana yeter; O'ndan başka ilah yoktur. Ben yalnızca O'na güvenip dayandım; O, yüce Arş'ın Rabbidir.",
    en: "The stone carries verse 129 of Surah At-Tawbah: “Hasbiyallahu la ilaha illa huwa, alayhi tawakkaltu wa huwa rabbul-arshil-azim” — Allah is sufficient for me; there is no god but Him. In Him I put my trust, and He is the Lord of the Mighty Throne.",
    es: "La piedra lleva la aleya 129 de la sura At-Tawba: «Hasbiyallahu la ilaha illa huwa, alayhi tawakkaltu wa huwa rabbul-arshil-azim», Allah me basta; no hay más dios que Él. En Él confío, y Él es el Señor del Trono Inmenso.",
    de: "Der Stein trägt Vers 129 der Sure At-Tauba: „Hasbiyallahu la ilaha illa huwa, alayhi tawakkaltu wa huwa rabbul-arshil-azim“ – Allah genügt mir; es gibt keinen Gott außer Ihm. Auf Ihn vertraue ich, und Er ist der Herr des gewaltigen Thrones.",
    ar: "نُقشت على الحجر الآية 129 من سورة التوبة: «حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ».",
  },
  hic: {
    tr: "Taşın üzerine tasavvufta nefsin hiçliğini ve tevazuyu anlatan “Hiç” yazısı kazınmıştır.",
    en: "The stone is engraved with “Hiç” — “nothing” — the Sufi expression of humility and the self's nothingness before the Divine.",
    es: "La piedra lleva grabada la palabra «Hiç», «nada», expresión sufí de la humildad y de la nada del ego ante lo Divino.",
    de: "In den Stein ist „Hiç“ – „nichts“ – graviert, der sufische Ausdruck der Demut und der Nichtigkeit des Selbst vor dem Göttlichen.",
    ar: "نُقشت على الحجر كلمة «هيچ» أي «لا شيء»، وهي تعبير صوفي عن التواضع وفناء النفس أمام الله.",
  },
  lagalibe: {
    tr: "Taşa “Lâ gâlibe illallah” işlenmiştir: Allah'tan başka galip yoktur.",
    en: "The stone is engraved with “La ghaliba illallah” — there is no victor but Allah.",
    es: "La piedra lleva grabado «La ghaliba illallah»: no hay más vencedor que Allah.",
    de: "In den Stein ist „La ghaliba illallah“ graviert – es gibt keinen Sieger außer Allah.",
    ar: "نُقش على الحجر: «لا غالب إلا الله».",
  },
  bismillah: {
    tr: "Akik taşın üzerine hat sanatıyla Besmele kazınmıştır: “Bismillâhirrahmânirrahîm” — Rahmân ve Rahîm olan Allah'ın adıyla.",
    en: "The Basmala is engraved onto the agate in calligraphy: “Bismillahir-Rahmanir-Rahim” — in the name of Allah, the Most Gracious, the Most Merciful.",
    es: "La basmala está grabada en el ágata en caligrafía: «Bismillahir-Rahmanir-Rahim», en el nombre de Allah, el Clemente, el Misericordioso.",
    de: "Die Basmala ist in Kalligrafie in den Achat graviert: „Bismillahir-Rahmanir-Rahim“ – im Namen Allahs, des Allerbarmers, des Barmherzigen.",
    ar: "نُقشت البسملة على حجر العقيق بالخط العربي: «بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ».",
  },
  suleyman_tilsim: {
    tr: "Akik taşın üzerine Hz. Süleyman'ın (a.s.) mührü kazınmış, mührün içine Besmele yazılmıştır. Yüzüğün tamamı ayetlerle çevrelenmiştir.",
    en: "The Seal of Solomon (peace be upon him) is engraved onto the agate with the Basmala inside it, and the whole ring is encircled with Qur'anic verses.",
    es: "El Sello de Salomón (la paz sea con él) está grabado en el ágata con la basmala en su interior, y todo el anillo está rodeado de aleyas coránicas.",
    de: "Das Siegel Salomons (Friede sei mit ihm) ist mit der Basmala im Inneren in den Achat graviert, und der ganze Ring ist von Koranversen umgeben.",
    ar: "نُقش خاتم سليمان عليه السلام على حجر العقيق وفي داخله البسملة، والخاتم كله محاط بآيات قرآنية.",
  },
  allah: {
    tr: "Taşın üzerine hat sanatıyla Allah lafzı kazınmıştır.",
    en: "The name of Allah is engraved onto the stone in calligraphy.",
    es: "El nombre de Allah está grabado en la piedra en caligrafía.",
    de: "Der Name Allahs ist in Kalligrafie in den Stein graviert.",
    ar: "نُقش لفظ الجلالة «الله» على الحجر بالخط العربي.",
  },
  salavat: {
    tr: "Akik taşın üzerine hat sanatıyla Salavat-ı Şerife kazınmıştır.",
    en: "A salawat — the blessing upon the Prophet ﷺ — is engraved onto the agate in calligraphy.",
    es: "Una salawat, la bendición sobre el Profeta ﷺ, está grabada en el ágata en caligrafía.",
    de: "Eine Salawat – der Segensgruß auf den Propheten ﷺ – ist in Kalligrafie in den Achat graviert.",
    ar: "نُقشت الصلاة على النبي ﷺ على حجر العقيق بالخط العربي.",
  },
  kefa: {
    tr: "Taşın üzerine Arapça hatla “Kefâ bi'l-mevti vâizâ” (كَفَى بِالْمَوْتِ وَاعِظًا) yazılmıştır: Öğüt verici olarak ölüm yeter.",
    en: "The stone bears, in Arabic calligraphy, “Kafa bil-mawti wa'iza” (كَفَى بِالْمَوْتِ وَاعِظًا) — death suffices as an admonisher.",
    es: "La piedra lleva en caligrafía árabe «Kafa bil-mawti wa'iza» (كَفَى بِالْمَوْتِ وَاعِظًا): basta la muerte como consejera.",
    de: "Der Stein trägt in arabischer Kalligrafie „Kafa bil-mawti wa'iza“ (كَفَى بِالْمَوْتِ وَاعِظًا) – der Tod genügt als Mahner.",
    ar: "نُقش على الحجر بالخط العربي: «كَفَى بِالْمَوْتِ وَاعِظًا».",
  },
  fatih_seal: {
    tr: "Jasper taşın üzerine Fatih Sultan Mehmed Han'ın mührü işlenmiştir.",
    en: "The seal of Sultan Mehmed II, the Conqueror of Constantinople, is engraved onto the jasper.",
    es: "El sello del sultán Mehmed II, el Conquistador de Constantinopla, está grabado en el jaspe.",
    de: "Das Siegel Sultan Mehmeds II., des Eroberers Konstantinopels, ist in den Jaspis graviert.",
    ar: "نُقش ختم السلطان محمد الفاتح على حجر اليشب.",
  },
  yasin58: {
    tr: "Akik taşın üzerine hat sanatıyla Yâsîn Suresi'nin 58. ayeti kazınmıştır: “Selâmün kavlen min rabbin rahîm” — Çok merhametli bir Rab'den, söz olarak selam.",
    en: "Verse 58 of Surah Ya-Sin is engraved onto the agate in calligraphy: “Salamun qawlan min rabbin rahim” — “Peace,” a word from a Merciful Lord.",
    es: "La aleya 58 de la sura Ya-Sin está grabada en el ágata en caligrafía: «Salamun qawlan min rabbin rahim», «Paz», palabra de un Señor Misericordioso.",
    de: "Vers 58 der Sure Ya-Sin ist in Kalligrafie in den Achat graviert: „Salamun qawlan min rabbin rahim“ – „Friede!“, als Wort von einem barmherzigen Herrn.",
    ar: "نُقشت الآية 58 من سورة يس على حجر العقيق بالخط العربي: «سَلَامٌ قَوْلًا مِّن رَّبٍّ رَّحِيمٍ».",
  },
  el_mulku: {
    tr: "Akik taşın üzerine hat sanatıyla “El-Mülkü lillâh” kazınmıştır: Mülk Allah'ındır.",
    en: "“Al-Mulku lillah” is engraved onto the agate in calligraphy — all dominion belongs to Allah.",
    es: "«Al-Mulku lillah» está grabado en el ágata en caligrafía: todo dominio pertenece a Allah.",
    de: "„Al-Mulku lillah“ ist in Kalligrafie in den Achat graviert – alle Herrschaft gehört Allah.",
    ar: "نُقش على حجر العقيق بالخط العربي: «المُلكُ لله».",
  },
  musavvir: {
    tr: "Akik taşın üzerine Allah'ın güzel isimlerinden “El-Musavvir” (her şeye şekil veren) Arapça hatla elde oyulmuştur.",
    en: "“Al-Musawwir” — the Fashioner, one of the beautiful names of Allah — is hand-carved onto the agate in Arabic calligraphy.",
    es: "«Al-Musawwir», el Formador, uno de los bellos nombres de Allah, está tallado a mano en el ágata en caligrafía árabe.",
    de: "„Al-Musawwir“ – der Gestalter, einer der schönen Namen Allahs – ist von Hand in arabischer Kalligrafie in den Achat geschnitten.",
    ar: "نُقش اسم «المصوِّر» من أسماء الله الحسنى يدويًا على حجر العقيق بالخط العربي.",
  },
  musavvir_signed: {
    tr: "Veysel Usta imzalı bu koleksiyon yüzüğünde, Allah'ın isimlerinden “El-Musavvir” taşın üzerine elde oyulmuştur. Kasası geleneksel el kalemi oymasıyla işlenmiştir; farklı oymalar kişiye özel yapılabilir.",
    en: "In this collection ring signed by Master Veysel, “Al-Musawwir”, one of the names of Allah, is hand-carved onto the stone. The band is worked with traditional hand-chased engraving, and other inscriptions can be made to order.",
    es: "En este anillo de colección firmado por el maestro Veysel, «Al-Musawwir», uno de los nombres de Allah, está tallado a mano en la piedra. El aro está trabajado con cincelado tradicional a mano, y se pueden realizar otras inscripciones por encargo.",
    de: "Bei diesem von Meister Veysel signierten Sammlerring ist „Al-Musawwir“, einer der Namen Allahs, von Hand in den Stein geschnitten. Die Ringschiene ist in traditioneller Handziselierung gearbeitet; andere Inschriften fertigen wir auf Wunsch.",
    ar: "في هذا الخاتم من مجموعة Veysel Usta الموقّعة، نُقش اسم «المصوِّر» من أسماء الله يدويًا على الحجر، وزُيّن جسم الخاتم بالنقش اليدوي التقليدي، ويمكن تنفيذ نقوش أخرى حسب الطلب.",
  },
  seref_sems: {
    tr: "Sarı akik taşın üzerine el oymasıyla Şerefü'ş-Şems kazınmıştır; geleneksel olarak manevi değeri yüksek kabul edilir.",
    en: "Sharaf al-Shams is hand-carved onto the yellow agate, a design traditionally held in high spiritual regard.",
    es: "Sharaf al-Shams está tallado a mano en el ágata amarilla, un diseño al que tradicionalmente se atribuye un gran valor espiritual.",
    de: "Sharaf al-Shams ist von Hand in den gelben Achat geschnitten – ein Motiv, dem traditionell hoher spiritueller Wert beigemessen wird.",
    ar: "نُقش «شرف الشمس» يدويًا على حجر العقيق الأصفر، وهو نقش يُعدّ تقليديًا ذا قيمة روحية عالية.",
  },
  ilahi: {
    tr: "Kırmızı akik taşın üzerine “İlâhî ente maksûdî ve rızâke matlûbî” kazınmıştır: Allah'ım, maksadım Sensin; istediğim Senin rızan.",
    en: "The red agate is engraved with “Ilahi anta maqsudi wa ridaka matlubi” — my Lord, You are my aim, and Your pleasure is what I seek.",
    es: "El ágata roja lleva grabado «Ilahi anta maqsudi wa ridaka matlubi»: Dios mío, Tú eres mi meta y Tu complacencia es lo que busco.",
    de: "In den roten Achat ist „Ilahi anta maqsudi wa ridaka matlubi“ graviert – mein Gott, Du bist mein Ziel, und Dein Wohlgefallen ist, was ich suche.",
    ar: "نُقش على حجر العقيق الأحمر: «إلهي أنت مقصودي ورضاك مطلوبي».",
  },
  suleyman: {
    tr: "Akik taşın üzerine Hz. Süleyman'ın (a.s.) mührü kazınmış, mührün içine Besmele yazılmıştır.",
    en: "The Seal of Solomon (peace be upon him) is engraved onto the agate, with the Basmala written inside it.",
    es: "El Sello de Salomón (la paz sea con él) está grabado en el ágata, con la basmala escrita en su interior.",
    de: "Das Siegel Salomons (Friede sei mit ihm) ist in den Achat graviert, im Inneren steht die Basmala.",
    ar: "نُقش خاتم سليمان عليه السلام على حجر العقيق وفي داخله البسملة.",
  },
  suleyman_gold: {
    tr: "Akik taşın üzerine Hz. Süleyman'ın (a.s.) mührü kazınmış, mührün içine Besmele yazılmıştır. 925 ayar gümüş kasası sarı altın kaplamadır.",
    en: "The Seal of Solomon (peace be upon him) is engraved onto the agate with the Basmala inside it. The 925 silver band is finished with yellow-gold plating.",
    es: "El Sello de Salomón (la paz sea con él) está grabado en el ágata con la basmala en su interior. El aro de plata 925 tiene un baño de oro amarillo.",
    de: "Das Siegel Salomons (Friede sei mit ihm) ist mit der Basmala im Inneren in den Achat graviert. Die Ringschiene aus 925er Silber ist gelbvergoldet.",
    ar: "نُقش خاتم سليمان عليه السلام على حجر العقيق وفي داخله البسملة، وجسم الخاتم من الفضة عيار 925 مطلي بالذهب الأصفر.",
  },
  ecirna: {
    tr: "Gümüşün üzerine “Allâhümme ecirnâ mine'n-nâr” (Allah'ım, bizi ateşten koru) kazınmış; yuvası ve alt kısımları ayetlerle işlenmiştir. Eşsiz bir erkek yüzüğü.",
    en: "“Allahumma ajirna min an-nar” — O Allah, protect us from the Fire — is engraved into the silver, and the setting and underside are worked with Qur'anic verses. A truly unique men's ring.",
    es: "En la plata está grabado «Allahumma ajirna min an-nar», oh Allah, protégenos del Fuego, y el engaste y la parte inferior están trabajados con aleyas coránicas. Un anillo de hombre único.",
    de: "In das Silber ist „Allahumma ajirna min an-nar“ – o Allah, bewahre uns vor dem Feuer – graviert; Fassung und Unterseite sind mit Koranversen gearbeitet. Ein einzigartiger Herrenring.",
    ar: "نُقش على الفضة: «اللهم أجرنا من النار»، وزُيّنت القاعدة والأجزاء السفلية بآيات قرآنية؛ خاتم رجالي فريد من نوعه.",
  },
  hud: {
    tr: "Akik taşın üzerine el oymasıyla Hûd Suresi'nden “Emrolunduğun gibi dosdoğru ol” ayeti kazınmıştır. Peygamber Efendimizin (s.a.v.) “Beni Hûd Suresi ihtiyarlattı” buyurduğu suredir.",
    en: "The verse from Surah Hud, “So remain steadfast as you have been commanded,” is hand-carved onto the agate. It is the surah of which the Prophet ﷺ said, “Hud has made my hair grey.”",
    es: "La aleya de la sura Hud «Mantente firme tal como se te ha ordenado» está tallada a mano en el ágata. Es la sura de la que el Profeta ﷺ dijo: «Hud me ha encanecido».",
    de: "Der Vers aus Sure Hud „So bleib standhaft, wie dir befohlen wurde“ ist von Hand in den Achat geschnitten. Über diese Sure sagte der Prophet ﷺ: „Hud hat mich ergrauen lassen.“",
    ar: "نُقشت يدويًا على حجر العقيق آية من سورة هود: «فَاسْتَقِمْ كَمَا أُمِرْتَ»، وهي السورة التي قال فيها النبي ﷺ: «شيّبتني هود».",
  },
  ya_malik: {
    tr: "Oniks taşın üzerine el oymasıyla “Yâ Mâlike'l-mülk” kazınmıştır: Ey bütün kâinatın tek sahibi ve hükümdarı olan Allah.",
    en: "“Ya Malik al-Mulk” is hand-carved onto the onyx — O Allah, sole Owner and Sovereign of all creation.",
    es: "«Ya Malik al-Mulk» está tallado a mano en el ónix: oh Allah, único Dueño y Soberano de toda la creación.",
    de: "„Ya Malik al-Mulk“ ist von Hand in den Onyx geschnitten – o Allah, alleiniger Besitzer und Herrscher der ganzen Schöpfung.",
    ar: "نُقش يدويًا على حجر الأونيكس: «يا مالك الملك».",
  },
  insirah: {
    tr: "Sarı akik üzerine İnşirâh Suresi'nin 6. ayeti işlenmiştir: “İnne mea'l-usri yüsrâ” (إِنَّ مَعَ الْعُسْرِ يُسْرًا) — Muhakkak zorlukla beraber bir kolaylık vardır. Özel sipariş olarak üretilmiştir; yazısı sarı altın kaplamadır.",
    en: "Verse 6 of Surah Ash-Sharh is worked onto the yellow agate: “Inna ma'al-usri yusra” (إِنَّ مَعَ الْعُسْرِ يُسْرًا) — indeed, with hardship comes ease. Made as a special order, with the lettering in yellow-gold plating.",
    es: "La aleya 6 de la sura Ash-Sharh está trabajada en el ágata amarilla: «Inna ma'al-usri yusra» (إِنَّ مَعَ الْعُسْرِ يُسْرًا), ciertamente, con la dificultad llega la facilidad. Elaborado por encargo, con las letras bañadas en oro amarillo.",
    de: "Vers 6 der Sure Asch-Scharh ist in den gelben Achat gearbeitet: „Inna ma'al-usri yusra“ (إِنَّ مَعَ الْعُسْرِ يُسْرًا) – wahrlich, mit der Erschwernis kommt die Erleichterung. Als Sonderanfertigung entstanden, die Schrift gelbvergoldet.",
    ar: "نُقشت على العقيق الأصفر الآية 6 من سورة الشرح: «إِنَّ مَعَ الْعُسْرِ يُسْرًا». صُنع حسب الطلب، والكتابة مطلية بالذهب الأصفر.",
  },
  design: {
    tr: "Hayalinizdeki yüzüğü birlikte tasarlayalım: önce fikrinizi dinliyor, çizimini hazırlıyoruz; onayınızın ardından yüzüğünüzü tamamen elde üretiyoruz.",
    en: "Let's design the ring you have in mind together: we listen to your idea, prepare a drawing, and once you approve it we make your ring entirely by hand.",
    es: "Diseñemos juntos el anillo que imagina: escuchamos su idea, preparamos un dibujo y, una vez aprobado, elaboramos su anillo totalmente a mano.",
    de: "Gestalten wir gemeinsam den Ring, den Sie sich vorstellen: Wir hören uns Ihre Idee an, fertigen eine Zeichnung an und arbeiten Ihren Ring nach Ihrer Freigabe vollständig von Hand.",
    ar: "لنصمّم معًا الخاتم الذي تحلم به: نستمع إلى فكرتك ونُعدّ رسمًا له، وبعد موافقتك نصنع خاتمك يدويًا بالكامل.",
  },
  sems: {
    tr: "Veysel Usta imzalı bu koleksiyon yüzüğü, Bursa Ulu Camii'ndeki Şems Suresi hattından esinlenerek hazırlanmıştır. Taşın üzerinde “Güneşe ve onun aydınlığına andolsun” ayeti zarif bir hatla yer alır; kasası geleneksel el kalemi oymasıyla işlenmiştir.",
    en: "This collection ring, signed by Master Veysel, is inspired by the Surah Ash-Shams calligraphy in Bursa's Grand Mosque. The verse “By the sun and its brightness” graces the stone in elegant script, and the band is worked with traditional hand-chased engraving.",
    es: "Este anillo de colección, firmado por el maestro Veysel, se inspira en la caligrafía de la sura Ash-Shams de la Gran Mezquita de Bursa. La aleya «Por el sol y su resplandor» adorna la piedra en una elegante caligrafía, y el aro está trabajado con cincelado tradicional a mano.",
    de: "Dieser von Meister Veysel signierte Sammlerring ist von der Kalligrafie der Sure Asch-Schams in der Großen Moschee von Bursa inspiriert. Der Vers „Bei der Sonne und ihrem Glanz“ ziert den Stein in eleganter Schrift; die Ringschiene ist in traditioneller Handziselierung gearbeitet.",
    ar: "خاتم من مجموعة Veysel Usta الموقّعة، مستوحى من لوحة سورة الشمس في الجامع الكبير ببورصة. تزيّن الحجرَ آيةُ «وَالشَّمْسِ وَضُحَاهَا» بخط أنيق، وجسم الخاتم منقوش بالنقش اليدوي التقليدي.",
  },
  fatiha_silver: {
    tr: "Usta imzalı bir koleksiyon parçası: Fatiha Suresi gümüşün üzerine zarif sülüs hatla işlenmiştir.",
    en: "A master-signed collection piece: Surah Al-Fatiha is worked into the silver in elegant thuluth calligraphy.",
    es: "Una pieza de colección firmada por el maestro: la sura Al-Fatiha está trabajada en la plata en elegante caligrafía thuluth.",
    de: "Ein vom Meister signiertes Sammlerstück: Die Sure Al-Fatiha ist in eleganter Thuluth-Kalligrafie in das Silber gearbeitet.",
    ar: "قطعة من مجموعة موقّعة من المعلّم: نُقشت سورة الفاتحة على الفضة بخط الثلث الأنيق.",
  },
  mumin44: {
    tr: "Veysel Usta imzalı bu koleksiyon yüzüğünde taşın üzerine Mü'min Suresi'nin 44. ayeti yazılmıştır: “Ve ufevvidu emrî ilallâh” (وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ) — İşimi tamamen Allah'a bırakıyorum. Taşı tamamen elde işlenmiş, kasası geleneksel el kalemi oymasıyla hazırlanmıştır.",
    en: "This collection ring, signed by Master Veysel, bears verse 44 of Surah Ghafir (Al-Mu'min): “Wa ufawwidu amri ilallah” (وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ) — and I entrust my affair to Allah. The stone is engraved entirely by hand and the band is worked with traditional hand-chased engraving.",
    es: "Este anillo de colección, firmado por el maestro Veysel, lleva la aleya 44 de la sura Ghafir (Al-Mu'min): «Wa ufawwidu amri ilallah» (وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ), y encomiendo mi asunto a Allah. La piedra está grabada totalmente a mano y el aro trabajado con cincelado tradicional.",
    de: "Dieser von Meister Veysel signierte Sammlerring trägt Vers 44 der Sure Ghafir (Al-Mu'min): „Wa ufawwidu amri ilallah“ (وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ) – und ich überlasse meine Angelegenheit Allah. Der Stein ist vollständig von Hand graviert, die Ringschiene traditionell handziseliert.",
    ar: "خاتم من مجموعة Veysel Usta الموقّعة، نُقشت على حجره الآية 44 من سورة غافر: «وَأُفَوِّضُ أَمْرِي إِلَى اللَّهِ ۚ إِنَّ اللَّهَ بَصِيرٌ بِالْعِبَادِ». الحجر منقوش يدويًا بالكامل، وجسم الخاتم بالنقش اليدوي التقليدي.",
  },
  kalem52: {
    tr: "Veysel Usta imzalı bu koleksiyon yüzüğünde taşın üzerine Kalem Suresi'nin 52. ayeti yazılmıştır: “Ve mâ hüve illâ zikrun li'l-âlemîn” (وَمَا هُوَ إِلَّا ذِكْرٌ لِلْعَالَمِينَ) — O, âlemler için ancak bir öğüttür. Nazara karşı okunan ayetlerden olduğu için özellikle seçilmiştir.",
    en: "This collection ring, signed by Master Veysel, bears verse 52 of Surah Al-Qalam: “Wa ma huwa illa dhikrun lil-'alamin” (وَمَا هُوَ إِلَّا ذِكْرٌ لِلْعَالَمِينَ) — and it is nothing but a reminder to the worlds. It was chosen because it is traditionally recited for protection from the evil eye.",
    es: "Este anillo de colección, firmado por el maestro Veysel, lleva la aleya 52 de la sura Al-Qalam: «Wa ma huwa illa dhikrun lil-'alamin» (وَمَا هُوَ إِلَّا ذِكْرٌ لِلْعَالَمِينَ), y no es sino un recordatorio para los mundos. Se eligió porque tradicionalmente se recita como protección contra el mal de ojo.",
    de: "Dieser von Meister Veysel signierte Sammlerring trägt Vers 52 der Sure Al-Qalam: „Wa ma huwa illa dhikrun lil-'alamin“ (وَمَا هُوَ إِلَّا ذِكْرٌ لِلْعَالَمِينَ) – und er ist nichts als eine Ermahnung für die Welten. Er wurde gewählt, weil er traditionell zum Schutz vor dem bösen Blick rezitiert wird.",
    ar: "خاتم من مجموعة Veysel Usta الموقّعة، نُقشت على حجره الآية 52 من سورة القلم: «وَمَا هُوَ إِلَّا ذِكْرٌ لِّلْعَالَمِينَ»، وقد اختيرت لأنها تُقرأ تقليديًا للتحصين من العين.",
  },
  kufi_tevhid: {
    tr: "Üst yüzeyinde kûfi hatla Kelime-i Tevhid, alt kısmında ise yuvarlak içinde sülüs hatla “Muhammedün Resûlullah” yazılıdır. El işçiliğiyle üretildiği için her yüzük benzersizdir; kadın ve erkek kullanımına uygundur.",
    en: "The Shahada runs across the top in Kufic calligraphy, while “Muhammadun Rasulullah” sits in a roundel below in thuluth script. Being handmade, every ring is one of a kind; suitable for men and women.",
    es: "La Shahada recorre la parte superior en caligrafía cúfica, y «Muhammadun Rasulullah» aparece debajo en un medallón en escritura thuluth. Al ser hecho a mano, cada anillo es único; apto para hombre y mujer.",
    de: "Die Schahada zieht sich in kufischer Kalligrafie über die Oberseite, darunter steht in einem Medaillon „Muhammadun Rasulullah“ in Thuluth-Schrift. Da handgefertigt, ist jeder Ring ein Unikat; für Damen und Herren geeignet.",
    ar: "تعلو الخاتمَ كلمةُ التوحيد بالخط الكوفي، وفي أسفله داخل دائرة «محمد رسول الله» بخط الثلث. ولأنه مصنوع يدويًا فكل خاتم فريد، ويناسب الرجال والنساء.",
  },
  ayetel_octagon: {
    tr: "Veysel Usta'nın tamamen el işçiliğiyle ürettiği özel bir tasarım. Sekizgen kasanın üzerindeki akik taşa Ayetel Kürsî büyük bir özenle işlenmiş, yazı kısmı parlak ve dayanıklı olması için altın kaplamayla tamamlanmıştır. Kasa, kûfi hat ve Selçuklu motifleriyle süslenmiştir.",
    en: "A special design made entirely by hand by Master Veysel. Ayat al-Kursi is worked with great care onto the agate set in an octagonal band, and the lettering is finished in gold plating for a bright, lasting look. The band is adorned with Kufic calligraphy and Seljuk motifs.",
    es: "Un diseño especial realizado íntegramente a mano por el maestro Veysel. Ayat al-Kursi está trabajada con gran cuidado sobre el ágata engastada en un aro octogonal, y las letras están bañadas en oro para un acabado brillante y duradero. El aro está adornado con caligrafía cúfica y motivos selyúcidas.",
    de: "Ein besonderer Entwurf, vollständig von Meister Veysel handgefertigt. Ayat al-Kursi ist mit großer Sorgfalt in den Achat auf der achteckigen Ringschiene gearbeitet; die Schrift ist für einen strahlenden, dauerhaften Glanz vergoldet. Die Schiene ziert kufische Kalligrafie mit seldschukischen Motiven.",
    ar: "تصميم خاص صنعه Veysel Usta يدويًا بالكامل. نُقشت آية الكرسي بعناية فائقة على حجر العقيق المثبّت في جسم ثماني الشكل، وطُليت الكتابة بالذهب لتبقى لامعة ومتينة، وزُيّن الجسم بالخط الكوفي والزخارف السلجوقية.",
  },
  ayetel_nakkas: {
    tr: "Tamamen el emeğiyle hazırlanmış özel bir çalışma. Sekizgen kasanın üzerindeki akik taşa nakkaş oymasıyla Ayetel Kürsî işlenmiş, yazı kısmı altın kaplamayla tamamlanarak hem manevi hem estetik bir derinlik kazanmıştır.",
    en: "A special piece made entirely by hand. Ayat al-Kursi is carved onto the agate of the octagonal band using the nakkaş technique, and the gold-plated lettering gives it both spiritual and aesthetic depth.",
    es: "Una pieza especial hecha íntegramente a mano. Ayat al-Kursi está tallada con la técnica nakkaş en el ágata del aro octogonal, y las letras bañadas en oro le dan profundidad espiritual y estética.",
    de: "Ein besonderes, vollständig handgefertigtes Stück. Ayat al-Kursi ist in Nakkaş-Technik in den Achat der achteckigen Ringschiene geschnitten; die vergoldete Schrift verleiht ihm spirituelle wie ästhetische Tiefe.",
    ar: "قطعة خاصة مصنوعة يدويًا بالكامل. نُقشت آية الكرسي بتقنية النقّاش على حجر العقيق في الجسم الثماني، والكتابة المطلية بالذهب تمنحه عمقًا روحيًا وجماليًا.",
  },
  buda_gecer: {
    tr: "Kızıl akik taşın üzerine el yazması Osmanlıca “Bu da geçer yâ Hû” oyulmuştur. Kasası kalem işi (gravür) tekniğiyle tamamen elde yapılmıştır; geleneksel işçilikle modern kullanımı buluşturan tek üretim bir modeldir.",
    en: "“Bu da geçer yâ Hû” — “this too shall pass” — is carved onto the red agate in handwritten Ottoman script. The band is made entirely by hand using hand-chased engraving; a one-of-a-kind piece that brings traditional craft to modern wear.",
    es: "«Bu da geçer yâ Hû», «esto también pasará», está tallado en el ágata roja en escritura otomana manuscrita. El aro está hecho íntegramente a mano con cincelado; una pieza única que une la artesanía tradicional con el uso moderno.",
    de: "„Bu da geçer yâ Hû“ – „auch das geht vorüber“ – ist in handgeschriebener osmanischer Schrift in den roten Achat geschnitten. Die Ringschiene ist vollständig von Hand ziseliert; ein Einzelstück, das traditionelles Handwerk mit modernem Tragen verbindet.",
    ar: "نُقشت عبارة «Bu da geçer yâ Hû» أي «هذا أيضًا سيمضي» بالخط العثماني اليدوي على حجر العقيق الأحمر. جسم الخاتم مصنوع يدويًا بالكامل بتقنية النقش بالقلم؛ قطعة فريدة تجمع الصنعة التقليدية بالاستخدام العصري.",
  },
};

// Seed product id → content
const ENTRIES: Record<string, CatalogEntry> = {
  "vu-custom-1792061468584": { title: "zulfikar", story: "zulfikar", stone: "natural_gem", weight: "16–18" },
  "vu-prod-1": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-2": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "25" },
  "vu-prod-3": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-4": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-5": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-6": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-7": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-8": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-9": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-10": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-11": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-12": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-13": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-14": { title: "horasan", story: "horasan", stone: "horasan_agate", weight: "17" },
  "vu-prod-15": { title: "ottoman_necklace", story: "ottoman_necklace", stone: "horasan_agate", weight: "20" },
  "vu-prod-16": { title: "suleyman_necklace", story: "suleyman_necklace", stone: "hematite", weight: "20", sacred: true },
  "vu-prod-17": { title: "salavat_necklace", story: "salavat_necklace", stone: "horasan_agate", weight: "20", sacred: true },
  "vu-prod-18": { title: "subbuh", story: "subbuh", stone: "onyx", weight: "25", sacred: true },
  "vu-prod-19": { title: "tevhid_agate", story: "tevhid", stone: "agate", weight: "25", sacred: true },
  "vu-prod-20": { title: "fatiha_agate", story: "fatiha", stone: "agate", weight: "25", sacred: true },
  "vu-prod-21": { title: "hu_allah", story: "hu_allah", stone: "agate", weight: "25", sacred: true },
  "vu-prod-22": { title: "custom_name", story: "custom_name", stone: "agate", weight: "25" },
  "vu-prod-23": { title: "hasbiyallah", story: "hasbiyallah", stone: "yellow_agate", weight: "25", sacred: true },
  "vu-prod-24": { title: "hic_agate", story: "hic", stone: "agate", weight: "16" },
  "vu-prod-25": { title: "lagalibe_black_onyx", story: "lagalibe", stone: "black_onyx", weight: "25", sacred: true },
  "vu-prod-26": { title: "bismillah", story: "bismillah", stone: "agate", weight: "20", sacred: true },
  "vu-prod-27": { title: "suleyman_tilsim", story: "suleyman_tilsim", stone: "agate", weight: "25", sacred: true },
  "vu-prod-28": { title: "bismillah", story: "bismillah", stone: "agate", weight: "20", sacred: true },
  "vu-prod-29": { title: "allah_agate", story: "allah", stone: "agate", weight: "25", sacred: true },
  "vu-prod-30": { title: "hic_onyx", story: "hic", stone: "onyx", weight: "16" },
  "vu-prod-31": { title: "salavat_ring", story: "salavat", stone: "agate", weight: "23", sacred: true },
  "vu-prod-32": { title: "tevbe129", story: "hasbiyallah", stone: "red_agate", weight: "25", sacred: true },
  "vu-prod-33": { title: "kefa", story: "kefa", stone: "agate", weight: "25" },
  "vu-prod-34": { title: "fatih_seal", story: "fatih_seal", stone: "jasper", weight: "25" },
  "vu-prod-35": { title: "allah_agate", story: "allah", stone: "agate", weight: "25", sacred: true },
  "vu-prod-36": { title: "bismillah", story: "bismillah", stone: "agate", weight: "25", sacred: true },
  "vu-prod-37": { title: "tevhid_agate", story: "tevhid", stone: "agate", weight: "25", sacred: true },
  "vu-prod-38": { title: "yasin58", story: "yasin58", stone: "agate", weight: "13", sacred: true },
  "vu-prod-39": { title: "tevhid_onyx", story: "tevhid", stone: "onyx", weight: "25", sacred: true },
  "vu-prod-40": { title: "bismillah", story: "bismillah", stone: "agate", weight: "23", sacred: true },
  "vu-prod-41": { title: "allah_onyx", story: "allah", stone: "onyx", weight: "23", sacred: true },
  "vu-prod-42": { title: "el_mulku", story: "el_mulku", stone: "agate", weight: "23", sacred: true },
  "vu-prod-43": { title: "el_mulku", story: "el_mulku", stone: "agate", weight: "23", sacred: true },
  "vu-prod-44": { title: "musavvir", story: "musavvir", stone: "agate", weight: "23", sacred: true },
  "vu-prod-45": { title: "seref_sems", story: "seref_sems", stone: "yellow_agate", weight: "23" },
  "vu-prod-46": { title: "ilahi", story: "ilahi", stone: "red_agate", weight: "25", sacred: true },
  "vu-prod-47": { title: "lagalibe_black_onyx", story: "lagalibe", stone: "black_onyx", weight: "25", sacred: true },
  "vu-prod-48": { title: "lagalibe_red_agate", story: "lagalibe", stone: "red_agate", weight: "25", sacred: true },
  "vu-prod-49": { title: "suleyman_gold", story: "suleyman_gold", stone: "agate", weight: "25", sacred: true },
  "vu-prod-50": { title: "suleyman", story: "suleyman", stone: "agate", weight: "15", sacred: true },
  "vu-prod-51": { title: "ecirna", story: "ecirna", weight: "25", sacred: true },
  "vu-prod-52": { title: "hud", story: "hud", stone: "agate", weight: "21", sacred: true },
  "vu-prod-53": { title: "hud", story: "hud", stone: "agate", weight: "21", sacred: true },
  "vu-prod-54": { title: "ya_malik", story: "ya_malik", stone: "onyx", weight: "19–22", sacred: true },
  "vu-prod-55": { title: "insirah", story: "insirah", stone: "yellow_agate", sacred: true },
  "vu-prod-56": { title: "design", story: "design", service: true },
  "vu-prod-57": { title: "sems", story: "sems", stone: "yemen_agate", sacred: true },
  "vu-prod-58": { title: "fatiha_silver", story: "fatiha_silver", weight: "25", sacred: true },
  "vu-prod-59": { title: "mumin44", story: "mumin44", stone: "agate", sacred: true },
  "vu-prod-60": { title: "kalem52", story: "kalem52", stone: "hematite", sacred: true },
  "vu-prod-61": { title: "musavvir_horasan", story: "musavvir_signed", stone: "horasan_agate", sacred: true },
  "vu-prod-62": { title: "kufi_tevhid", story: "kufi_tevhid", sacred: true },
  "vu-prod-63": { title: "ayetel_octagon", story: "ayetel_octagon", stone: "agate", sacred: true },
  "vu-prod-64": { title: "buda_gecer", story: "buda_gecer", stone: "red_agate" },
  "vu-prod-65": { title: "ayetel_nakkas", story: "ayetel_nakkas", stone: "agate", sacred: true },
};

const buildDescription = (entry: CatalogEntry, lang: Language) => {
  const l = LABELS[lang];
  const parts: string[] = [];
  if (entry.story) parts.push(STORIES[entry.story][lang]);

  if (entry.service) {
    parts.push(l.serviceNote);
    return parts.join("\n\n");
  }

  const specs = [`• ${l.material}: ${l.materialValue}`];
  if (entry.stone) specs.push(`• ${l.stone}: ${STONES[entry.stone][lang]}`);
  if (entry.weight) specs.push(`• ${l.weight}: ${l.weightValue(entry.weight)}`);
  specs.push(`• ${l.craft}: ${l.craftValue}`);
  specs.push(`• ${l.shipping}: ${l.shippingValue}`);
  parts.push(specs.join("\n"));

  parts.push(entry.sacred ? `${l.personalise}\n${l.care}` : l.personalise);
  return parts.join("\n\n");
};

/** Complete catalogue text for a seed product in one language, or null if none. */
export const getCatalogContent = (id: string | undefined, lang: Language) => {
  const entry = id ? ENTRIES[id] : undefined;
  if (!entry) return null;
  return { title: TITLES[entry.title][lang], description: buildDescription(entry, lang) };
};
