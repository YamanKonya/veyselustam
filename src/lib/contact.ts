// Single source for contact details used across the site.
export const CONTACT = {
  phoneDisplay: "0533 620 30 85",
  phoneE164: "+905336203085",
  whatsapp: "905336203085",
  instagram: "veysel.ustam",
  address: "Konya, Türkiye",
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
