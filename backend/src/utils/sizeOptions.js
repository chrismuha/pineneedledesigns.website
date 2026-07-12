const standardSizeOrder = ['XS', 'Small', 'Medium', 'Large', 'XL', '2X', '3X'];
const aliases = new Map([
  ['xs', 'XS'], ['s', 'Small'], ['small', 'Small'], ['m', 'Medium'], ['medium', 'Medium'],
  ['l', 'Large'], ['large', 'Large'], ['xl', 'XL'], ['1x', 'XL'], ['2x', '2X'], ['3x', '3X'],
]);

const rank = (value) => standardSizeOrder.indexOf(aliases.get(String(value).trim().toLowerCase()));

export const sortSizeOptions = (sizes = []) => [...sizes].sort((left, right) => {
  const leftRank = rank(left);
  const rightRank = rank(right);
  if (leftRank >= 0 && rightRank >= 0) return leftRank - rightRank;
  if (leftRank >= 0) return -1;
  if (rightRank >= 0) return 1;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
});
