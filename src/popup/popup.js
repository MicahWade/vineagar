document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('toggles');
  container.innerHTML = 'Loading...';
  
  try {
    // Load Company Data
    let response;
    try {
      response = await fetch(chrome.runtime.getURL('data/companies.json'));
    } catch (e) {
      console.warn('getURL fetch failed, trying relative path...');
      response = await fetch('../../data/companies.json');
    }
    
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    
    const data = await response.json();
    const companies = data.companies;

    // Load User Settings
    const settings = await chrome.storage.sync.get(['blocked_companies']);
    // Default to all company IDs if none are stored
    const blocked = settings.blocked_companies || Object.keys(companies);

    container.innerHTML = ''; // Clear loading

    Object.values(companies).forEach(company => {
      const div = document.createElement('div');
      div.className = 'toggle-group';
      
      const isChecked = blocked.includes(company.id);

      // Using the "switch" class structure for the CSS toggle
      div.innerHTML = `
        <span>${company.name}</span>
        <label class="switch">
          <input type="checkbox" data-id="${company.id}" ${isChecked ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
      `;
      container.appendChild(div);
    });

    // Event Delegation for saving
    container.addEventListener('change', async (e) => {
      if (e.target.tagName === 'INPUT') {
        const inputs = container.querySelectorAll('input');
        const newBlocked = [];
        inputs.forEach(input => {
          if (input.checked) {
            newBlocked.push(input.getAttribute('data-id'));
          }
        });
        
        await chrome.storage.sync.set({ 'blocked_companies': newBlocked });
        
        // Show Toast
        const toast = document.getElementById('toast');
        toast.className = "show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 2000);
      }
    });

  } catch (error) {
    console.error('Vinegar Popup Error:', error);
    container.innerHTML = `<p style="color:red">Error loading data:<br>${error.message}</p>`;
  }
});
