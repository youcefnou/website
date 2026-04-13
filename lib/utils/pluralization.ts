/**
 * Utility functions for pluralization in French
 */

/**
 * Pluralize French word "article"
 * @param count - Number of items
 * @returns "article" or "articles" based on count
 */
export function pluralizeArticles(count: number): string {
  return count > 1 ? 'articles' : 'article';
}

/**
 * Pluralize French word "modèle"
 * @param count - Number of models
 * @returns "modèle" or "modèles" based on count
 */
export function pluralizeModels(count: number): string {
  return count > 1 ? 'modèles' : 'modèle';
}

/**
 * Pluralize French word "variante"
 * @param count - Number of variants
 * @returns "variante" or "variantes" based on count
 */
export function pluralizeVariants(count: number): string {
  return count > 1 ? 'variantes' : 'variante';
}

/**
 * Format article count with proper pluralization
 * @param count - Number of articles
 * @returns Formatted string like "5 articles" or "1 article"
 */
export function formatArticleCount(count: number): string {
  return `${count} ${pluralizeArticles(count)}`;
}

/**
 * Format model count with proper pluralization
 * @param count - Number of models
 * @returns Formatted string like "3 modèles" or "1 modèle"
 */
export function formatModelCount(count: number): string {
  return `${count} ${pluralizeModels(count)}`;
}
