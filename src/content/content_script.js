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
                 document.querySelector('[data-testid="product-title"]') ||
                 document.querySelector('h1'); // Generic Fallback
      if (el) title = el.innerText.trim();
    } else if (host.includes('target')) {
      const el = document.querySelector('[data-test="product-title"]');
      if (el) title = el.innerText.trim();
    }
    
    // Fallback: Check document title
    if (!title && document.title) {
      title = document.title.replace(' - Walmart.com', '');
    }

    return title;
  }

  // DEBUG: Visual confirmation that the script is running
  function showDebugToast(text, status) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '10px';
    toast.style.left = '10px';
    toast.style.background = status === 'match' ? '#d32f2f' : 'rgba(0,0,0,0.8)';
    toast.style.color = 'white';
    toast.style.padding = '8px 12px';
    toast.style.fontSize = '12px';
    toast.style.borderRadius = '4px';
    toast.style.zIndex = '1000000';
    toast.style.pointerEvents = 'none';
    toast.style.fontFamily = 'sans-serif';
    
    let message = `Vinegar Scanned: "${text.substring(0, 15)}..."`;
    if (status === 'match') message += " (⚠️ MATCH)";
    else if (status === 'safe') message += ` (✅ Safe | Active: ${blockedIds.length})`;
    else if (status === 'loading') message += " (⏳ Loading...)";
    
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  function runScan() {
    if (overlayInjected) return; 

    const productTitle = getProductTitle();
    if (productTitle) {
      if (!detector.isLoaded) {
        showDebugToast(productTitle, 'loading');
        return;
      }

      const match = detector.check(productTitle, blockedIds);
      
      if (match) {
        console.log('Vinegar: Match found!', match);
        showDebugToast(productTitle, 'match');
        injectOverlay(match, productTitle);
      } else {
        // Only show "Safe" toast if we actually have a title but found nothing
        // This helps debug if it's a regex fail
        showDebugToast(productTitle, 'safe');
      }
    }
  }

  // 1. Run immediately
  // Retry a few times to wait for data load
  let retries = 0;
  const initInterval = setInterval(() => {
    if (detector.isLoaded) {
      runScan();
      clearInterval(initInterval);
    } else {
      retries++;
      if (retries > 10) clearInterval(initInterval); // Give up after 2s
    }
  }, 200);

  // 2. Run on mutations (for SPAs like Walmart/Target)
  let debounceTimer;
  const observer = new MutationObserver((mutations) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      runScan();
    }, 1500); // Only scan once the page stops changing for 1.5 seconds
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
