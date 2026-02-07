(async function() {
  console.log('Vinegar: Content script loaded.');

  const detector = new window.BrandDetector();
  await detector.init();

  // Load user settings
  const settings = await chrome.storage.sync.get(['blocked_companies']);
  // Default to all if not set, or handle empty case. 
  // For MVP, if undefined, we assume we want to block the demo ones (nestle, unilever).
  const blockedIds = settings.blocked_companies || ['nestle', 'unilever', 'pepsico'];

  function getProductTitle() {
    let title = '';
    const host = window.location.hostname;

    if (host.includes('amazon')) {
      const el = document.getElementById('productTitle');
      if (el) title = el.innerText.trim();
    } else if (host.includes('walmart')) {
      const el = document.querySelector('h1[itemprop="name"]'); // Heuristic
      if (el) title = el.innerText.trim();
    } else if (host.includes('target')) {
      const el = document.querySelector('[data-test="product-title"]');
      if (el) title = el.innerText.trim();
    }
    
    // Fallback: Meta title
    if (!title) {
      title = document.title;
    }

    return title;
  }

  function injectOverlay(matchData, productName) {
    if (document.getElementById('vinegar-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'vinegar-overlay';
    
    const parentName = matchData.parentCompany.name;
    const reason = matchData.parentCompany.reason;

    overlay.innerHTML = `
      <span class="vinegar-close">&times;</span>
      <h3>⚠️ Warning: ${parentName}</h3>
      <p>
        The product <strong>"${matchData.matchedBrand}"</strong> is owned by <strong>${parentName}</strong>.
        <br><br>
        <em>Reason: ${reason}</em>
      </p>
      <a href="https://www.google.com/search?q=${encodeURIComponent(productName + ' ethical alternative')}" target="_blank" class="vinegar-btn">
        Find Ethical Alternatives
      </a>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('.vinegar-close').addEventListener('click', () => {
      overlay.remove();
    });
  }

  // Run detection
  const productTitle = getProductTitle();
  if (productTitle) {
    console.log(`Vinegar: Scanning product "${productTitle}"...`);
    const match = detector.check(productTitle, blockedIds);
    
    if (match) {
      console.log('Vinegar: Match found!', match);
      injectOverlay(match, productTitle);
    } else {
      console.log('Vinegar: No blocked brands detected.');
    }
  }

})();
