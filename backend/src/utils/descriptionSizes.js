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

export const extractSweaterSizes = (description) => {
  const text = String(description || '');
  const clauses = [...text.matchAll(/\b(?:size|sizes|fits?|available)\b[^.!?]{0,140}/gi)]
    .map((match) => match[0]);
  if (!clauses.length) return [];

  const sizes = [];
  for (const clause of clauses) {
    let remaining = clause;
    remaining = remaining.replace(/\b([1-9])\s*x\s*[-–—]\s*([1-9])\s*x\b/gi, (_match, start, end) => {
      sizes.push(...expandXRange(start, end));
      return ' ';
    });
    remaining = remaining.replace(/\b(\d{1,2})\s*[-–—]\s*(\d{1,2})\b/g, (_match, start, end) => {
      sizes.push(...expandNumericRange(start, end));
      return ' ';
    });
    for (const match of remaining.matchAll(/\b(?:extra\s+small|extra\s+large|small|medium|large|xs|xl|[1-9]x)\b/gi)) {
      const phrase = match[0].replace(/^extra\s+small$/i, 'XS').replace(/^extra\s+large$/i, 'XL');
      const normalized = normalizeNamedSize(phrase);
      if (normalized) sizes.push(normalized);
    }
  }

  return sortSizeOptions(sizes);
};
