import fs from 'fs';
import { translateProduct } from './src/i18n/productTranslations';
import { Language } from './src/i18n/translations';
import { Product } from './src/types';

const scrapedPath = 'C:/Users/ROGSTRIX/.gemini/antigravity/brain/4f45c56c-9104-406a-a6e6-f6e8f301bdfe/scratch/scraped_veyselustam_all.json';
const scrapedProducts: Product[] = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));

console.log(`Loaded ${scrapedProducts.length} scraped products.`);

const languages: Language[] = ['en', 'es', 'de', 'ar'];

const processed: Product[] = scrapedProducts.map((raw, idx) => {
  const p: Product = {
    ...raw,
    id: `vu-prod-${idx + 1}`,
  };

  // If no images, provide a fallback image from another ring
  if (!p.images || p.images.length === 0) {
    p.images = [
      "https://cdn.myikas.com/images/12b70023-d1d5-479c-951a-7f0a014982a9/a9bf4210-456e-47bd-826e-9838c0332554/1080/1732876879891.webp"
    ];
  }

  // Translate to the 4 languages
  languages.forEach(lang => {
    const translated = translateProduct(p, lang);
    (p as any)[`title_${lang}`] = translated.title;
    (p as any)[`description_${lang}`] = translated.description;
  });

  return p;
});

const content = `import { Product } from "@/types";

export const INITIAL_VEYSELUSTAM_PRODUCTS: Product[] = ${JSON.stringify(processed, null, 2)};
`;

fs.writeFileSync('./src/data/initialProducts.ts', content, 'utf8');
console.log(`Successfully written ${processed.length} products with 5 languages to src/data/initialProducts.ts!`);
