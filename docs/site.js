(() => {
  const root = document.documentElement;
  const themes = ['auto', 'light', 'dark'];
  const languageOptions = [
    ['en', 'English'], ['ru', 'Русский'], ['kk', 'Қазақша'], ['de', 'Deutsch'],
    ['es', 'Español'], ['fr', 'Français'], ['pt', 'Português'], ['tr', 'Türkçe'],
    ['zh-CN', '简体中文'], ['ja', '日本語'], ['ko', '한국어'], ['ar', 'العربية']
  ];

  let themeButton = document.querySelector('[data-theme-toggle]');
  let translateSelect = document.querySelector('[data-translate]');

  if ((!themeButton || !translateSelect) && document.querySelector('.site-header')) {
    let tools = document.querySelector('.header-tools');
    if (!tools) {
      tools = document.createElement('div');
      tools.className = 'header-tools';
      document.querySelector('.site-header').appendChild(tools);
    }

    if (!themeButton) {
      themeButton = document.createElement('button');
      themeButton.type = 'button';
      themeButton.className = 'tool-control';
      themeButton.dataset.themeToggle = '';
      themeButton.dataset.theme = 'auto';
      tools.appendChild(themeButton);
    }

    if (!translateSelect) {
      translateSelect = document.createElement('select');
      translateSelect.className = 'tool-control';
      translateSelect.dataset.translate = '';
      translateSelect.setAttribute('aria-label', 'Translate page');
      for (const [value, label] of languageOptions) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        translateSelect.appendChild(option);
      }
      tools.appendChild(translateSelect);
    }
  }

  function applyTheme(theme) {
    const selected = themes.includes(theme) ? theme : 'auto';
    if (selected === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', selected);
    localStorage.setItem('sprey-theme', selected);

    if (themeButton) {
      const labels = { auto: 'Theme: Auto', light: 'Theme: Light', dark: 'Theme: Dark' };
      themeButton.textContent = labels[selected];
      themeButton.dataset.theme = selected;
    }
  }

  applyTheme(localStorage.getItem('sprey-theme') || 'auto');

  themeButton?.addEventListener('click', () => {
    const current = themeButton.dataset.theme || 'auto';
    applyTheme(themes[(themes.indexOf(current) + 1) % themes.length]);
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
