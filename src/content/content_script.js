(async function() {
  console.log('Vinegar: Content script loaded.');

  const detector = new window.BrandDetector();
  await detector.init();

  // Load user settings
  const settings = await chrome.storage.sync.get(['blocked_companies']);
  const blockedIds = settings.blocked_companies || ['nestle', 'unilever', 'pepsico'];

  let scanAttempts = 0;
  let overlayInjected = false;

  function getProductTitle() {
    let title = '';
    const host = window.location.hostname;

    if (host.includes('amazon')) {
      const el = document.getElementById('productTitle');
      if (el) title = el.innerText.trim();
    } else if (host.includes('walmart')) {
      // Walmart selectors are tricky and change often. Try multiple.
      const el = document.querySelector('h1[itemprop="name"]') || 
                 document.querySelector('h1#main-title') ||
                 document.querySelector('[data-testid="product-title"]'); 
      if (el) title = el.innerText.trim();
    } else if (host.includes('target')) {
      const el = document.querySelector('[data-test="product-title"]');
      if (el) title = el.innerText.trim();
    }
    
    // Fallback: Check document title if specific element not found
    if (!title && document.title) {
      // Walmart titles often end with " - Walmart.com"
      title = document.title.replace(' - Walmart.com', '');
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
    overlayInjected = true;

    overlay.querySelector('.vinegar-close').addEventListener('click', () => {
      overlay.remove();
      // Prevent re-injection for this session
      overlayInjected = true; 
    });
  }

  function runScan() {
    if (overlayInjected) return; // Don't keep scanning if we found it

    const productTitle = getProductTitle();
    if (productTitle) {
      // console.log(`Vinegar: Scanning "${productTitle}"...`); // Noise reduction
      const match = detector.check(productTitle, blockedIds);
      
      if (match) {
        console.log('Vinegar: Match found!', match);
        injectOverlay(match, productTitle);
      }
    }
  }

  // 1. Run immediately
  runScan();

  // 2. Run on mutations (for SPAs like Walmart/Target)
  const observer = new MutationObserver((mutations) => {
    // Throttling: only scan if something significant changed
    // For now, just running scan is cheap enough text lookup
    runScan();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 3. Safety fallback: Run once a second for 5 seconds to catch slow loads
  const interval = setInterval(() => {
    scanAttempts++;
    runScan();
    if (scanAttempts > 10 || overlayInjected) clearInterval(interval);
  }, 1000);

})();
