/**
 * Format category names from Contentful IDs to human-readable format
 * Converts camelCase or slug-case to Title Case with proper spacing
 */
export function formatCategory(category: string | undefined): string {
  if (!category) return "Other";

  // Handle common category mappings
  const categoryMap: Record<string, string> = {
    caseFans: "Case Fans",
    casefans: "Case Fans",
    case_fans: "Case Fans",
    cpu: "CPU",
    gpu: "GPU",
    psu: "PSU",
    ram: "RAM",
    ssd: "SSD",
    hdd: "HDD",
    motherboard: "Motherboard",
    storage: "Storage",
    cooling: "Cooling",
    case: "Case",
    monitor: "Monitor",
    keyboard: "Keyboard",
    mouse: "Mouse",
    headset: "Headset",
    speakers: "Speakers",
    webcam: "Webcam",
    other: "Other",
  };

  const lowerCategory = category.toLowerCase();

  // Check if we have a direct mapping
  if (categoryMap[lowerCategory]) {
    return categoryMap[lowerCategory];
  }

  // Convert camelCase to Title Case
  const withSpaces = category
    // Insert space before capital letters
    .replace(/([A-Z])/g, " $1")
    // Replace underscores and hyphens with spaces
    .replace(/[_-]/g, " ")
    // Trim and clean up multiple spaces
    .trim()
    .replace(/\s+/g, " ");

  // Capitalize first letter of each word
  return withSpaces
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
