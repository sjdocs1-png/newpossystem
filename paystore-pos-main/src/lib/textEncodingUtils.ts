/**
 * Text encoding utilities to handle corrupted Unicode text
 */

/**
 * Detect if text appears to be corrupted (contains replacement characters or invalid sequences)
 */
export const isTextCorrupted = (text: string): boolean => {
  // Check for replacement character (common sign of encoding issues)
  if (text.includes('\ufffd')) return true;
  
  // Check for excessive non-ASCII control characters or invalid UTF-8 sequences
  const invalidCharCount = (text.match(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g) || []).length;
  if (invalidCharCount > text.length * 0.2) return true;
  
  // Check for mojibake-like patterns (too many special symbols for normal text)
  const specialCharCount = (text.match(/[◆♦◇♠♣•★✓✗℃℉¥€₹]/g) || []).length;
  if (specialCharCount > 2) return true;
  
  return false;
};

/**
 * Remove problematic special characters that break parsing
 */
export const removeSpecialChars = (text: string): string => {
  // Remove zero-width characters, BOM, and control characters
  return text
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // control chars
    .replace(/[\u202A-\u202E]/g, ''); // directional chars
};

/**
 * Attempt to detect and fix encoding issues in text
 * This is a best-effort attempt - may not always work perfectly
 */
export const attemptFixCorruptedText = (corruptedText: string): string => {
  if (!corruptedText || corruptedText.length === 0) {
    return corruptedText;
  }

  if (!isTextCorrupted(corruptedText)) {
    return corruptedText;
  }

  // If text looks like it was double-encoded or has mojibake patterns, try to normalize
  try {
    // Remove replacement characters and problematic chars
    let cleaned = corruptedText
      .replace(/\ufffd/g, '') // Remove replacement char
      .replace(/['']/g, "'") // Fix smart quotes
      .replace(/[""]/g, '"')
      .replace(/[–—]/g, '-') // Fix dashes
      .trim();
    
    // Remove zero-width and special chars
    cleaned = removeSpecialChars(cleaned);
    
    // Try to detect and fix common encoding mistakes
    try {
      const encoded = new TextEncoder().encode(cleaned);
      cleaned = new TextDecoder('utf-8', { fatal: false }).decode(encoded);
    } catch (e) {
      // If that fails, continue with the partially cleaned text
    }
    
    return cleaned;
  } catch (e) {
    console.error('Error fixing corrupted text:', e);
    return corruptedText;
  }
};

/**
 * Thoroughly clean a string for use as item name
 */
export const cleanItemName = (text: string): string => {
  // First attempt to fix corrupted encoding
  let cleaned = attemptFixCorruptedText(text);
  
  // Normalize whitespace
  cleaned = cleaned
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .trim();
  
  // Remove any remaining problematic characters
  cleaned = removeSpecialChars(cleaned);
  
  return cleaned;
};

/**
 * Check if a string contains non-ASCII characters (useful for detecting language changes)
 */
export const hasNonAscii = (text: string): boolean => {
  return /[^\x00-\x7F]/.test(text);
};

/**
 * Normalize whitespace and special characters in text
 */
export const normalizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remove zero-width characters
};
