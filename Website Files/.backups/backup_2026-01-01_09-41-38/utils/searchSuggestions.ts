/**
 * Smart Search Suggestions Generator
 * AI-powered fuzzy matching, synonym expansion, and product recommendations
 */

export interface SearchSuggestion {
  type: "typo" | "synonym" | "related" | "alternative";
  original: string;
  suggestion: string;
  confidence: number; // 0-1
  reason: string;
}

// Common PC component synonyms and variants
const SYNONYM_MAP: Record<string, string[]> = {
  // Graphics Cards
  gpu: ["graphics card", "video card", "graphics processor"],
  "graphics card": ["gpu", "video card", "gfx card"],
  "video card": ["gpu", "graphics card", "gfx card"],
  gfx: ["graphics card", "gpu", "video card"],

  // Processors
  cpu: ["processor", "central processing unit"],
  processor: ["cpu", "central processing unit"],

  // Memory
  ram: ["memory", "system memory", "dram"],
  memory: ["ram", "system memory"],

  // Storage
  ssd: ["solid state drive", "nvme", "m.2"],
  hdd: ["hard drive", "hard disk"],
  "hard drive": ["hdd", "storage"],
  storage: ["ssd", "hdd", "drive"],

  // Motherboard
  mobo: ["motherboard", "mainboard"],
  motherboard: ["mobo", "mainboard"],

  // Power Supply
  psu: ["power supply", "power supply unit"],
  "power supply": ["psu", "power supply unit"],

  // Cooling
  cooler: ["cooling", "cpu cooler", "heatsink"],
  cooling: ["cooler", "fan"],

  // Case
  case: ["chassis", "tower", "enclosure"],
  chassis: ["case", "tower"],

  // Brands (common misspellings)
  nvidia: ["nVidia", "n-vidia"],
  amd: ["AMD", "advanced micro devices"],
  intel: ["Intel", "intel"],
  asus: ["ASUS", "Asus"],
  msi: ["MSI", "Msi"],
  gigabyte: ["Gigabyte", "giga-byte"],
  corsair: ["Corsair", "corsaire"],
};

// Common GPU model patterns and corrections
const GPU_PATTERNS: Record<string, string> = {
  // NVIDIA RTX series
  "rtx 4009": "rtx 4090",
  "rtx 409": "rtx 4090",
  "rtx 4900": "rtx 4090",
  "rtx 4080": "rtx 4080",
  "rtx 4070": "rtx 4070",
  "rtx 4060": "rtx 4060",
  "rtx 3090": "rtx 3090",
  "rtx 3080": "rtx 3080",
  "rtx 3070": "rtx 3070",
  "rtx 3060": "rtx 3060",

  // AMD RX series
  "rx 7900": "rx 7900 xt",
  "rx 7800": "rx 7800 xt",
  "rx 7700": "rx 7700 xt",
  "rx 6900": "rx 6900 xt",
  "rx 6800": "rx 6800 xt",
  "rx 6700": "rx 6700 xt",
};

// Common CPU model patterns
const CPU_PATTERNS: Record<string, string> = {
  // Intel
  "i9 14900": "i9-14900k",
  "i7 14700": "i7-14700k",
  "i5 14600": "i5-14600k",
  "i9 13900": "i9-13900k",
  "i7 13700": "i7-13700k",
  "i5 13600": "i5-13600k",

  // AMD
  "ryzen 9 7950": "ryzen 9 7950x",
  "ryzen 7 7800": "ryzen 7 7800x3d",
  "ryzen 5 7600": "ryzen 5 7600x",
  "ryzen 9 5950": "ryzen 9 5950x",
  "ryzen 7 5800": "ryzen 7 5800x3d",
};

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching typos
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score (0-1) between two strings
 */
