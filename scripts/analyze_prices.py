import json
import re

with open(r'c:\Users\ROGSTRIX\Downloads\veyselustam\src\data\initialProducts.ts', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const INITIAL_VEYSELUSTAM_PRODUCTS: Product\[\] = (\[.*?\]);', content, re.DOTALL)
if match:
    products = json.loads(match.group(1))
    print(f'Total products: {len(products)}')
    prices = [p.get('price', 0) for p in products]
    print(f'Min price: {min(prices)}, Max price: {max(prices)}, Avg: {sum(prices)/len(prices):.1f}')
    
    categories = {}
    for p in products:
        c = p.get('category', 'Diger')
        categories[c] = categories.get(c, 0) + 1
    print('Categories:')
    for k, v in categories.items():
        print(f'  {k}: {v}')
    
    sorted_by_price = sorted(products, key=lambda x: x.get('price', 0))
    print('\nLowest 5 products:')
    for p in sorted_by_price[:5]:
        print(f"  {p.get('id')}: {p.get('price')} TL - {p.get('category')} - {p.get('title')[:60]}")
        
    print('\nHighest 5 products:')
    for p in sorted_by_price[-5:]:
        print(f"  {p.get('id')}: {p.get('price')} TL - {p.get('category')} - {p.get('title')[:60]}")
else:
    print('Could not find products array')
