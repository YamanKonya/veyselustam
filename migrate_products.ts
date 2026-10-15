import fs from 'fs';
import { INITIAL_VEYSELUSTAM_PRODUCTS } from './src/data/initialProducts';
import { translateProduct } from './src/i18n/productTranslations';
import { Language } from './src/i18n/translations';

const languages: Language[] = ['en', 'es', 'de', 'ar'];

const migratedProducts = INITIAL_VEYSELUSTAM_PRODUCTS.map(product => {
  const p = { ...product };
  
  languages.forEach(lang => {
    const translated = translateProduct(product, lang);
    (p as any)[`title_${lang}`] = translated.title;
    (p as any)[`description_${lang}`] = translated.description;
  });

  return p;
});

const fileContent = `import { Product } from "@/types";

export const INITIAL_VEYSELUSTAM_PRODUCTS: Product[] = ${JSON.stringify(migratedProducts, null, 2)};
`;

fs.writeFileSync('./src/data/initialProducts.ts', fileContent, 'utf8');
console.log('Migration completed successfully!');