function similarityScore(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

/**
 * Check if query matches known typo patterns
 */
function checkTypoPatterns(query: string): SearchSuggestion | null {
  const lowerQuery = query.toLowerCase().trim();

  // Check GPU patterns
  for (const [typo, correct] of Object.entries(GPU_PATTERNS)) {
    if (lowerQuery.includes(typo)) {
      return {
        type: "typo",
        original: query,
        suggestion: query.toLowerCase().replace(typo, correct),
        confidence: 0.95,
        reason: `Common typo detected: "${typo}" → "${correct}"`,
      };
    }
  }

  // Check CPU patterns
  for (const [typo, correct] of Object.entries(CPU_PATTERNS)) {
    if (lowerQuery.includes(typo)) {
      return {
        type: "typo",
        original: query,
        suggestion: query.toLowerCase().replace(typo, correct),
        confidence: 0.9,
        reason: `Common typo detected: "${typo}" → "${correct}"`,
      };
    }
  }

  return null;
}

/**
 * Find synonym expansions for query
 */
function findSynonyms(query: string): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase().trim();
  const words = lowerQuery.split(/\s+/);

  for (const word of words) {
    const synonyms = SYNONYM_MAP[word];
    if (synonyms) {
      for (const synonym of synonyms) {
        const newQuery = lowerQuery.replace(word, synonym);
        if (newQuery !== lowerQuery) {
          suggestions.push({
            type: "synonym",
            original: query,
            suggestion: newQuery,
            confidence: 0.85,
            reason: `"${word}" can also be "${synonym}"`,
          });
        }
      }
    }
  }

  return suggestions;
}

/**
 * Find similar terms using fuzzy matching
 */
function findFuzzyMatches(
  query: string,
  knownTerms: string[]
): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase().trim();

  for (const term of knownTerms) {
    const similarity = similarityScore(lowerQuery, term.toLowerCase());

    // Only suggest if similarity is high enough (>70%) but not exact match
    if (similarity > 0.7 && similarity < 0.99) {
      suggestions.push({
        type: "typo",
        original: query,
        suggestion: term,
        confidence: similarity,
        reason: `Similar to "${term}" (${Math.round(similarity * 100)}% match)`,
      });
    }
  }

  // Sort by confidence
  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
}

/**
 * Generate alternative search suggestions
 */
function generateAlternatives(
  query: string,
  _category?: string
): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase().trim();

  // If searching for specific model, suggest broader category
  if (/\d{4}/.test(lowerQuery)) {
    // Contains 4-digit number (like model numbers)
    let broadCategory = "components";

    if (lowerQuery.includes("rtx") || lowerQuery.includes("rx")) {
      broadCategory = "graphics cards";
    } else if (
      lowerQuery.includes("ryzen") ||
      lowerQuery.includes("i9") ||
      lowerQuery.includes("i7") ||
      lowerQuery.includes("i5")
    ) {
      broadCategory = "processors";
    }

    suggestions.push({
      type: "alternative",
      original: query,
      suggestion: broadCategory,
      confidence: 0.7,
      reason: `Try browsing all ${broadCategory} instead`,
    });
  }

  // If query is very specific, suggest removing brand/model
  const words = lowerQuery.split(/\s+/);
  if (words.length > 2) {
    // Remove first word (often brand)
    suggestions.push({
      type: "alternative",
      original: query,
      suggestion: words.slice(1).join(" "),
      confidence: 0.65,
      reason: "Try a more general search",
    });
  }

  return suggestions;
}

/**
 * Generate product recommendations based on query intent
 */
