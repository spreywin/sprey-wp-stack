(() => {
  const root = document.documentElement;
  const themes = ['auto', 'light', 'dark'];
  const themeLabels = { auto: 'Theme: Auto', light: 'Theme: Light', dark: 'Theme: Dark' };
  const themeIcons = {
    auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 20h6M12 16v4"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/></svg>',
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.4A8.5 8.5 0 0 1 9.6 3.5 8.5 8.5 0 1 0 20.5 14.4Z"/></svg>'
  };

  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/svg+xml';
    favicon.href = new URL('favicon.svg', document.currentScript?.src || window.location.href).href;
    document.head.appendChild(favicon);
  }

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
      themeButton.className = 'tool-control theme-control';
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

  const gtranslateTheme = document.createElement('style');
  gtranslateTheme.dataset.spreyGtranslateTheme = '';
  gtranslateTheme.textContent = `
    .gt_white_content {
      background-color: #ffffff !important;
      color: #263142 !important;
    }
    .gt_white_content .gt_languages,
    .gt_white_content .gt_languages a,
    .gt_white_content .gt_languages span,
    .gt_white_content .gt_languages div,
    .gt_white_content .gt_languages td,
    .gt_white_content .gt_languages li {
      color: #263142 !important;
      text-shadow: none !important;
    }
    html[data-theme='dark'] .gt_white_content {
      background-color: #07110b !important;
      color: #f3f7f5 !important;
    }
    html[data-theme='dark'] .gt_white_content .gt_languages,
    html[data-theme='dark'] .gt_white_content .gt_languages a,
    html[data-theme='dark'] .gt_white_content .gt_languages span,
    html[data-theme='dark'] .gt_white_content .gt_languages div,
    html[data-theme='dark'] .gt_white_content .gt_languages td,
    html[data-theme='dark'] .gt_white_content .gt_languages li {
      color: #f3f7f5 !important;
      border-color: #20352a !important;
      text-shadow: none !important;
    }
    html[data-theme='dark'] .gt_white_content .gt_languages a:hover,
    html[data-theme='dark'] .gt_white_content .gt_languages a:focus {
      color: #84cc16 !important;
    }
    @media (prefers-color-scheme: dark) {
      html:not([data-theme]) .gt_white_content {
        background-color: #07110b !important;
        color: #f3f7f5 !important;
      }
      html:not([data-theme]) .gt_white_content .gt_languages,
      html:not([data-theme]) .gt_white_content .gt_languages a,
      html:not([data-theme]) .gt_white_content .gt_languages span,
      html:not([data-theme]) .gt_white_content .gt_languages div,
      html:not([data-theme]) .gt_white_content .gt_languages td,
      html:not([data-theme]) .gt_white_content .gt_languages li {
        color: #f3f7f5 !important;
        border-color: #20352a !important;
      }
    }
  `;
  document.head.appendChild(gtranslateTheme);

  function applyTheme(theme) {
    const selected = themes.includes(theme) ? theme : 'auto';
    if (selected === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', selected);
    localStorage.setItem('sprey-theme', selected);

    if (themeButton) {
      themeButton.innerHTML = themeIcons[selected];
      themeButton.dataset.theme = selected;
      themeButton.setAttribute('aria-label', themeLabels[selected]);
      themeButton.title = themeLabels[selected];
    }
  }

  applyTheme(localStorage.getItem('sprey-theme') || 'auto');

  themeButton?.addEventListener('click', () => {
    const current = themeButton.dataset.theme || 'auto';
    applyTheme(themes[(themes.indexOf(current) + 1) % themes.length]);
  });

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    } catch {}
  });

  window.gtranslateSettings = {
    default_language: 'en',
    native_language_names: true,
    wrapper_selector: '.gtranslate_wrapper',
    flag_size: 24,
    flag_style: '3d'
  };

  if (translateWrapper && !document.querySelector('script[data-sprey-gtranslate]')) {
    const script = document.createElement('script');
    script.src = 'https://cdn.gtranslate.net/widgets/latest/popup.js';
    script.defer = true;
    script.dataset.spreyGtranslate = '';
    document.head.appendChild(script);
  }

  const scrollToTop = document.createElement('button');
  scrollToTop.type = 'button';
  scrollToTop.className = 'scroll-to-top';
  scrollToTop.setAttribute('aria-label', 'Scroll to top');
  scrollToTop.title = 'Back to top';
  scrollToTop.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';
  document.body.appendChild(scrollToTop);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const updateScrollToTop = () => {
    scrollToTop.classList.toggle('is-visible', window.scrollY > 420);
  };

  scrollToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  });

  window.addEventListener('scroll', updateScrollToTop, { passive: true });
  updateScrollToTop();

})();
