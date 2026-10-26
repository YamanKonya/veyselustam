"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import SiteFooter from "@/components/layout/SiteFooter";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/i18n/translations";
import { CONTACT, whatsappLink } from "@/lib/contact";

// Return and exchange policy in every site language. Linked from the footer and
// given to Pinterest as the merchant return policy.

type Section = { h: string; p: string[] };
type Doc = { title: string; updated: string; intro: string; sections: Section[]; contact: string };

const UPDATED = "26.10.2026";

const DOCS: Record<Language, Doc> = {
  tr: {
    title: "İade ve Değişim Koşulları",
    updated: "Son güncelleme",
    intro:
      "Veysel Ustam'daki tüm yüzükler siparişiniz üzerine sizin için elde hazırlanır: kasa ölçünüze göre yapılır, taş seçilir, yazı ya da isim işlenir.",
    sections: [
      {
        h: "Cayma hakkı",
        p: [
          "Ürünlerimiz kişiye özel hazırlandığından, Mesafeli Sözleşmeler Yönetmeliği'nin 15/1-ç maddesi uyarınca cayma hakkı kapsamı dışındadır. Fikir değiştirme, beğenmeme gibi nedenlerle iade ve değişim kabul edilmez.",
          "Ölçü, taş ve yazı konusunda sipariş öncesinde bize danışmanızı öneririz.",
        ],
      },
      {
        h: "Kusurlu, hatalı veya hasarlı ürün",
        p: [
          "Ürün kusurlu, siparişten farklı (yanlış ölçü, yazı ya da taş) veya kargoda hasar görmüş olarak ulaşırsa, 6502 sayılı Tüketicinin Korunması Hakkında Kanun'dan doğan haklarınız saklıdır. Ürünü ücretsiz onarır, yeniden üretir veya bedelini iade ederiz. Kargo masrafı bize aittir.",
        ],
      },
      {
        h: "Başvuru",
        p: [
          "Sorunu fotoğraflarıyla birlikte telefon, WhatsApp veya Instagram üzerinden bize bildirin. Kargo paketi hasarlıysa, teslim alırken kargo görevlisine tutanak tutturun.",
        ],
      },
      {
        h: "Para iadesi",
        p: [
          "Kusurlu ürün bize ulaşıp incelendikten sonra en geç 14 gün içinde, ödemeyi yaptığınız yöntemle iade edilir.",
        ],
      },
    ],
    contact: "İletişim",
  },
  en: {
    title: "Returns and Exchanges",
    updated: "Last updated",
    intro:
      "Every ring at Veysel Ustam is handmade for you after you order: the band is made to your size, the stone is selected and the inscription or name is engraved.",
    sections: [
      {
        h: "Right of withdrawal",
        p: [
          "Because our products are made to order, they are excluded from the right of withdrawal under Article 15/1-ç of the Turkish Distance Contracts Regulation. Returns and exchanges for a change of mind or because you no longer want the item are not accepted.",
          "Please ask us about size, stone and inscription before you order.",
        ],
      },
      {
        h: "Faulty, incorrect or damaged items",
        p: [
          "If your ring arrives faulty, different from your order (wrong size, inscription or stone) or damaged in transit, your rights under Turkish Consumer Protection Law No. 6502 remain in full. We will repair it, remake it or refund it free of charge, and we cover the shipping costs.",
        ],
      },
      {
        h: "How to contact us",
        p: [
          "Tell us about the problem with photos by phone, WhatsApp or Instagram. If the parcel is damaged, ask the courier to record it in a damage report when you receive it.",
        ],
      },
      {
        h: "Refunds",
        p: [
          "Once a faulty item reaches us and has been inspected, the refund is made within 14 days at the latest, to the payment method you used.",
        ],
      },
    ],
    contact: "Contact",
  },
  es: {
    title: "Devoluciones y cambios",
    updated: "Última actualización",
    intro:
      "Todos los anillos de Veysel Ustam se elaboran a mano para usted después de su pedido: el aro se hace a su medida, se elige la piedra y se graba el texto o el nombre.",
    sections: [
      {
        h: "Derecho de desistimiento",
        p: [
          "Como nuestros productos se fabrican por encargo, quedan excluidos del derecho de desistimiento según el artículo 15/1-ç del Reglamento turco de Contratos a Distancia. No se aceptan devoluciones ni cambios por cambio de opinión o porque el artículo ya no le interese.",
          "Le recomendamos consultarnos la medida, la piedra y el texto antes de hacer el pedido.",
        ],
      },
      {
        h: "Artículos defectuosos, erróneos o dañados",
        p: [
          "Si el anillo llega defectuoso, distinto de lo pedido (medida, texto o piedra equivocados) o dañado en el transporte, conserva todos sus derechos según la Ley turca n.º 6502 de Protección del Consumidor. Lo repararemos, lo volveremos a fabricar o le reembolsaremos el importe sin coste, y nos haremos cargo del envío.",
        ],
      },
      {
        h: "Cómo contactarnos",
        p: [
          "Cuéntenos el problema con fotos por teléfono, WhatsApp o Instagram. Si el paquete llega dañado, pida al mensajero que lo haga constar en un acta al recibirlo.",
        ],
      },
      {
        h: "Reembolsos",
        p: [
          "Cuando el artículo defectuoso nos llegue y lo hayamos revisado, el reembolso se realiza en un plazo máximo de 14 días, con el mismo medio de pago que utilizó.",
        ],
      },
    ],
    contact: "Contacto",
  },
  de: {
    title: "Rückgabe und Umtausch",
    updated: "Zuletzt aktualisiert",
    intro:
      "Jeder Ring von Veysel Ustam wird nach Ihrer Bestellung für Sie von Hand gefertigt: Die Ringschiene wird nach Ihrer Größe gearbeitet, der Stein ausgewählt und die Inschrift oder der Name graviert.",
    sections: [
      {
        h: "Widerrufsrecht",
        p: [
          "Da unsere Produkte auf Bestellung angefertigt werden, sind sie nach Artikel 15/1-ç der türkischen Verordnung über Fernabsatzverträge vom Widerrufsrecht ausgenommen. Rückgabe oder Umtausch, weil Sie es sich anders überlegt haben oder der Artikel nicht gefällt, sind nicht möglich.",
          "Bitte sprechen Sie Größe, Stein und Inschrift vor der Bestellung mit uns ab.",
        ],
      },
      {
        h: "Fehlerhafte, falsche oder beschädigte Artikel",
        p: [
          "Kommt Ihr Ring fehlerhaft, abweichend von Ihrer Bestellung (falsche Größe, Inschrift oder falscher Stein) oder beim Transport beschädigt an, bleiben Ihre Rechte nach dem türkischen Verbraucherschutzgesetz Nr. 6502 vollständig bestehen. Wir reparieren ihn, fertigen ihn neu oder erstatten den Betrag kostenlos und übernehmen die Versandkosten.",
        ],
      },
      {
        h: "So erreichen Sie uns",
        p: [
          "Schildern Sie uns das Problem mit Fotos per Telefon, WhatsApp oder Instagram. Ist das Paket beschädigt, lassen Sie den Schaden bei der Annahme vom Zusteller protokollieren.",
        ],
      },
      {
        h: "Erstattung",
        p: [
          "Sobald der fehlerhafte Artikel bei uns eingetroffen und geprüft ist, erstatten wir den Betrag spätestens innerhalb von 14 Tagen über die von Ihnen genutzte Zahlungsart.",
        ],
      },
    ],
    contact: "Kontakt",
  },
  ar: {
    title: "سياسة الإرجاع والاستبدال",
    updated: "آخر تحديث",
    intro:
      "تُصنع جميع خواتم «فيسل أوستام» يدويًا خصيصًا لك بعد طلبك: يُصاغ الخاتم على مقاسك، ويُختار الحجر، ويُنقش النص أو الاسم.",
    sections: [
      {
        h: "حق العدول",
        p: [
          "لأن منتجاتنا تُصنع حسب الطلب، فهي مستثناة من حق العدول وفقًا للمادة 15/1-ç من لائحة العقود عن بُعد التركية. لا نقبل الإرجاع أو الاستبدال بسبب تغيير الرأي أو عدم الإعجاب بالمنتج.",
          "ننصحك باستشارتنا في المقاس والحجر والنقش قبل الطلب.",
        ],
      },
      {
        h: "المنتج المعيب أو الخاطئ أو التالف",
        p: [
          "إذا وصلك الخاتم معيبًا أو مختلفًا عن طلبك (مقاس أو نقش أو حجر خاطئ) أو تالفًا أثناء الشحن، فإن حقوقك بموجب قانون حماية المستهلك التركي رقم 6502 محفوظة بالكامل. سنصلحه أو نعيد صنعه أو نردّ ثمنه مجانًا، ونتحمّل تكاليف الشحن.",
        ],
      },
      {
        h: "طريقة التواصل",
        p: [
          "أخبرنا بالمشكلة مع صور عبر الهاتف أو واتساب أو إنستغرام. إذا كان الطرد تالفًا، فاطلب من مندوب الشحن تحرير محضر بذلك عند الاستلام.",
        ],
      },
      {
        h: "استرداد المبلغ",
        p: [
          "بعد وصول المنتج المعيب إلينا وفحصه، يُردّ المبلغ خلال 14 يومًا كحدّ أقصى بطريقة الدفع نفسها التي استخدمتها.",
        ],
      },
    ],
    contact: "التواصل",
  },
};

