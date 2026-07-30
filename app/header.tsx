import { BrandLogo } from "./brand-logo";
import { Icon } from "./icons";
import { whatsappUrl } from "@/lib/business";
import {
  localeNames,
  locales,
  type Locale,
  type Messages,
} from "@/lib/i18n";

type HeaderProps = {
  locale: Locale;
  messages: Messages;
};

export function Header({ locale, messages }: HeaderProps) {
  const navItems = [
    [messages.navigation.home, "#ballina"],
    [messages.navigation.about, "#rreth-hixhames"],
    [messages.navigation.benefits, "#perfitimet"],
    [messages.navigation.process, "#si-realizohet"],
    [messages.navigation.questions, "#pyetje"],
    [messages.navigation.contact, "#kontakt"],
  ] as const;
  const bookingUrl = whatsappUrl(messages.common.whatsappMessage);

  return (
    <header className="site-header" data-site-header>
      <div className="nav-shell">
        <a
          className="brand"
          href={`/${locale}/#ballina`}
          aria-label={messages.common.brandLabel}
        >
          <BrandLogo className="brand-logo brand-logo-full" />
          <BrandLogo className="brand-logo-compact" compact />
        </a>

        <nav className="desktop-nav" aria-label={messages.common.mainNavigation}>
          {navItems.map(([label, hash]) => (
            <a
              href={`/${locale}/${hash}`}
              data-nav-link={hash}
              key={hash}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <a
            className="button header-cta"
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {messages.common.bookAppointment}
          </a>

          <LanguageDropdown
            locale={locale}
            label={messages.common.chooseLanguage}
          />

          <button
            className="theme-toggle"
            type="button"
            data-theme-toggle
            data-dark-label={messages.common.activateDark}
            data-light-label={messages.common.activateLight}
            aria-label={messages.common.activateDark}
            aria-pressed="false"
            title={messages.common.themeTitle}
          >
            <span className="theme-toggle-track" aria-hidden="true">
              <span className="theme-icon theme-icon-sun">
                <Icon name="sun" size={13} strokeWidth={1.8} />
              </span>
              <span className="theme-icon theme-icon-moon">
                <Icon name="moon" size={13} strokeWidth={1.8} />
              </span>
              <span className="theme-toggle-thumb" />
            </span>
          </button>

          <button
            className="menu-toggle"
            type="button"
            data-menu-toggle
            data-open-label={messages.common.openMenu}
            data-close-label={messages.common.closeMenu}
            aria-label={messages.common.openMenu}
            aria-expanded="false"
            aria-controls="mobile-menu"
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <nav
        className="mobile-nav"
        id="mobile-menu"
        data-mobile-nav
        aria-label={messages.common.mobileNavigation}
        hidden
      >
        {navItems.map(([label, hash]) => (
          <a href={`/${locale}/${hash}`} key={hash}>
            {label}
          </a>
        ))}

        <div
          className="mobile-language"
          aria-label={messages.common.chooseLanguage}
        >
          <span>{messages.common.chooseLanguage}</span>
          <div className="mobile-language-grid">
            {locales.map((option) => (
              <a
                href={`/${option}/`}
                hrefLang={option}
                lang={option}
                data-locale-link={option}
                aria-current={option === locale ? "page" : undefined}
                key={option}
              >
                {localeNames[option]}
              </a>
            ))}
          </div>
        </div>

        <a
          className="button"
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="calendar" size={18} />{" "}
          {messages.common.bookAppointment}
        </a>
      </nav>

      <script dangerouslySetInnerHTML={{ __html: headerScript }} />
    </header>
  );
}

function LanguageDropdown({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  return (
    <div className="language-selector desktop-language" data-language-selector>
      <button
        className="language-trigger"
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded="false"
        aria-controls="language-menu-desktop"
        data-language-trigger
      >
        <span>{locale.toUpperCase()}</span>
        <Icon name="chevron" size={14} strokeWidth={1.8} />
      </button>
      <div
        className="language-menu"
        id="language-menu-desktop"
        role="menu"
        aria-label={label}
        data-language-menu
        hidden
      >
        {locales.map((option) => (
          <a
            href={`/${option}/`}
            hrefLang={option}
            lang={option}
            role="menuitemradio"
            aria-checked={option === locale}
            data-locale-link={option}
            key={option}
          >
            <span>{localeNames[option]}</span>
            <span aria-hidden="true">{option.toUpperCase()}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

const headerScript = `
(() => {
  const root = document.documentElement;
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const applyTheme = (theme, persist = false) => {
    const dark = theme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    root.style.colorScheme = dark ? 'dark' : 'light';
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(dark));
      themeToggle.setAttribute(
        'aria-label',
        dark ? themeToggle.dataset.lightLabel : themeToggle.dataset.darkLabel,
      );
    }
    if (persist) {
      try {
        localStorage.setItem('hixhame-tina-theme', dark ? 'dark' : 'light');
      } catch {}
    }
  };
  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light');
  themeToggle?.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  window.addEventListener('storage', (event) => {
    if (event.key === 'hixhame-tina-theme') {
      applyTheme(event.newValue === 'dark' ? 'dark' : 'light');
    }
  });

  const header = document.querySelector('[data-site-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  if (!header || !menuToggle || !mobileNav) return;

  const setMenuOpen = (open, restoreFocus = false) => {
    menuToggle.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute(
      'aria-label',
      open ? menuToggle.dataset.closeLabel : menuToggle.dataset.openLabel,
    );
    mobileNav.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    if (!open && restoreFocus) menuToggle.focus({ preventScroll: true });
  };
  menuToggle.addEventListener('click', () => setMenuOpen(mobileNav.hidden));
  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileNav.hidden) setMenuOpen(false, true);
  });

  const selectors = Array.from(document.querySelectorAll('[data-language-selector]'));
  const closeLanguageMenus = (except) => {
    selectors.forEach((selector) => {
      if (selector === except) return;
      const trigger = selector.querySelector('[data-language-trigger]');
      const menu = selector.querySelector('[data-language-menu]');
      if (!trigger || !menu) return;
      trigger.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
    });
  };

  selectors.forEach((selector) => {
    const trigger = selector.querySelector('[data-language-trigger]');
    const menu = selector.querySelector('[data-language-menu]');
    const items = Array.from(menu?.querySelectorAll('[data-locale-link]') || []);
    if (!trigger || !menu) return;

    const setOpen = (open, focusItem = false) => {
      closeLanguageMenus(open ? selector : undefined);
      trigger.setAttribute('aria-expanded', String(open));
      menu.hidden = !open;
      if (open && focusItem) items[0]?.focus();
    };

    trigger.addEventListener('click', () => setOpen(menu.hidden));
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true, true);
      }
    });
    menu.addEventListener('keydown', (event) => {
      const index = items.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.focus();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const next = (index + direction + items.length) % items.length;
        items[next]?.focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        items[event.key === 'Home' ? 0 : items.length - 1]?.focus();
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openSelector = selectors.find((selector) => {
      const trigger = selector.querySelector('[data-language-trigger]');
      return trigger?.getAttribute('aria-expanded') === 'true';
    });
    if (!openSelector) return;
    event.preventDefault();
    const trigger = openSelector.querySelector('[data-language-trigger]');
    closeLanguageMenus();
    trigger?.focus();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-language-selector]')) {
      closeLanguageMenus();
    }
  });

  document.querySelectorAll('[data-locale-link]').forEach((link) => {
    link.addEventListener('click', () => {
      const locale = link.dataset.localeLink;
      if (!locale) return;
      document.cookie =
        'ht_locale=' + locale +
        '; Path=/; Max-Age=31536000; SameSite=Lax' +
        (location.protocol === 'https:' ? '; Secure' : '');
      const active = document.querySelector(
        '[data-nav-link][aria-current="page"]',
      );
      const section = location.hash || active?.dataset.navLink || '';
      link.href = '/' + locale + '/' + section;
    });
  });

  const links = Array.from(document.querySelectorAll('[data-nav-link]'));
  const activate = (hash) => links.forEach((link) => {
    const active = link.dataset.navLink === hash;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  activate(location.hash || '#ballina');
  const sections = links
    .map((link) => document.querySelector(link.dataset.navLink))
    .filter(Boolean);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) activate('#' + visible[0].target.id);
    }, {
      rootMargin: '-22% 0px -66% 0px',
      threshold: [0.04, 0.2, 0.45],
    });
    sections.forEach((section) => observer.observe(section));
  }
  window.addEventListener('hashchange', () => {
    activate(location.hash || '#ballina');
  });
})();
`;
