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

// Social accounts shown with their logos in the header and footer. Add a link
// here (e.g. facebook: "https://facebook.com/...") and its logo appears.
export const SOCIAL: { id: "instagram" | "whatsapp" | "facebook" | "tiktok" | "youtube" | "pinterest"; label: string; href: string }[] = [
  { id: "instagram", label: "Instagram", href: `https://www.instagram.com/${CONTACT.instagram}/` },
  { id: "whatsapp", label: "WhatsApp", href: whatsappLink() },
];
