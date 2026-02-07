# Vinegar - Browser Extension Technical Specification

## 1. Concept Overview
"Vinegar" is a browser extension designed to empower ethical consumerism. It acts as an "anti-monopoly" tool, detecting products owned by blocked parent companies (conglomerates) and suggesting alternatives from independent or ethically aligned sources. It also redirects users from major marketplaces (like Amazon) to independent retailers.

## 2. Architecture (Manifest V3)

The extension uses the **Manifest V3** standard.

*   **Manifest (`manifest.json`):** Defines permissions (`storage`, `activeTab`, `scripting`), host permissions (for matching product pages), and entry points.
*   **Service Worker (`background.js`):** Handles installation events, updates data definitions from a remote source (future state), and manages context menu interactions.
*   **Content Scripts (`content_script.js`):** Runs on specific shopping domains (e.g., amazon.com, walmart.com) and generic pages to scan for brand names. Injects the UI overlay.
*   **Popup (`popup.html`/`popup.js`):** User interface for configuration (toggling "Movements").
*   **Data Layer:** JSON files stored locally (bundled) or in `chrome.storage.local` for dynamic updates.

## 3. Data Structure

### 3.1 Parent Company Database (`companies.json`)
A hierarchical map linking parent companies to their brands.

```json
{
  "companies": {
    "Nestle": {
      "id": "nestle",
      "categories": ["food", "beverage", "petcare"],
      "brands": [
        "DiGiorno",
        "San Pellegrino",
        "Toll House",
        "Nespresso",
        "KitKat",
        "Purina"
      ],
      "reason": "Water usage controversies, labor practices"
    },
    "Unilever": {
      "id": "unilever",
      "brands": ["Dove", "Ben & Jerry's", "Hellmann's"]
    }
  }
}
```

### 3.2 User Settings (Storage)
Persisted in `chrome.storage.sync`.

```json
{
  "blocked_companies": ["nestle", "unilever"],
  "movements": {
    "support_local": true,
    "avoid_fast_fashion": true
  }
}
```

## 4. Core Logic Flows

### 4.1 Brand Detection (The "Corporate Web" Filter)
1.  **Trigger:** Page load on supported URL.
2.  **Extraction:** Content script parses the Product Title (e.g., `#productTitle` on Amazon) or Brand Metadata (structured data `application/ld+json`).
3.  **Normalization:** Text is tokenized and matched against the loaded `companies.json` index.
4.  **Action:** If a match is found AND the parent company is in the user's block list, trigger the **Overlay**.

### 4.2 The "Amazon Alternative" Logic
1.  **Trigger:** User is on a product page of a massive retailer (Amazon).
2.  **Search:** Extract the specific product name/model.
3.  **Resolution:**
    *   *Primary:* Check against a whitelist of "Ethical Alternatives" (mapped by category).
    *   *Secondary:* Construct a search query for independent engines (e.g., searching DuckDuckGo with site filters or specific independent store queries).
    *   *Note:* Direct scraping of other retailers is brittle. The MVP uses "Search Link Generation" to redirect the user to a search result for that product on an independent platform (e.g., Bookshop.org for books).

## 5. UI/UX
*   **Popup:** Simple toggle switches for "Avoid [Company]" and specific movements.
*   **Overlay:** A non-intrusive floating pill in the bottom-right or injected near the "Buy Now" button.
    *   *State A (Warning):* "⚠️ This product is owned by [Parent Company]."
    *   *State B (Alternative):* "🌱 Find this on [Independent Store]."

## 6. File Structure
```text
/vinegar
  /icons
    icon16.png
    icon48.png
    icon128.png
  /data
    companies.json
  /src
    /background
      service-worker.js
    /content
      content_script.js
      scanner.js
      ui_injector.js
      styles.css
    /popup
      popup.html
      popup.js
      popup.css
    /utils
      storage.js
  manifest.json
```
