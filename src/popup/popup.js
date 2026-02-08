document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('toggles');
  container.innerHTML = 'Loading...';
  
  try {
    // Load Company Data
    const dataUrl = chrome.runtime.getURL('data/companies.json');
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error('Failed to fetch companies.json');
    
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

      div.innerHTML = `
        <label style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; cursor: pointer;">
          <span>Avoid ${company.name}</span>
          <input type="checkbox" data-id="${company.id}" ${isChecked ? 'checked' : ''}>
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
        
        // Brief visual feedback
        const note = document.querySelector('.note');
        const originalText = note.innerText;
        note.innerText = '✅ Settings saved!';
        note.style.color = 'green';
        setTimeout(() => {
          note.innerText = originalText;
          note.style.color = '#666';
        }, 1500);
      }
    });

  } catch (error) {
    console.error('Vinegar Popup Error:', error);
    container.innerHTML = '<p style="color:red">Error loading brand data.</p>';
  }
});
