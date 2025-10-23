// src/lib/ep.ts
// Custom phone number parser and formatter for dialer input
// Implements YA (parse) and dL (format) as described in your requirements

// YA: Parses input, detects country, returns formatted value and detection info
export function YA(inputValue: string, currentValue: string, countryIsoCode: string) {
  // Remove all non-digit except +
  let clean = inputValue.replace(/[^\d+]/g, "");
  let shouldUpdateCountry = false;
  let detectedCountry = "";
  let isInternational = false;

  // Detect if input starts with + (international)
  if (clean.startsWith("+")) {
    isInternational = true;
    // Try to detect country code (basic, for demo)
    // Example: +1, +44, +91, etc.
    const match = clean.match(/^(\+\d{1,4})/);
    if (match) {
      detectedCountry = match[1].replace("+", "");
      shouldUpdateCountry = true;
    }
  }

  // Remove leading + for formatting
  let formattedValue = clean;
  if (clean.startsWith("+")) {
    formattedValue = clean;
  } else if (countryIsoCode) {
    formattedValue = "+" + countryIsoCode + clean;
  }

  return {
    formattedValue,
    shouldUpdateCountry,
    detectedCountry,
    isInternational,
  };
}

// dL: Formats a raw number for display (groups, spacing, etc.)
export function dL(rawNumber: string, countryIsoCode: string) {
  // Remove all non-digit except +
  let clean = rawNumber.replace(/[^\d+]/g, "");
  // Basic grouping for demo: +1 (XXX) XXX-XXXX
  if (clean.startsWith("+1") && clean.length > 2) {
    return clean.replace(/(\+1)(\d{3})(\d{3})(\d{0,4})/, (m, c, a, b, d) => `${c} (${a}) ${b}${d ? "-" + d : ""}`);
  }
  // Fallback: just return clean
  return clean;
}
