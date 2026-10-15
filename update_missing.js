const fs = require('fs');
const path = './src/i18n/translations.ts';

let content = fs.readFileSync(path, 'utf8');

const newKeys = {
  tr: `    nav_my_cart: "Sepetim",
    cat_el_oymasi: "EL OYMASI",
    cat_dogal_tasli: "DOĞAL TAŞLI",
    cat_gumuse_oyma: "GÜMÜŞE OYMA",
    cat_mineli_yuzukler: "MİNELİ YÜZÜKLER",
    cat_ozel_siparis: "ÖZEL SİPARİŞ",
    nav_search_ph: "Arama...",
    footer_contact_title: "İLETİŞİM",
    footer_contact_desc: "Gümüş Yüzük, Özel Sipariş ve Toptan Satış için bizimle iletişime geçin",
    footer_membership_title: "ÜYELİK",
    footer_membership_new: "YENİ ÜYELİK",
    footer_membership_login: "ÜYE GİRİŞİ",
    footer_membership_forgot: "ŞİFREMİ UNUTTUM",
    footer_membership_track: "SİPARİŞ TAKİBİ",
    footer_shopping_title: "ALIŞVERİŞ",
    footer_shopping_distance: "MESAFELİ SATIŞ SÖZLEŞMESİ",
    footer_shopping_delivery: "TESLİMAT VE İADE",
    footer_shopping_warranty: "GARANTİ ŞARTLARI",
    footer_shopping_bank: "BANKA HESAPLARIMIZ",
    footer_corp_title: "KURUMSAL",
    footer_corp_about: "HAKKIMIZDA",
    footer_corp_customer: "MÜŞTERİ HİZMETLERİ",
    footer_corp_faq: "SIKÇA SORULAN SORULAR",
    footer_corp_privacy: "GİZLİLİK POLİTİKASI",`,
  en: `    nav_my_cart: "My Cart",
    cat_el_oymasi: "HAND-CARVED",
    cat_dogal_tasli: "NATURAL STONE",
    cat_gumuse_oyma: "SILVER ENGRAVED",
    cat_mineli_yuzukler: "ENAMEL RINGS",
    cat_ozel_siparis: "CUSTOM ORDER",
    nav_search_ph: "Search...",
    footer_contact_title: "CONTACT",
    footer_contact_desc: "Contact us for Silver Rings, Custom Orders and Wholesale",
    footer_membership_title: "MEMBERSHIP",
    footer_membership_new: "NEW MEMBERSHIP",
    footer_membership_login: "LOGIN",
    footer_membership_forgot: "FORGOT PASSWORD",
    footer_membership_track: "ORDER TRACKING",
    footer_shopping_title: "SHOPPING",
    footer_shopping_distance: "DISTANCE SELLING CONTRACT",
    footer_shopping_delivery: "DELIVERY AND RETURNS",
    footer_shopping_warranty: "WARRANTY CONDITIONS",
    footer_shopping_bank: "BANK ACCOUNTS",
    footer_corp_title: "CORPORATE",
    footer_corp_about: "ABOUT US",
    footer_corp_customer: "CUSTOMER SERVICE",
    footer_corp_faq: "FREQUENTLY ASKED QUESTIONS",
    footer_corp_privacy: "PRIVACY POLICY",`,
  es: `    nav_my_cart: "Mi Carrito",
    cat_el_oymasi: "TALLADO A MANO",
    cat_dogal_tasli: "PIEDRA NATURAL",
    cat_gumuse_oyma: "GRABADO EN PLATA",
    cat_mineli_yuzukler: "ANILLOS ESMALTADOS",
    cat_ozel_siparis: "PEDIDO ESPECIAL",
    nav_search_ph: "Buscar...",
    footer_contact_title: "CONTACTO",
    footer_contact_desc: "Contáctenos para Anillos de Plata, Pedidos Especiales y Venta al por Mayor",
    footer_membership_title: "MEMBRESÍA",
    footer_membership_new: "NUEVA MEMBRESÍA",
    footer_membership_login: "INICIAR SESIÓN",
    footer_membership_forgot: "OLVIDÉ MI CONTRASEÑA",
    footer_membership_track: "SEGUIMIENTO DE PEDIDO",
    footer_shopping_title: "COMPRAS",
    footer_shopping_distance: "CONTRATO DE VENTA A DISTANCIA",
    footer_shopping_delivery: "ENTREGA Y DEVOLUCIONES",
    footer_shopping_warranty: "CONDICIONES DE GARANTÍA",
    footer_shopping_bank: "CUENTAS BANCARIAS",
    footer_corp_title: "CORPORATIVO",
    footer_corp_about: "SOBRE NOSOTROS",
    footer_corp_customer: "SERVICIO AL CLIENTE",
    footer_corp_faq: "PREGUNTAS FRECUENTES",
    footer_corp_privacy: "POLÍTICA DE PRIVACIDAD",`,
  de: `    nav_my_cart: "Mein Warenkorb",
    cat_el_oymasi: "HANDGESCHNITZT",
    cat_dogal_tasli: "NATURSTEIN",
    cat_gumuse_oyma: "SILBER GRAVIERT",
    cat_mineli_yuzukler: "EMAILLE-RINGE",
    cat_ozel_siparis: "SONDERBESTELLUNG",
    nav_search_ph: "Suche...",
    footer_contact_title: "KONTAKT",
    footer_contact_desc: "Kontaktieren Sie uns für Silberringe, Sonderanfertigungen und Großhandel",
    footer_membership_title: "MITGLIEDSCHAFT",
    footer_membership_new: "NEUE MITGLIEDSCHAFT",
    footer_membership_login: "ANMELDEN",
    footer_membership_forgot: "PASSWORT VERGESSEN",
    footer_membership_track: "BESTELLVERFOLGUNG",
    footer_shopping_title: "EINKAUFEN",
    footer_shopping_distance: "FERNABSATZVERTRAG",
    footer_shopping_delivery: "LIEFERUNG UND RÜCKGABE",
    footer_shopping_warranty: "GARANTIEBEDINGUNGEN",
    footer_shopping_bank: "BANKVERBINDUNGEN",
    footer_corp_title: "UNTERNEHMEN",
    footer_corp_about: "ÜBER UNS",
    footer_corp_customer: "KUNDENDIENST",
    footer_corp_faq: "HÄUFIG GESTELLTE FRAGEN",
    footer_corp_privacy: "DATENSCHUTZRICHTLINIE",`,
  ar: `    nav_my_cart: "سلتي",
    cat_el_oymasi: "منحوت يدوياً",
    cat_dogal_tasli: "أحجار طبيعية",
    cat_gumuse_oyma: "نقش فضة",
    cat_mineli_yuzukler: "خواتم مطلية بالمينا",
    cat_ozel_siparis: "طلب خاص",
    nav_search_ph: "بحث...",
    footer_contact_title: "اتصل بنا",
    footer_contact_desc: "تواصل معنا لخواتم الفضة، الطلبات الخاصة ومبيعات الجملة",
    footer_membership_title: "العضوية",
    footer_membership_new: "عضوية جديدة",
    footer_membership_login: "تسجيل الدخول",
    footer_membership_forgot: "نسيت كلمة المرور",
    footer_membership_track: "تتبع الطلب",
    footer_shopping_title: "التسوق",
    footer_shopping_distance: "اتفاقية البيع عن بعد",
    footer_shopping_delivery: "التسليم والاسترجاع",
    footer_shopping_warranty: "شروط الضمان",
    footer_shopping_bank: "حساباتنا البنكية",
    footer_corp_title: "مؤسسي",
    footer_corp_about: "معلومات عنا",
    footer_corp_customer: "خدمة العملاء",
    footer_corp_faq: "الأسئلة الشائعة",
    footer_corp_privacy: "سياسة الخصوصية",`
};

// We will inject the new keys for each language just before recent_products: "..."
// Since recent_products is universally translated differently, let's inject before nav_whatsapp_support for each lang
const targetStrings = {
    tr: 'nav_whatsapp_support: "WhatsApp Destek",',
    en: 'nav_whatsapp_support: "WhatsApp Support",',
    es: 'nav_whatsapp_support: "Soporte WhatsApp",',
    de: 'nav_whatsapp_support: "WhatsApp Support",',
    ar: 'nav_whatsapp_support: "دعم واتساب",'
};

const languages = ['tr', 'en', 'es', 'de', 'ar'];

for (const lang of languages) {
    const target = targetStrings[lang];
    const targetIndex = content.indexOf(target);
    
    if (targetIndex !== -1) {
        content = content.slice(0, targetIndex) + newKeys[lang] + '\\n' + content.slice(targetIndex);
    } else {
        console.error("Could not find target for " + lang);
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log("Translations updated!");
