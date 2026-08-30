(() => {
  const root = document.documentElement;
  const themes = ['auto', 'light', 'dark'];

  if (!document.querySelector('link[data-sprey-header-style]')) {
    const headerStyle = document.createElement('link');
    headerStyle.rel = 'stylesheet';
    headerStyle.href = new URL('header.css?v=static-header-icons', document.currentScript?.src || window.location.href).href;
    headerStyle.dataset.spreyHeaderStyle = '';
    document.head.appendChild(headerStyle);
  }

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

  let socialLinks = document.querySelector('.social-links');
  if (!socialLinks && document.querySelector('.site-header')) {
    socialLinks = document.createElement('div');
    socialLinks.className = 'social-links';
    socialLinks.setAttribute('aria-label', 'Sprey social links');
    socialLinks.innerHTML = `
      <a class="social-icon" href="https://github.com/spreywin" aria-label="Sprey on GitHub" title="Sprey on GitHub">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.22c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.05 0 0 .97-.31 3.16 1.18A10.94 10.94 0 0 1 12 6.13c.98 0 1.95.13 2.86.39 2.2-1.49 3.16-1.18 3.16-1.18.63 1.58.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.4-2.71 5.38-5.29 5.67.42.36.79 1.08.79 2.18v3.22c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z"/></svg>
      </a>
      <a class="social-icon" href="https://x.com/SpreyWin" aria-label="Sprey on X" title="Sprey on X">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>
      </a>
      <a class="social-icon" href="https://t.me/SpreyWin" aria-label="Sprey on Telegram" title="Sprey on Telegram">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.944 2.506 18.77 21.49c-.239 1.34-.862 1.667-1.748 1.038l-4.833-3.564-2.333 2.244c-.258.258-.474.474-.973.474l.347-4.925 8.965-8.1c.39-.347-.085-.54-.605-.193L6.51 15.441l-4.77-1.492c-1.038-.324-1.057-1.038.216-1.536L20.603 5.23c.865-.324 1.622.193 1.341 1.276Z"/></svg>
      </a>`;
    const tools = document.querySelector('.header-tools');
    tools?.insertBefore(socialLinks, themeButton || translateWrapper || null);
  }

  const footer = document.querySelector('footer');
  if (footer && socialLinks && !footer.querySelector('.footer-social-links')) {
    const footerSocialLinks = socialLinks.cloneNode(true);
    footerSocialLinks.classList.add('footer-social-links');
    footer.appendChild(footerSocialLinks);
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
      const labels = { auto: 'Theme: Auto', light: 'Theme: Light', dark: 'Theme: Dark' };
      const icons = {
        auto: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
        light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/></svg>',
        dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>'
      };
      themeButton.innerHTML = icons[selected];
      themeButton.classList.add('theme-icon-button');
      themeButton.setAttribute('aria-label', labels[selected]);
      themeButton.title = labels[selected];
      themeButton.dataset.theme = selected;
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
