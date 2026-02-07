document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('toggles');
  
  // Load Company Data
  const response = await fetch(chrome.runtime.getURL('data/companies.json'));
  const data = await response.json();
  const companies = data.companies;

  // Load User Settings
  const settings = await chrome.storage.sync.get(['blocked_companies']);
  let blocked = settings.blocked_companies || Object.keys(companies); // Default block all if fresh

  Object.values(companies).forEach(company => {
    const div = document.createElement('div');
    div.className = 'toggle-group';
    
    const isChecked = blocked.includes(company.id);

    div.innerHTML = `
      <label>
        <span>Avoid ${company.name}</span>
        <input type="checkbox" data-id="${company.id}" ${isChecked ? 'checked' : ''}>
      </label>
    `;
    container.appendChild(div);
  });

  // Event Delegation for saving
  container.addEventListener('change', (e) => {
    if (e.target.tagName === 'INPUT') {
      const inputs = container.querySelectorAll('input');
      const newBlocked = [];
      inputs.forEach(input => {
        if (input.checked) {
          newBlocked.push(input.getAttribute('data-id'));
        }
      });
      chrome.storage.sync.set({ 'blocked_companies': newBlocked });
    }
  });
});
