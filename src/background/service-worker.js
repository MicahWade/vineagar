// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log('Vinegar extension installed.');
  
  // Initialize default storage if needed
  chrome.storage.sync.get(['blocked_companies'], (result) => {
    if (!result.blocked_companies) {
      // Default to blocking the major ones defined in our initial data
      chrome.storage.sync.set({
        blocked_companies: ['nestle', 'unilever', 'pepsico']
      });
    }
  });
});
