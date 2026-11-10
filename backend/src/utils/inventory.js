// Both stages execute atomically on the current database quantity, including
// returns and rollback, so concurrent changes cannot leave a stale sold flag.
export const inventoryQuantityUpdate = (change) => [
  { $set: { quantity: { $add: [{ $ifNull: ['$quantity', 1] }, change] } } },
  { $set: { outOfStock: { $eq: ['$quantity', 0] } } },
];
