export const formatPrice = (value: number) =>
  value.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const discountPercent = (price: number, originalPrice?: number, explicit?: number) => {
  if (!originalPrice || originalPrice <= price) return 0;
  return explicit || Math.round(((originalPrice - price) / originalPrice) * 100);
};
