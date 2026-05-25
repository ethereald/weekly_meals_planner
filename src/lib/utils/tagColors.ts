export const TAG_COLORS = [
  '#DC2626', // red-600
  '#059669', // emerald-600
  '#D97706', // amber-600
  '#7C3AED', // violet-600
  '#DB2777', // pink-600
  '#0891B2', // cyan-600
  '#CA8A04', // yellow-600
  '#1D4ED8', // blue-700
  '#047857', // emerald-700
  '#B91C1C', // red-700
  '#7C2D12', // orange-800
  '#6B21A8', // purple-800
];

/** Hash-based color for a tag name. Same name always produces the same color. */
export function hashTagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

/**
 * Returns the display color for a single tag.
 * Uses stored DB color when available, otherwise falls back to hash-based.
 */
export function getTagDisplayColor(tagName: string, storedColor?: string | null): string {
  if (storedColor) return storedColor;
  return hashTagColor(tagName);
}

/**
 * Resolves display colors for a list of tags so that tags sharing the same
 * stored color get redistributed to distinct colors (best-effort).
 * Returns a Map of tag id → display color.
 */
export function resolveTagDisplayColors(
  tagList: Array<{ id: string; name: string; color: string }>
): Map<string, string> {
  const colorMap = new Map<string, string>();
  const colorUsage = new Map<string, number>();
  tagList.forEach(t => colorUsage.set(t.color, (colorUsage.get(t.color) || 0) + 1));
  const usedColors = new Set<string>();

  // First pass: tags with a unique stored color keep it
  tagList.forEach(tag => {
    if ((colorUsage.get(tag.color) || 0) === 1) {
      colorMap.set(tag.id, tag.color);
      usedColors.add(tag.color);
    }
  });

  // Second pass: tags sharing a stored color get redistributed
  tagList.forEach(tag => {
    if ((colorUsage.get(tag.color) || 0) > 1 && !colorMap.has(tag.id)) {
      const hashColor = hashTagColor(tag.name);
      const assignedColor = usedColors.has(hashColor)
        ? (TAG_COLORS.find(c => !usedColors.has(c)) ?? hashColor)
        : hashColor;
      colorMap.set(tag.id, assignedColor);
      usedColors.add(assignedColor);
    }
  });

  return colorMap;
}

/**
 * Same as resolveTagDisplayColors but keyed by tag name instead of id.
 * Useful when you only have the name available (e.g. new unsaved tags in TagInput).
 */
export function resolveTagDisplayColorsByName(
  tagList: Array<{ id: string; name: string; color: string }>
): Map<string, string> {
  const idMap = resolveTagDisplayColors(tagList);
  const nameMap = new Map<string, string>();
  tagList.forEach(tag => {
    const color = idMap.get(tag.id);
    if (color) nameMap.set(tag.name, color);
  });
  return nameMap;
}
