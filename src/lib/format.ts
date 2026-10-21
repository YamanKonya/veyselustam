export const formatPrice = (value: number) =>
  value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Always derived from the two prices, so a stale stored percentage can't disagree with them
export const discountPercent = (price: number, originalPrice?: number, _stored?: number) => {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
};
