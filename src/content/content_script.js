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

  function injectOverlay(matchData, productName) {
    // Check if it already exists (in the main DOM)
    if (document.getElementById('vinegar-shadow-host')) return;

    // Create a host element for the shadow DOM
    const host = document.createElement('div');
    host.id = 'vinegar-shadow-host';
    host.style.position = 'fixed';
    host.style.top = '110px'; // Top right (below standard headers)
    host.style.right = '30px';
    host.style.zIndex = '2147483647'; // Max Z-Index
    host.style.width = '340px';
    host.style.height = 'auto';
    host.style.fontFamily = 'sans-serif';
    host.style.pointerEvents = 'auto'; // Ensure clicks work
    
    // Create Shadow Root
    const shadow = host.attachShadow({ mode: 'open' });

    const parentName = matchData.parentCompany.name;
    const reason = matchData.parentCompany.reason;

    // We define styles INSIDE the shadow DOM so they are self-contained
    const style = document.createElement('style');
    style.textContent = `
      .card {
        background-color: #fff;
        border: 1px solid #dcdcdc;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        border-radius: 12px;
        padding: 20px;
        color: #333;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        animation: slideIn 0.3s ease-out;
        position: relative;
      }
      h3 {
        margin: 0 0 10px 0;
        font-size: 18px;
        color: #d32f2f;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      p {
        margin: 0 0 15px 0;
        font-size: 14px;
        line-height: 1.5;
        color: #444;
      }
      .btn {
        display: block;
        background-color: #2e7d32;
        color: white;
        padding: 10px 16px;
        border-radius: 6px;
        text-decoration: none;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        transition: background 0.2s;
      }
      .btn:hover { background-color: #1b5e20; }
      .close {
        cursor: pointer;
        color: #999;
        font-size: 24px;
        border: none;
        background: none;
        padding: 0;
        line-height: 1;
        position: absolute;
        top: 15px;
        right: 15px;
      }
      @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>
        <span>⚠️ Warning: ${parentName}</span>
      </h3>
      <button class="close">&times;</button>
      <p>
        The product <strong>"${matchData.matchedBrand}"</strong> is owned by <strong>${parentName}</strong>.
        <br><br>
        <em>${reason}</em>
      </p>
      <a href="https://www.google.com/search?q=${encodeURIComponent(productName + ' ethical alternative')}" target="_blank" class="btn">
        Find Ethical Alternatives
      </a>
    `;

    shadow.appendChild(style);
    shadow.appendChild(card);
    document.body.appendChild(host);
    
    overlayInjected = true;

    // Handle Close
    shadow.querySelector('.close').addEventListener('click', () => {
      host.remove();
      // Keep overlayInjected = true so it doesn't pop back up immediately
    });
  }

  function isSearchPage() {
    const url = window.location.href;
    const path = window.location.pathname;
    
    // Amazon: /s?k=...
    if (path.includes('/s') && url.includes('k=')) return true;
    
    // Walmart: /search?q=... or /search
    if (path.includes('/search')) return true;

    // Target: /s?searchTerm=...
    if (path === '/s') return true;
    
    return false;
  }

  function runScan() {
    if (overlayInjected) return;
    if (isSearchPage()) return; // Skip scanning on search results

    const productTitle = getProductTitle();
    if (productTitle) {
      if (!detector.isLoaded) {
        // showDebugToast(productTitle, 'loading');
        return;
      }

      const match = detector.check(productTitle, blockedIds);
      
      if (match) {
        console.log('Vinegar: Match found!', match);
        // showDebugToast(productTitle, 'match');
        injectOverlay(match, productTitle);
        
        // Notify background script to update icon
        chrome.runtime.sendMessage({ 
            type: "MATCH_FOUND", 
            text: "!" 
        });
      } else {
        // Only show "Safe" toast if we actually have a title but found nothing
        // showDebugToast(productTitle, 'safe');
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
