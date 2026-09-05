const CATEGORY_KEYWORDS: { category: string; keywords: string[] }[] = [
  { category: 'Cabinet Painting', keywords: ['cabinet', 'kitchen'] },
  { category: 'Wallpaper & Faux Finishes', keywords: ['wallpaper'] },
  { category: 'Restoration', keywords: ['staircase', 'restoration', 'antique', 'furniture'] },
  { category: 'Interior Painting', keywords: [] }, // fallback, checked last
]

export function inferCategory(altText: string): string {
  const lower = altText.toLowerCase()
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category
    }
  }
  return 'Interior Painting'
}
