/** Trim and lower-case a string, for case-insensitive comparisons. */
export const norm = (value: string): string => value.trim().toLowerCase();

/** Upper-case the first character of a string. */
export const capitalize = (text: string): string =>
  text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);

/** Join phrases with commas and a trailing "and": "a, b and c". */
export const joinList = (items: readonly string[]): string =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
