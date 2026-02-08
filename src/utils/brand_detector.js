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
        // robust matching: normalize both to lowercase
        const cleanBrand = brand.toLowerCase().trim();
        
        // MVP: Simple inclusion check (e.g. does "Pepsi Soda" contain "pepsi")
        // This is safer than regex for now to avoid boundary issues with punctuation
        if (lowerText.includes(cleanBrand)) {
             // specific check to avoid "grape" matching "ape"
             // only match if surrounded by space or start/end of string
             const regex = new RegExp(`(^|\s|\W)${cleanBrand}($|\s|\W)`, 'i');
             if (regex.test(lowerText)) {
                return {
                    matchedBrand: brand,
                    parentCompany: company
                };
             }
        }
      }
    }
    return null;
  }
}

// Expose to window for the content script to use
window.BrandDetector = BrandDetector;
