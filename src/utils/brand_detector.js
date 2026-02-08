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
    console.groupCollapsed(`Vinegar Debug: Checking "${text.substring(0, 20)}..."`);
    
    // Iterate through all companies in the database
    for (const [key, company] of Object.entries(this.companies)) {
      if (blockedIds && !blockedIds.includes(company.id)) {
        continue;
      }

      // Check specific brands owned by the company
      for (const brand of company.brands) {
        const cleanBrand = brand.toLowerCase().trim();
        
        // Log "pepsi" vs "pepsi soda pop..."
        // console.log(`Comparing "${cleanBrand}" against text...`);

        if (lowerText.includes(cleanBrand)) {
             console.log(`> Potential match found: "${cleanBrand}" in text.`);
             
             const regex = new RegExp(`(^|\\s|\\W)${cleanBrand}($|\\s|\\W)`, 'i');
             if (regex.test(lowerText)) {
                console.log(`>> CONFIRMED match via Regex!`);
                console.groupEnd();
                return {
                    matchedBrand: brand,
                    parentCompany: company
                };
             } else {
                console.log(`>> Regex failed for "${cleanBrand}". (Boundary issue?)`);
             }
        }
      }
    }
    console.log("No match found.");
    console.groupEnd();
    return null;
  }
}

// Expose to window for the content script to use
window.BrandDetector = BrandDetector;
