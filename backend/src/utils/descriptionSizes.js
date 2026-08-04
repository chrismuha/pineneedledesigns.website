import { sortSizeOptions } from './sizeOptions.js';

const normalizeNamedSize = (value) => {
  const token = String(value || '').trim().toLowerCase();
  const aliases = {
    xs: 'XS', s: 'Small', small: 'Small', m: 'Medium', medium: 'Medium',
    l: 'Large', large: 'Large', xl: 'XL', '1x': 'XL',
  };
  if (aliases[token]) return aliases[token];
  if (/^[2-9]x$/i.test(token)) return token.toUpperCase();
  return '';
};

const expandXRange = (start, end) => {
  const first = Number(start);
  const last = Number(end);
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 1 || last > 9 || first > last) return [];
  return Array.from({ length: last - first + 1 }, (_, index) => `${first + index}X`);
};

const expandNumericRange = (start, end) => {
  const first = Number(start);
  const last = Number(end);
  if (!Number.isInteger(first) || !Number.isInteger(last) || first < 0 || last > 40 || first > last) return [];
  const step = first % 2 === 0 && last % 2 === 0 ? 2 : 1;
  return Array.from({ length: Math.floor((last - first) / step) + 1 }, (_, index) => String(first + (index * step)));
};

const sizeClauses = (source) => {
  const text = Array.isArray(source) ? source.join('. ') : String(source || '');
  return [...text.matchAll(/\b(?:size|sizes|fits?|available)\b(?:(?:\d\.\d)|[^.!?]){0,140}/gi)]
    .map((match) => match[0]);
};

const extractWearableSizes = (source, { numeric = true } = {}) => {
  const clauses = sizeClauses(source);
  if (!clauses.length) return [];

  const sizes = [];
  for (const clause of clauses) {
    let remaining = clause;
    remaining = remaining.replace(/\b([1-9])\s*x\s*[-–—]\s*([1-9])\s*x\b/gi, (_match, start, end) => {
      sizes.push(...expandXRange(start, end));
      return ' ';
    });
    remaining = remaining.replace(/\b(?:xs|s|m|l|xl|[1-9]x)\s*[-–—]\s*(?:xs|s|m|l|xl|[1-9]x)\b/gi, (range) => {
      const [start, end] = range.split(/\s*[-–—]\s*/).map(normalizeNamedSize);
      const order = ['XS', 'Small', 'Medium', 'Large', 'XL', '2X', '3X', '4X', '5X', '6X', '7X', '8X', '9X'];
      const first = order.indexOf(start);
      const last = order.indexOf(end);
      if (first >= 0 && last >= first) sizes.push(...order.slice(first, last + 1));
      return ' ';
    });
    remaining = remaining.replace(/\b(?:xs|s|m|l|xl|[1-9]x)\s*\/\s*(?:xs|s|m|l|xl|[1-9]x)\b/gi, (pair) => {
      sizes.push(...pair.split(/\s*\/\s*/).map(normalizeNamedSize).filter(Boolean));
      return ' ';
    });
    if (numeric) {
      remaining = remaining.replace(/\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\b/g, (_match, start, end) => {
        sizes.push(...expandNumericRange(start, end));
        return ' ';
      });
      for (const match of remaining.matchAll(/\b\d{1,2}\b/g)) {
        const tail = remaining.slice(match.index + match[0].length);
        if (!/^\s*(?:["”']|x\b)/i.test(tail)) sizes.push(match[0]);
      }
    }
    for (const match of remaining.matchAll(/\b(?:extra\s+small|extra\s+large|small|medium|large|xs|xl|[1-9]x)\b/gi)) {
      const phrase = match[0].replace(/^extra\s+small$/i, 'XS').replace(/^extra\s+large$/i, 'XL');
      const normalized = normalizeNamedSize(phrase);
      if (normalized) sizes.push(normalized);
    }
  }

  return sortSizeOptions(sizes);
};

export const extractSweaterSizes = (source) => extractWearableSizes(source);

export const extractClothingSizes = (source) => extractWearableSizes(source);

export const extractShoeSizes = (source) => {
  const sizes = [];
  for (const clause of sizeClauses(source)) {
    for (const match of clause.matchAll(/\b\d{1,2}(?:\.5)?\b/g)) {
      const tail = clause.slice(match.index + match[0].length);
      if (!/^\s*(?:["”']|x\b)/i.test(tail)) sizes.push(match[0]);
    }
  }
  return [...new Set(sizes)];
};

export const extractBeltSizes = (source) => extractWearableSizes(source);
