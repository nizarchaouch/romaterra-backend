const normalizeOrderItems = (items) => {
  const merged = new Map();

  for (const item of items) {
    const productId = String(item.product);
    const quantity = Number(item.quantity);
    const current = merged.get(productId) || 0;
    merged.set(productId, current + quantity);
  }

  return Array.from(merged.entries()).map(([product, quantity]) => ({
    product,
    quantity,
  }));
};

module.exports = {
  normalizeOrderItems,
};