function generateProductRecommendations(query: string): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = [];
  const lowerQuery = query.toLowerCase().trim();

  // Budget GPU recommendations
  if (
    (lowerQuery.includes("cheap") || lowerQuery.includes("budget")) &&
    (lowerQuery.includes("gpu") || lowerQuery.includes("graphics"))
  ) {
    suggestions.push({
      type: "related",
      original: query,
      suggestion: "RTX 4060",
      confidence: 0.8,
      reason: "Popular budget GPU option",
    });
    suggestions.push({
      type: "related",
      original: query,
      suggestion: "RX 7600",
      confidence: 0.8,
      reason: "Alternative budget GPU",
    });
  }

  // High-end GPU recommendations
  if (
    (lowerQuery.includes("best") ||
      lowerQuery.includes("high") ||
      lowerQuery.includes("top")) &&
    (lowerQuery.includes("gpu") || lowerQuery.includes("graphics"))
  ) {
    suggestions.push({
      type: "related",
      original: query,
      suggestion: "RTX 4090",
      confidence: 0.85,
      reason: "Top-tier gaming GPU",
    });
    suggestions.push({
      type: "related",
      original: query,
      suggestion: "RTX 4080",
      confidence: 0.8,
      reason: "High-end alternative",
    });
  }

  // Gaming CPU recommendations
  if (
    (lowerQuery.includes("gaming") || lowerQuery.includes("game")) &&
    (lowerQuery.includes("cpu") || lowerQuery.includes("processor"))
  ) {
    suggestions.push({
      type: "related",
      original: query,
      suggestion: "Ryzen 7 7800X3D",
      confidence: 0.85,
      reason: "Best gaming CPU (AMD)",
    });
    suggestions.push({
      type: "related",
      original: query,
      suggestion: "Intel i7-14700K",
      confidence: 0.8,
      reason: "Top gaming CPU (Intel)",
    });
  }

  return suggestions;
}

/**
 * Main function: Generate smart suggestions for a search query
 * @param query - The original search query
 * @param category - Optional category context
 * @param knownTerms - Optional list of known product names for fuzzy matching
 */
export function generateSearchSuggestions(
  query: string,
  category?: string,
  knownTerms?: string[]
): SearchSuggestion[] {
  const allSuggestions: SearchSuggestion[] = [];

  // 1. Check for known typo patterns (highest priority)
  const typoSuggestion = checkTypoPatterns(query);
  if (typoSuggestion) {
    allSuggestions.push(typoSuggestion);
  }

  // 2. Find synonym expansions
  const synonymSuggestions = findSynonyms(query);
  allSuggestions.push(...synonymSuggestions);

  // 3. Fuzzy matching against known terms (if provided)
  if (knownTerms && knownTerms.length > 0) {
    const fuzzySuggestions = findFuzzyMatches(query, knownTerms);
    allSuggestions.push(...fuzzySuggestions);
  }

  // 4. Generate alternative searches
  const alternatives = generateAlternatives(query, category);
  allSuggestions.push(...alternatives);

  // 5. Product recommendations
  const recommendations = generateProductRecommendations(query);
  allSuggestions.push(...recommendations);

  // Remove duplicates and sort by confidence
  const uniqueSuggestions = Array.from(
    new Map(allSuggestions.map((s) => [s.suggestion.toLowerCase(), s])).values()
  );

  return uniqueSuggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Return top 5 suggestions
}

/**
 * Format suggestion for display
 */
export function formatSuggestion(suggestion: SearchSuggestion): string {
  switch (suggestion.type) {
    case "typo":
      return `Did you mean "${suggestion.suggestion}"?`;
    case "synonym":
      return `Try searching for "${suggestion.suggestion}"`;
    case "related":
      return `Consider: ${suggestion.suggestion}`;
    case "alternative":
      return `Browse ${suggestion.suggestion}`;
    default:
      return suggestion.suggestion;
  }
}

/**
 * Get suggestion icon/color based on type
 */
export function getSuggestionStyle(type: SearchSuggestion["type"]): {
  color: string;
  icon: string;
} {
  switch (type) {
    case "typo":
      return { color: "text-amber-400", icon: "✏️" };
    case "synonym":
      return { color: "text-blue-400", icon: "🔄" };
    case "related":
      return { color: "text-green-400", icon: "💡" };
    case "alternative":
      return { color: "text-purple-400", icon: "🔍" };
    default:
      return { color: "text-gray-400", icon: "💭" };
  }
}
