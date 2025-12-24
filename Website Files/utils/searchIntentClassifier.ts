/**
 * Search Intent Classification Utility
 * Categorizes user search queries by intent to understand customer behavior
 */

export type SearchIntent =
  | "research"
  | "comparison"
  | "price_checking"
  | "specific_product";

export interface IntentResult {
  intent: SearchIntent;
  confidence: "high" | "medium" | "low";
  keywords: string[];
}

/**
 * Classifies search query intent using pattern matching
 */
export function classifySearchIntent(query: string): IntentResult {
  const normalizedQuery = query.toLowerCase().trim();

  // Research intent - users learning/researching
  const researchPatterns = [
    /\b(best|top|recommend|review|guide|how to|what is|should i|worth it|good|comparison guide)\b/,
    /\b(vs\s+)?which\b/,
    /\b(better|fastest|most powerful|quietest|coolest)\b/,
    /\b(benchmark|performance|specs|specifications|features)\b/,
    /\b(explained|tutorial|beginner|for gaming|for streaming)\b/,
  ];

  // Comparison intent - comparing products
  const comparisonPatterns = [
    /\b(\w+)\s+(vs|versus|or)\s+(\w+)/i, // "3070 vs 3080" or "AMD or Intel"
    /\b(compare|comparison|difference between)\b/,
    /\b(better|worse)\s+(than)\b/,
  ];

  // Price checking intent - budget/price focused
  const pricePatterns = [
    /\b(cheap|budget|affordable|inexpensive|economical|value)\b/,
    /\b(price|cost|how much|under|less than|\$|£|€)\b/,
    /\b(deal|discount|sale|clearance|bargain)\b/,
    /\b(low cost|low price|price range)\b/,
  ];

  // Specific product intent - looking for exact product
  const specificPatterns = [
    /\b(rtx|gtx|rx)\s*\d{4}/i, // GPU model numbers
    /\b(ryzen|core|threadripper|xeon)\s+\d/i, // CPU model numbers
    /\b(ti|super|xt|oc|gaming x|strix|tuf|ftw|aorus)\b/i, // Product variants
    /\b(\d+gb|\d+tb)\b/i, // Specific capacities
    /\b(ddr\d|gen\d|pcie\s*\d)\b/i, // Technical specs
  ];

  const matchedKeywords: string[] = [];
  let intent: SearchIntent = "specific_product"; // Default
  let confidence: "high" | "medium" | "low" = "low";

  // Check for comparison (high priority)
  for (const pattern of comparisonPatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      intent = "comparison";
      confidence = "high";
      matchedKeywords.push(match[0]);
      return { intent, confidence, keywords: matchedKeywords };
    }
  }

  // Check for price checking
  let priceMatches = 0;
  for (const pattern of pricePatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      priceMatches++;
      matchedKeywords.push(match[0]);
    }
  }

  if (priceMatches > 0) {
    intent = "price_checking";
    confidence = priceMatches >= 2 ? "high" : "medium";
  }

  // Check for research
  let researchMatches = 0;
  for (const pattern of researchPatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      researchMatches++;
      if (!matchedKeywords.includes(match[0])) {
        matchedKeywords.push(match[0]);
      }
    }
  }

  if (researchMatches > 0 && researchMatches > priceMatches) {
    intent = "research";
    confidence = researchMatches >= 2 ? "high" : "medium";
  }

  // Check for specific product patterns
  let specificMatches = 0;
  for (const pattern of specificPatterns) {
    const match = normalizedQuery.match(pattern);
    if (match) {
      specificMatches++;
      if (!matchedKeywords.includes(match[0])) {
        matchedKeywords.push(match[0]);
      }
    }
  }

  // If we have specific product indicators and no strong other intent
  if (specificMatches > 0 && confidence !== "high") {
    // If query has model numbers but also research/price keywords, keep mixed intent
    if (researchMatches === 0 && priceMatches === 0) {
      intent = "specific_product";
      confidence = specificMatches >= 2 ? "high" : "medium";
    } else if (specificMatches >= 2) {
      // Strong specific product indicators override weak other signals
      intent = "specific_product";
      confidence = "medium";
    }
  }

  // If no patterns matched, it's likely a specific product search
  if (matchedKeywords.length === 0) {
    intent = "specific_product";
    confidence = "low";
    // Extract potential product terms (words with numbers or technical terms)
    const productTerms = normalizedQuery.match(/\b\w*\d+\w*\b/g);
    if (productTerms) {
      matchedKeywords.push(...productTerms.slice(0, 2));
    }
  }

  return { intent, confidence, keywords: matchedKeywords };
}

/**
 * Get human-readable label for intent
 */
export function getIntentLabel(intent: SearchIntent): string {
  const labels: Record<SearchIntent, string> = {
    research: "Research",
    comparison: "Comparison",
    price_checking: "Price Checking",
    specific_product: "Specific Product",
  };
  return labels[intent];
}

/**
 * Get color scheme for intent badge
 */
export function getIntentColor(intent: SearchIntent): {
  bg: string;
  border: string;
  text: string;
} {
  const colors: Record<
    SearchIntent,
    { bg: string; border: string; text: string }
  > = {
    research: {
      bg: "bg-blue-500/20",
      border: "border-blue-500/40",
      text: "text-blue-400",
    },
    comparison: {
      bg: "bg-purple-500/20",
      border: "border-purple-500/40",
      text: "text-purple-400",
    },
    price_checking: {
      bg: "bg-amber-500/20",
      border: "border-amber-500/40",
      text: "text-amber-400",
    },
    specific_product: {
      bg: "bg-green-500/20",
      border: "border-green-500/40",
      text: "text-green-400",
    },
  };
  return colors[intent];
}
