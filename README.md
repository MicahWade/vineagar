# Vinegar

> *"It's supposed to be almost the opposite of Honey... helping people traverse through that is kind of the idea of Vinegar."* — Luke Lafreniere

**Vinegar** is an open-source browser extension designed to transparency to online shopping. While other extensions help you find the cheapest price, Vinegar helps you find the **ethical price**.

It reveals the hidden parent companies behind consumer brands and offers local or independent alternatives to Amazon listings, allowing users to vote with their wallets based on the causes they care about.

##  The Mission

Most consumer goods are owned by a small handful of massive conglomerates. The illusion of choice makes it difficult to avoid companies you disagree with. Vinegar solves this by:

1. **De-mystifying Ownership:** Instantly showing you if that "indie" brand is actually owned by a giant you want to avoid (e.g., Nestlé, Unilever).
2. **Supporting Independents:** Redirecting traffic from major monopolies (like Amazon) to smaller, independent, or local retailers carrying the same SKU.
3. **Personalized Activism:** Recognizing that everyone has different battles. You toggle what you care about; we filter the rest.

##  Key Features

### 1. The "De-Amazonifier"

When viewing a product on Amazon, Vinegar scrapes the product title/SKU and searches for that exact item on a whitelist of independent retailers and local brick-and-mortar store inventories.

* *Status:* 🚧 In Development

### 2. Corporate Genealogy (The "Nestlé Toggle")

A community-maintained database maps thousands of subsidiary brands to their ultimate parent companies.

* **User Action:** Toggle "Avoid Nestlé" in settings.
* **Extension Action:** Warns you when viewing a Digiorno pizza or San Pellegrino water.

### 3. "Pick Your Battles" Dashboard

Not everyone boycotts the same things. Vinegar offers a modular settings page where you can toggle specific "Movements":

* 🚫 Anti-Monopoly
* 🌍 Environmental / Carbon Footprint
* 🏭 Anti-Fast Fashion
* 🏙️ Support Local Business

## 🛠️ Technical Overview

* **Manifest V3:** Built for modern Chrome/Firefox/Edge standards.
* **Privacy First:** No affiliate tracking. No user data harvesting. All processing happens client-side or via anonymous lookups.
* **Community Database:** The brand-to-parent mapping is a JSON-based open data project located in `/data/brand_map.json`. We need help filling this out!

## 🤝 Contributing

This project was pitched as a concept on **The WAN Show (Feb 2026)**. We need developers, data architects, and researchers to make it real.

### Areas where we need help:

* **Scrapers:** Logic to reliably find Amazon alternatives on Shopify/WooCommerce sites.
* **Data Entry:** Expanding the `brands.json` file to link subsidiaries to parent corps.
* **UI/UX:** Designing a non-intrusive overlay (The "Vinegar Label").

## 📜 License

[MIT](https://www.google.com/search?q=LICENSE) © 2026 Community Contributors.

*Note: This project is a fan-made initiative inspired by Luke Lafreniere's concept. It is not officially affiliated with LMG.*
