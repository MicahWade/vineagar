/**
 * brand_detector.js
 * Core logic for loading brand data and matching text against it.
 */

class BrandDetector {
  constructor() {
    this.companies = null;
    this.isLoaded = false;
  }

  /**
   * Loads the company database from the extension's local data file.
   */
  async init() {
    if (this.isLoaded) return;
    try {
      const url = chrome.runtime.getURL('data/companies.json');
      const response = await fetch(url);
      const data = await response.json();
      this.companies = data.companies;
      this.isLoaded = true;
      console.log('Vinegar: Brand database loaded.');
    } catch (error) {
      console.error('Vinegar: Failed to load brand database.', error);
    }
  }

  /**
   * Checks if a given product title or brand string belongs to a blocked entity.
   * @param {string} text - The product title or brand name found on the page.
   * @param {Array<string>} blockedIds - List of company IDs the user wants to avoid.
   * @returns {Object|null} - The matching company object or null.
   */
  check(text, blockedIds) {
    if (!this.isLoaded || !text) return null;

    const lowerText = text.toLowerCase();
    
    // Iterate through all companies in the database
    for (const [key, company] of Object.entries(this.companies)) {
      // If the user hasn't blocked this company, skip it
      // (If blockedIds is empty/null, we assume all defined companies are flagged for now,
      // or we strict check. Let's assume strict check against user preferences).
      if (blockedIds && !blockedIds.includes(company.id)) {
        continue;
      }

      // Check specific brands owned by the company
      for (const brand of company.brands) {
        // Simple inclusion check. In production, this needs regex for word boundaries
        // to avoid partial matches (e.g. "grape" matching "ape").
        // Using a regex with word boundaries for better accuracy:
        const regex = new RegExp(`\b${brand}\b`, 'i');
        if (regex.test(lowerText)) {
          return {
            matchedBrand: brand,
            parentCompany: company
          };
        }
      }
    }
    return null;
  }
}

// Expose to window for the content script to use
window.BrandDetector = BrandDetector;
