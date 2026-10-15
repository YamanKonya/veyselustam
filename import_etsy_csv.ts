import fs from 'fs';
import path from 'path';
import { Product } from './src/types';
import { translateProduct } from './src/i18n/productTranslations';
import { Language } from './src/i18n/translations';

// Look for any .csv file in root directory or specified path
function findEtsyCsv(): string | null {
  const rootFiles = fs.readdirSync('.');
  const csvFile = rootFiles.find(f => f.toLowerCase().endsWith('.csv'));
  if (csvFile) return csvFile;

  // Check Downloads or scratch
  const scratchPath = 'C:/Users/ROGSTRIX/.gemini/antigravity/brain/4f45c56c-9104-406a-a6e6-f6e8f301bdfe/scratch';
  if (fs.existsSync(scratchPath)) {
    const scratchFiles = fs.readdirSync(scratchPath);
    const sCsv = scratchFiles.find(f => f.toLowerCase().endsWith('.csv'));
    if (sCsv) return path.join(scratchPath, sCsv);
  }
  return null;
}

// Simple CSV parser supporting quoted newlines
function parseCsv(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuote = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuote) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toUpperCase());
  const data: Record<string, string>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const item: Record<string, string> = {};
    headers.forEach((h, idx) => {
      item[h] = row[idx] ? row[idx].trim() : '';
    });
    data.push(item);
  }

  return data;
}

async function run() {
  const csvFile = findEtsyCsv();
  if (!csvFile) {
    console.log('No Etsy CSV file found in project root. Place your Etsy listings CSV here to import!');
    return;
  }

  console.log(`Found Etsy CSV file: ${csvFile}`);
  const content = fs.readFileSync(csvFile, 'utf8');
  const records = parseCsv(content);
  console.log(`Parsed ${records.length} records from Etsy CSV.`);

  // Load existing products
  const currentInitial = require('./src/data/initialProducts.ts').INITIAL_VEYSELUSTAM_PRODUCTS as Product[];
  const existingUrls = new Set(currentInitial.map(p => p.originalUrl || p.title));

  const languages: Language[] = ['en', 'es', 'de', 'ar'];
  let addedCount = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    const title = rec['TITLE'] || rec['NAME'] || rec['ITEM_NAME'] || '';
    if (!title) continue;

    // Check if already in catalog
    if (existingUrls.has(title)) continue;

    const desc = rec['DESCRIPTION'] || rec['ITEM_DESCRIPTION'] || '';
    const priceUSD = parseFloat(rec['PRICE'] || '0') || 250;
    // Approximate conversion USD to TRY if needed, or keep standard rate
    const priceTRY = Math.round(priceUSD * 34);

    const images: string[] = [];
    for (let k = 1; k <= 10; k++) {
      const img = rec[`IMAGE${k}`] || rec[`IMAGE_${k}`];
      if (img && img.startsWith('http')) {
        images.push(img);
      }
    }

    const newProd: Product = {
      id: `etsy-prod-${currentInitial.length + addedCount + 1}`,
      title: title,
      description: desc,
      price: priceTRY,
      images: images.length > 0 ? images : ["https://cdn.myikas.com/images/12b70023-d1d5-479c-951a-7f0a014982a9/a9bf4210-456e-47bd-826e-9838c0332554/1080/1732876879891.webp"],
      category: 'Gümüş Yüzük',
      ringSize: ["15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30"],
      stock: parseInt(rec['QUANTITY'] || '10', 10) || 10,
      originalUrl: `https://www.etsy.com/shop/IslamicCraftRing`,
      createdAt: new Date().toISOString()
    };

    languages.forEach(lang => {
      const trans = translateProduct(newProd, lang);
      (newProd as any)[`title_${lang}`] = trans.title;
      (newProd as any)[`description_${lang}`] = trans.description;
    });

    currentInitial.push(newProd);
    addedCount++;
  }

  console.log(`Added ${addedCount} new items from Etsy. Total products now: ${currentInitial.length}`);
  const outContent = `import { Product } from "@/types";

export const INITIAL_VEYSELUSTAM_PRODUCTS: Product[] = ${JSON.stringify(currentInitial, null, 2)};
`;
  fs.writeFileSync('./src/data/initialProducts.ts', outContent, 'utf8');
  console.log('Successfully updated src/data/initialProducts.ts!');
}

run().catch(console.error);
