(() => {
  const root = document.documentElement;
  const themes = ['auto', 'light', 'dark'];

  let themeButton = document.querySelector('[data-theme-toggle]');
  let translateWrapper = document.querySelector('.gtranslate_wrapper');

  if ((!themeButton || !translateWrapper) && document.querySelector('.site-header')) {
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

    if (!translateWrapper) {
      translateWrapper = document.createElement('div');
      translateWrapper.className = 'gtranslate_wrapper tool-control';
      translateWrapper.setAttribute('aria-label', 'Translate page');
      tools.appendChild(translateWrapper);
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

  window.gtranslateSettings = {
    default_language: 'en',
    native_language_names: true,
    wrapper_selector: '.gtranslate_wrapper',
    flag_style: '3d',
    switcher_text_color: '#f3f7f5',
    switcher_arrow_color: '#9caaa2',
    switcher_border_color: '#20352a',
    switcher_background_color: '#0d1812',
    switcher_background_shadow_color: '#07110b',
    switcher_background_hover_color: '#13251a',
    dropdown_text_color: '#eef5f0',
    dropdown_hover_color: '#1c3324',
    dropdown_background_color: '#0b140e'
  };

  if (translateWrapper && !document.querySelector('script[data-sprey-gtranslate]')) {
    const script = document.createElement('script');
    script.src = 'https://cdn.gtranslate.net/widgets/latest/dwf.js';
    script.defer = true;
    script.dataset.spreyGtranslate = '';
    document.head.appendChild(script);
  }
})();