export default function ReturnsPage() {
  const { language } = useLanguage();
  const doc = DOCS[language] || DOCS.tr;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CartDrawer />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h1 className="font-display text-3xl sm:text-4xl text-versace-green-900">{doc.title}</h1>
        <p className="text-xs text-slate-500 mt-2">
          {doc.updated}: <span className="tabular-nums">{UPDATED}</span>
        </p>
        <p className="mt-6 text-slate-700 leading-relaxed">{doc.intro}</p>
        {doc.sections.map((s) => (
          <section key={s.h} className="mt-8">
            <h2 className="font-display text-2xl text-versace-green-900">{s.h}</h2>
            {s.p.map((p, i) => (
              <p key={i} className="mt-3 text-slate-700 leading-relaxed">
                {p}
              </p>
            ))}
          </section>
        ))}
        <section className="mt-8 p-5 rounded-2xl bg-versace-green-900 text-versace-green-100">
          <h2 className="font-display text-xl text-versace-gold-500">{doc.contact}</h2>
          <p className="mt-2 text-sm leading-relaxed">
            Veysel Ustam · {CONTACT.address}
            <br />
            <a href={`tel:${CONTACT.phoneE164}`} className="hover:text-white tabular-nums" dir="ltr">
              {CONTACT.phoneDisplay}
            </a>
            {" · "}
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-white" dir="ltr">
              WhatsApp
            </a>
            {" · "}
            <a href={`https://instagram.com/${CONTACT.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-white" dir="ltr">
              @{CONTACT.instagram}
            </a>
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
