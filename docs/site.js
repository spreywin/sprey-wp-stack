(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('[data-theme-toggle]');
  const translateSelect = document.querySelector('[data-translate]');
  const themes = ['auto', 'light', 'dark'];

  function applyTheme(theme) {
    const selected = themes.includes(theme) ? theme : 'auto';
    if (selected === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', selected);
    }
    localStorage.setItem('sprey-theme', selected);
    if (themeButton) {
      const labels = { auto: 'Theme: Auto', light: 'Theme: Light', dark: 'Theme: Dark' };
      themeButton.textContent = labels[selected];
      themeButton.dataset.theme = selected;
    }
  }

  const savedTheme = localStorage.getItem('sprey-theme') || 'auto';
  applyTheme(savedTheme);

  themeButton?.addEventListener('click', () => {
    const current = themeButton.dataset.theme || 'auto';
    const next = themes[(themes.indexOf(current) + 1) % themes.length];
    applyTheme(next);
  });

  translateSelect?.addEventListener('change', () => {
    const language = translateSelect.value;
    if (!language || language === 'en') return;
    const url = new URL('https://translate.google.com/translate');
    url.searchParams.set('sl', 'en');
    url.searchParams.set('tl', language);
    url.searchParams.set('u', window.location.href);
    window.location.href = url.toString();
  });
})();
