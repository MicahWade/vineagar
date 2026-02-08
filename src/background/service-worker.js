// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('Vinegar extension installed.');
  
  // Initialize default storage if needed
  chrome.storage.sync.get(['blocked_companies'], (result) => {
    if (chrome.runtime.lastError) {
      console.warn("Vinegar: Storage access error:", chrome.runtime.lastError);
      return;
    }
    
    // Check if result exists and if blocked_companies is missing
    if (result && !result.blocked_companies) {
      // Default to blocking the major ones defined in our initial data
      chrome.storage.sync.set({
        blocked_companies: ['nestle', 'unilever', 'pepsico']
      });
    }
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "MATCH_FOUND") {
    chrome.action.setBadgeText({
      text: message.text,
      tabId: sender.tab.id
    });
    chrome.action.setBadgeBackgroundColor({
      color: "#d32f2f",
      tabId: sender.tab.id
    });
  }
});
