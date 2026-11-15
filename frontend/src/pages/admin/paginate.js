// slice a list into pages of `size` (pages count from 1)
export function paginate(list, page, size) {
  const pageCount = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pageCount);
  const from = (current - 1) * size;
  return { items: list.slice(from, from + size), page: current, pageCount, from: from + 1, to: from + Math.min(size, list.length - from) };
}
