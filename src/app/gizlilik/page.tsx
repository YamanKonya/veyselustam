"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/cart/CartDrawer";
import SiteFooter from "@/components/layout/SiteFooter";
import { useLanguage } from "@/context/LanguageContext";
import { Language } from "@/i18n/translations";
import { CONTACT } from "@/lib/contact";

// Privacy notice (KVKK aydınlatma metni) in every site language.

type Section = { h: string; p: string[] };
type Doc = { title: string; updated: string; intro: string; sections: Section[]; contact: string };

const UPDATED = "21.10.2026";

const DOCS: Record<Language, Doc> = {
  tr: {
    title: "Gizlilik ve KVKK Aydınlatma Metni",
    updated: "Son güncelleme",
    intro:
      "Veysel Ustam (Konya, Türkiye) olarak kişisel verilerinizi 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında, yalnızca aşağıda belirtilen amaçlarla ve gerektiği kadar işliyoruz.",
    sections: [
      {
        h: "Ziyaret istatistikleri",
        p: [
          "Sitemizi nasıl kullandığınızı anlamak ve hizmetimizi geliştirmek için şu bilgileri anonim olarak kaydediyoruz: ziyaret ettiğiniz sayfalar ve ürünler, sayfada kalma süresi, ziyaret zamanı, cihaz türü (telefon, tablet, bilgisayar), dil seçimi, sizi yönlendiren site ve kampanya bağlantısı ile şehir düzeyinde yaklaşık konum.",
          "IP adresinizi saklamıyoruz, çerez kullanmıyoruz ve bu bilgileri adınız ya da iletişim bilgilerinizle eşleştirmiyoruz. Bir ziyareti gruplamak için tarayıcı sekmesi kapanınca silinen rastgele bir kimlik kullanılır.",
        ],
      },
      {
        h: "Sipariş ve üyelik bilgileri",
        p: [
          "Sipariş verdiğinizde veya üye olduğunuzda paylaştığınız ad, telefon, e-posta ve teslimat adresi; siparişinizi hazırlamak, göndermek ve sizinle iletişim kurmak için kullanılır. Bu bilgiler yalnızca kargo firması gibi siparişin tamamlanması için zorunlu taraflarla paylaşılır.",
        ],
      },
      {
        h: "Saklama ve güvenlik",
        p: [
          "Veriler Google Firebase altyapısında güvenli olarak saklanır; sitemiz Vercel üzerinde yayınlanır. Ziyaret istatistiklerine yalnızca yönetici erişebilir. Veriler, amaç için gerekli süre ve yasal saklama süreleri boyunca tutulur.",
        ],
      },
      {
        h: "Haklarınız",
        p: [
          "KVKK'nın 11. maddesi uyarınca verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme ve işlemeye itiraz etme haklarına sahipsiniz. Talepleriniz için bize aşağıdaki iletişim bilgilerinden ulaşabilirsiniz.",
        ],
      },
    ],
    contact: "İletişim",
  },
  en: {
    title: "Privacy Notice",
    updated: "Last updated",
    intro:
      "Veysel Ustam (Konya, Türkiye) processes your personal data under the Turkish Personal Data Protection Law No. 6698 (KVKK), only for the purposes below and only as far as necessary.",
    sections: [
      {
        h: "Visit statistics",
        p: [
          "To understand how our site is used and improve it, we anonymously record: the pages and products you view, time spent on each page, the time of your visit, device type (phone, tablet, computer), language, the referring site or campaign link, and your approximate city-level location.",
          "We do not store your IP address, we do not use cookies, and we never link this information to your name or contact details. A random ID, deleted when you close the browser tab, groups the pages of one visit.",
        ],
      },
      {
        h: "Orders and accounts",
        p: [
          "The name, phone number, e-mail and delivery address you provide when ordering or signing up are used to prepare and ship your order and to contact you. They are shared only with parties required to complete the order, such as the courier.",
        ],
      },
      {
        h: "Storage and security",
        p: [
          "Data is stored securely on Google Firebase; the site is hosted on Vercel. Only the administrator can access visit statistics. Data is kept for as long as its purpose and legal retention periods require.",
        ],
      },
      {
        h: "Your rights",
        p: [
          "Under Article 11 of KVKK you may ask whether your data is processed, request its correction or deletion, and object to its processing. Please contact us using the details below.",
        ],
      },
    ],
    contact: "Contact",
  },
  es: {
    title: "Aviso de privacidad",
    updated: "Última actualización",
    intro:
      "Veysel Ustam (Konya, Turquía) trata sus datos personales conforme a la Ley turca n.º 6698 de Protección de Datos Personales (KVKK), solo para los fines indicados a continuación y en la medida necesaria.",
    sections: [
      {
        h: "Estadísticas de visitas",
        p: [
          "Para entender cómo se usa nuestro sitio y mejorarlo, registramos de forma anónima: las páginas y productos que visita, el tiempo en cada página, la hora de la visita, el tipo de dispositivo (teléfono, tableta, ordenador), el idioma, el sitio o enlace de campaña de procedencia y su ubicación aproximada a nivel de ciudad.",
          "No guardamos su dirección IP, no usamos cookies y nunca vinculamos estos datos con su nombre o sus datos de contacto. Un identificador aleatorio, que se borra al cerrar la pestaña, agrupa las páginas de una visita.",
        ],
      },
      {
        h: "Pedidos y cuentas",
        p: [
          "El nombre, teléfono, correo electrónico y dirección de entrega que facilita al comprar o registrarse se usan para preparar y enviar su pedido y para contactarle. Solo se comparten con quienes son necesarios para completar el pedido, como la empresa de mensajería.",
        ],
      },
      {
        h: "Conservación y seguridad",
        p: [
          "Los datos se guardan de forma segura en Google Firebase; el sitio está alojado en Vercel. Solo el administrador puede ver las estadísticas de visitas. Los datos se conservan el tiempo que exija su finalidad y los plazos legales.",
        ],
      },
      {
        h: "Sus derechos",
        p: [
          "Según el artículo 11 de la KVKK, puede preguntar si tratamos sus datos, solicitar su corrección o eliminación y oponerse a su tratamiento. Contáctenos con los datos que figuran abajo.",
        ],
      },
    ],
    contact: "Contacto",
  },
  de: {
    title: "Datenschutzhinweis",
    updated: "Zuletzt aktualisiert",
    intro:
      "Veysel Ustam (Konya, Türkei) verarbeitet Ihre personenbezogenen Daten nach dem türkischen Datenschutzgesetz Nr. 6698 (KVKK) nur zu den unten genannten Zwecken und nur im erforderlichen Umfang.",
    sections: [
      {
        h: "Besuchsstatistik",
        p: [
          "Um zu verstehen, wie unsere Website genutzt wird, und sie zu verbessern, erfassen wir anonym: die besuchten Seiten und Produkte, die Verweildauer, den Zeitpunkt des Besuchs, den Gerätetyp (Telefon, Tablet, Computer), die Sprache, die verweisende Website bzw. den Kampagnenlink sowie Ihren ungefähren Standort auf Stadtebene.",
          "Wir speichern keine IP-Adressen, verwenden keine Cookies und verknüpfen diese Angaben nie mit Ihrem Namen oder Ihren Kontaktdaten. Eine zufällige Kennung, die beim Schließen des Browser-Tabs gelöscht wird, fasst die Seiten eines Besuchs zusammen.",
        ],
      },
      {
        h: "Bestellungen und Konten",
        p: [
          "Name, Telefonnummer, E-Mail und Lieferadresse, die Sie bei einer Bestellung oder Registrierung angeben, verwenden wir, um Ihre Bestellung vorzubereiten, zu versenden und Sie zu kontaktieren. Sie werden nur an Beteiligte weitergegeben, die für die Abwicklung nötig sind, etwa den Paketdienst.",
        ],
      },
      {
        h: "Speicherung und Sicherheit",
        p: [
          "Die Daten werden sicher bei Google Firebase gespeichert; die Website wird bei Vercel gehostet. Nur der Administrator hat Zugriff auf die Besuchsstatistik. Daten werden so lange aufbewahrt, wie es der Zweck und gesetzliche Fristen erfordern.",
        ],
      },
      {
        h: "Ihre Rechte",
        p: [
          "Nach Artikel 11 KVKK können Sie Auskunft darüber verlangen, ob Ihre Daten verarbeitet werden, deren Berichtigung oder Löschung beantragen und der Verarbeitung widersprechen. Kontaktieren Sie uns über die unten stehenden Angaben.",
        ],
      },
    ],
    contact: "Kontakt",
  },
  ar: {
    title: "إشعار الخصوصية",
    updated: "آخر تحديث",
    intro:
      "يعالج «فيسل أوستام» (قونية، تركيا) بياناتك الشخصية وفقًا لقانون حماية البيانات الشخصية التركي رقم 6698 (KVKK)، وللأغراض المذكورة أدناه فقط وبالقدر اللازم.",
    sections: [
      {
        h: "إحصاءات الزيارات",
        p: [
          "لفهم طريقة استخدام موقعنا وتحسينه، نسجّل بشكل مجهول الهوية: الصفحات والمنتجات التي تزورها، ومدة البقاء في كل صفحة، ووقت الزيارة، ونوع الجهاز (هاتف، جهاز لوحي، حاسوب)، واللغة، والموقع أو رابط الحملة الذي جئت منه، وموقعك التقريبي على مستوى المدينة.",
          "لا نحتفظ بعنوان IP الخاص بك، ولا نستخدم ملفات تعريف الارتباط، ولا نربط هذه المعلومات باسمك أو بيانات الاتصال الخاصة بك. يُستخدم معرّف عشوائي يُحذف عند إغلاق علامة التبويب لتجميع صفحات الزيارة الواحدة.",
        ],
      },
      {
        h: "الطلبات والحسابات",
        p: [
          "تُستخدم بيانات الاسم والهاتف والبريد الإلكتروني وعنوان التوصيل التي تقدّمها عند الطلب أو التسجيل لتجهيز طلبك وشحنه والتواصل معك، ولا تُشارك إلا مع الجهات اللازمة لإتمام الطلب مثل شركة الشحن.",
        ],
      },
      {
        h: "الحفظ والأمان",
        p: [
          "تُحفظ البيانات بأمان على منصة Google Firebase، ويُستضاف الموقع على Vercel. لا يطّلع على إحصاءات الزيارات إلا المسؤول. وتُحفظ البيانات طوال المدة التي يتطلبها الغرض والمدد القانونية.",
        ],
      },
      {
        h: "حقوقك",
        p: [
          "بموجب المادة 11 من القانون يحق لك معرفة ما إذا كانت بياناتك تُعالج، وطلب تصحيحها أو حذفها، والاعتراض على معالجتها. يمكنك التواصل معنا عبر البيانات أدناه.",
        ],
      },
    ],
    contact: "التواصل",
  },
};

export default function PrivacyPage() {
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
