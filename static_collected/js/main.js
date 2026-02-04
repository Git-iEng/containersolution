/* ==========================================================
   landing-page-container-solution.js
   - Scroll reveal (replays on scroll up/down)
   - Optional: adjust initial hash scroll for fixed header
   - Optional: smooth scroll for [data-scroll-to] anchors
   ========================================================== */

/* ===== CONFIG ===== */
const SOLAR = {
  revealSelector: '.reveal-container-solution',
  inViewClass: 'in-view-container-solution',
  headerSelector: '.header',
  anchorSelector: '[data-scroll-to]'
};

/* ===== Helpers ===== */
function getHeaderOffset() {
  const header = document.querySelector(SOLAR.headerSelector);
  return header ? header.offsetHeight : 0;
}

function smoothScrollTo(targetSelector) {
  if (!targetSelector || !targetSelector.startsWith('#')) return;
  const target = document.querySelector(targetSelector);
  if (!target) return;

  const y = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();
  window.scrollTo({ top: y, behavior: 'smooth' });
}

/* ===== Scroll Reveal that re-triggers on leave ===== */
(function initScrollReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    document.querySelectorAll(SOLAR.revealSelector).forEach(el => el.classList.add(SOLAR.inViewClass));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        el.classList.add(SOLAR.inViewClass);
      } else {
        // Remove when leaving viewport so it can animate again on return
        el.classList.remove(SOLAR.inViewClass);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(SOLAR.revealSelector).forEach(el => io.observe(el));
})();

/* ===== Smooth in-page scrolling for elements with [data-scroll-to] ===== */
(function initSmoothAnchors() {
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest(SOLAR.anchorSelector);
    if (!trigger) return;

    const href = trigger.getAttribute('href');
    const dataTarget = trigger.getAttribute('data-target');
    const targetSelector = dataTarget || href;

    if (targetSelector && targetSelector.startsWith('#')) {
      e.preventDefault();
      smoothScrollTo(targetSelector);
    }
  });

  // If the page loads with a hash, fix initial position for fixed header
  window.addEventListener('load', () => {
    if (window.location.hash) {
      // Wait a tick so layout is ready
      setTimeout(() => smoothScrollTo(window.location.hash), 0);
    }
  });
})();

/* ==========================================================
   Logos pager (dots) + continuous marquee coexist (robust)
   ========================================================== */
(function initLogosPager() {
  const wrap = document.querySelector('.logos-wrap-container-solution');
  const track = document.getElementById('logos-track-container-solution');
  const dotsWrap = document.getElementById('dots-container-solution');
  if (!wrap || !track || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll('.dot-container-solution'));
  const RESUME_DELAY = 3500; // ms after click before continuous scroll resumes
  let resumeTimer = null;

  // set active dot helper
  function setActiveDot(idx) {
    dots.forEach((d, i) => d.classList.toggle('is-active-container-solution', i === idx));
  }
  setActiveDot(0);

  // compute page width (use visible viewport of the logos)
  function pageWidth() { return wrap.clientWidth; }

  // Fully disable CSS animation and let us control transform
  function enterManualMode() {
    track.classList.add('manual-container-solution');
    track.style.animationPlayState = 'paused';
  }

  // Resume CSS animation from the start smoothly
  function resumeContinuous() {
    // remove manual transform + class and restart animation cleanly
    track.style.transform = '';
    track.classList.remove('manual-container-solution');

    // Restart the CSS animation reliably (toggle to 'none' then back)
    const prevAnim = getComputedStyle(track).animation;
    track.style.animation = 'none';
    // force reflow
    // eslint-disable-next-line no-unused-expressions
    track.offsetHeight;
    // restore whatever animation was in CSS
    track.style.animation = prevAnim;
    track.style.animationPlayState = 'running';
  }

  // Jump to page n by translating the track
  function goToPage(n) {
    const idx = Math.max(0, Math.min(n, dots.length - 1));
    setActiveDot(idx);

    enterManualMode();

    const offset = -idx * pageWidth();
    track.style.transform = `translateX(${offset}px)`;

    // schedule resume
    window.clearTimeout(resumeTimer);
    resumeTimer = window.setTimeout(resumeContinuous, RESUME_DELAY);
  }

  // Click handlers on dots
  dots.forEach(d => {
    d.addEventListener('click', () => {
      const n = parseInt(d.getAttribute('data-page') || '0', 10);
      goToPage(n);
    });
  });

  // Maintain the same page on resize while paused
  const ro = new ResizeObserver(() => {
    const active = dots.findIndex(el => el.classList.contains('is-active-container-solution'));
    if (active > -1 && track.classList.contains('manual-container-solution')) {
      track.style.transform = `translateX(${-active * pageWidth()}px)`;
    }
  });
  ro.observe(wwrap = wrap); // observe container width changes

  // Also pause marquee on hover (optional, keeps prior UX)
  wrap.addEventListener('mouseenter', () => {
    if (!track.classList.contains('manual-container-solution')) {
      track.style.animationPlayState = 'paused';
    }
  });
  wrap.addEventListener('mouseleave', () => {
    if (!track.classList.contains('manual-container-solution')) {
      track.style.animationPlayState = 'running';
    }
  });
})();


/* ==========================================================
   Count-up animation for Impact stats
   ========================================================== */
(function initImpactCounters() {
  const items = document.querySelectorAll('.stat-value-container-solution-impact');
  if (!items.length) return;

  function countTo(el) {
    const end = parseFloat(el.getAttribute('data-count-to')) || 0;
    const prefix = el.getAttribute('data-prefix') || '';
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1400; // ms (slow & smooth)
    const startTime = performance.now();

    function tick(now) {
      const p = Math.min(1, (now - startTime) / duration);
      // easeOutCubic for a nice finish
      const eased = 1 - Math.pow(1 - p, 3);
      let val = end * eased;

      // If the end has decimals, keep one decimal, else integer
      const hasDecimal = String(end).includes('.');
      el.textContent = prefix + (hasDecimal ? val.toFixed(1) : Math.round(val)) + suffix;

      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + (hasDecimal ? end.toFixed(1) : Math.round(end)) + suffix;
    }
    requestAnimationFrame(tick);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        // start counting when visible
        countTo(el);
      } else {
        // reset so it can play again on re-enter
        el.textContent = (el.getAttribute('data-prefix') || '') + '0' + (el.getAttribute('data-suffix') || '');
      }
    });
  }, { threshold: 0.35 });

  items.forEach(el => {
    // initialize to 0 with prefix/suffix
    el.textContent = (el.getAttribute('data-prefix') || '') + '0' + (el.getAttribute('data-suffix') || '');
    io.observe(el);
  });
})();
/* ==========================================================
   Solutions: "View All Solutions" toggle
   ========================================================== */
(function initSolutionsToggle() {
  const grid = document.getElementById('solutions-grid-container-solution-solution');
  const btn = document.getElementById('solutions-toggle-btn-container-solution-solution');
  if (!grid || !btn) return;

  function setState(expanded) {
    grid.classList.toggle('is-collapsed-container-solution-solution', !expanded);
    btn.setAttribute('aria-expanded', String(expanded));
    btn.textContent = expanded ? 'View Fewer' : 'View LV Switchboards ';

    // Nudge IntersectionObserver so reveal animations can trigger for newly shown cards
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('scroll'));
    });
  }

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    setState(!expanded);
  });

  // default collapsed on load
  setState(false);
})();
/* ==========================================================
   Solar App: lightweight tilt/parallax for media cards
   Targets elements with [data-tilt]
   ========================================================== */
(function initSolarAppTilt() {
  const els = document.querySelectorAll('[data-tilt]');
  if (!els.length) return;

  const MAX_TILT = 8;         // degrees
  const MAX_TRANS = 10;       // px translate for parallax feel
  const EASE = 'cubic-bezier(.2,.65,.2,1)';

  function applyTilt(el, e) {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    const rotX = (+dy * MAX_TILT).toFixed(2);
    const rotY = (-dx * MAX_TILT).toFixed(2);
    const tx = (-dx * MAX_TRANS).toFixed(2);
    const ty = (-dy * MAX_TRANS).toFixed(2);

    el.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translate(${tx}px, ${ty}px)`;
    el.style.transition = 'transform .08s';
  }

  function resetTilt(el) {
    el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translate(0,0)';
    el.style.transition = `transform .5s ${EASE}`;
  }

  els.forEach(el => {
    el.addEventListener('pointermove', (e) => applyTilt(el, e));
    el.addEventListener('pointerleave', () => resetTilt(el));
    el.addEventListener('pointerdown', () => resetTilt(el)); // prevent sticky tilt on touch
  });
})();


/* ==========================================================
   Projects carousel: arrows scroll by one full "page"
   ========================================================== */
(function initProjectsCarousel() {
  const viewport = document.getElementById('projects-viewport-container-solution-projects');
  const prevBtn = document.querySelector('.prev-container-solution-projects');
  const nextBtn = document.querySelector('.next-container-solution-projects');
  if (!viewport || !prevBtn || !nextBtn) return;

  function updateButtons() {
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    const atStart = viewport.scrollLeft <= 0;
    const atEnd = viewport.scrollLeft >= maxScroll - 1;
    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;
  }

  function scrollPage(dir) {
    const distance = viewport.clientWidth; // page = visible width
    viewport.scrollBy({ left: dir * distance, behavior: 'smooth' });
    // optimistic button state; will correct on 'scroll' event
    setTimeout(updateButtons, 350);
  }

  prevBtn.addEventListener('click', () => scrollPage(-1));
  nextBtn.addEventListener('click', () => scrollPage(1));

  // keep buttons in sync
  viewport.addEventListener('scroll', () => {
    // debounced update
    window.clearTimeout(viewport._btnTimer);
    viewport._btnTimer = setTimeout(updateButtons, 80);
  });
  window.addEventListener('resize', updateButtons);

  // init
  updateButtons();
})();
// 
/* ==========================================================
   Types tabs: click/keyboard + hash support
   ========================================================== */
(function initSolarTypes() {
  const tabs = Array.from(document.querySelectorAll('.tab-btn-container-solution-types'));
  const panels = {
    'on-grid': document.getElementById('panel-on-grid-container-solution-types'),
    'off-grid': document.getElementById('panel-off-grid-container-solution-types'),
    'hybrid': document.getElementById('panel-hybrid-container-solution-types')
  };
  if (!tabs.length) return;

  function activate(type) {
    // tabs
    tabs.forEach(btn => {
      const isActive = btn.dataset.type === type;
      btn.classList.toggle('is-active-container-solution-types', isActive);
      btn.setAttribute('aria-selected', String(isActive));
      // tabindex for roving focus
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    // panels
    Object.entries(panels).forEach(([key, el]) => {
      const show = key === type;
      if (!el) return;
      el.classList.toggle('is-active-container-solution-types', show);
      el.hidden = !show;
      if (show) {
        // restart small fade-in animation
        el.style.animation = 'none'; el.offsetHeight; el.style.animation = '';
      }
    });
  }

  // Click
  tabs.forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.type)));

  // Keyboard: left/right arrows
  document.querySelector('.tabs-container-solution-types')?.addEventListener('keydown', (e) => {
    const idx = tabs.findIndex(b => b.classList.contains('is-active-container-solution-types'));
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + tabs.length) % tabs.length;
      tabs[next].focus();
      tabs[next].click();
    }
  });

  // Hash support e.g. #hybrid
  function fromHash() {
    const h = (location.hash || '').replace('#', '').toLowerCase();
    if (['on-grid', 'off-grid', 'hybrid'].includes(h)) activate(h);
  }
  window.addEventListener('hashchange', fromHash);

  // init
  activate('on-grid');
  fromHash();
})();
/* ==========================================================
   Scoped tabs for all .section-types-container-solution-types
   (no global getElementById; supports multiple instances)
   ========================================================== */
(function initAllSolarTypeTabs() {
  document.querySelectorAll('.section-types-container-solution-types').forEach(section => {
    const tabsWrap = section.querySelector('.tabs-container-solution-types');
    if (!tabsWrap) return;

    const tabs = Array.from(section.querySelectorAll('.tab-btn-container-solution-types'));
    const panels = Array.from(section.querySelectorAll('.panel-container-solution-types'));
    if (!tabs.length || !panels.length) return;

    function activate(btn) {
      // Tabs state
      tabs.forEach(t => {
        const isActive = t === btn;
        t.classList.toggle('is-active-container-solution-types', isActive);
        t.setAttribute('aria-selected', String(isActive));
        t.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      // Panels state (scoped within this section)
      const targetId = btn.getAttribute('aria-controls');
      panels.forEach(p => {
        const show = p.id === targetId;
        p.hidden = !show;
        p.classList.toggle('is-active-container-solution-types', show);
        if (show) { p.style.animation = 'none'; p.offsetHeight; p.style.animation = ''; }
      });
    }

    // Click to activate
    tabs.forEach(btn => btn.addEventListener('click', () => activate(btn)));

    // Keyboard: Left/Right arrows within this tablist
    tabsWrap.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const current = tabs.findIndex(t => t.classList.contains('is-active-container-solution-types'));
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (current + dir + tabs.length) % tabs.length;
      tabs[next].focus();
      activate(tabs[next]);
    });

    // Init: use the one marked active or the first
    activate(tabs.find(t => t.classList.contains('is-active-container-solution-types')) || tabs[0]);
  });
})();

/* IntersectionObserver reveal - shows elements when they enter the viewport,
   hides them again when they leave (works on scroll down and up). */
(function () {
  const els = document.querySelectorAll('.reveal-up');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('is-visible-mobility'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible-mobility');
      } else {
        entry.target.classList.remove('is-visible-mobility');
      }
    });
  }, { threshold: 0.18 });

  els.forEach(el => io.observe(el));
})();


document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.-gemini-tab');
  const contents = document.querySelectorAll('.-gemini-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // Add active class to the clicked tab
      tab.classList.add('active');

      // Find the corresponding content using the data-tab attribute
      const tabId = tab.getAttribute('data-tab');
      const content = document.getElementById(`${tabId}-content`);

      // Add active class to the content
      if (content) {
        content.classList.add('active');
      }
    });
  });

  // Set the default active tab and content on page load
  const defaultTab = document.querySelector('.-gemini-tab[data-tab="mission"]');
  const defaultContent = document.getElementById('mission-content');

  if (defaultTab && defaultContent) {
    defaultTab.classList.add('active');
    defaultContent.classList.add('active');
  }
});

(function () {
  const grid = document.getElementById('grid-neplan-card-with-animation');
  if (!grid) return;
  const cards = grid.querySelectorAll('.card-neplan-card-with-animation');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show-neplan-card-with-animation');
      } else {
        // remove so it replays when scrolling back (LIFO feel)
        e.target.classList.remove('show-neplan-card-with-animation');
      }
    });
  }, { threshold: 0.18 });

  cards.forEach(c => io.observe(c));
})();


(() => {
  const SELECTOR = '.reveal-left, .reveal-right, .reveal-up, .reveal-down';

  // Apply per-element delay from data attribute if provided
  document.querySelectorAll(SELECTOR).forEach(el => {
    const d = el.getAttribute('data-reveal-delay');
    if (d) el.style.setProperty('--reveal-delay', /^\d+$/.test(d) ? `${d}ms` : d);
  });

  // Auto-stagger children inside a .reveal-group
  document.querySelectorAll('.reveal-group[data-reveal-stagger]').forEach(group => {
    const step = parseInt(group.dataset.revealStagger, 10) || 120; // ms
    let i = 0;
    group.querySelectorAll(SELECTOR).forEach(el => {
      el.style.setProperty('--reveal-delay', `${i * step}ms`);
      i++;
    });
  });

  // Observe and toggle visibility (replays when scrolling back unless .reveal-once)
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.classList.add('is-visible');
      else if (!target.classList.contains('reveal-once'))
        target.classList.remove('is-visible');
    });
  }, { threshold: 0.18 });

  document.querySelectorAll(SELECTOR).forEach(el => io.observe(el));
})();

/* Intersection Observer for gentle reveals */
(function () {
  const items = document.querySelectorAll('.reveal-container-solution-panel-');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in-container-solution-panel-');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  items.forEach(el => io.observe(el));

  /* Simple form handler (prevent empty submit in demo) */
  const form = document.getElementById('service-form-container-solution-panel-');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    // You can hook this to your backend
    alert(`Thanks ${fd.get('name') || ''}! We’ll contact you soon.`);
    form.reset();
  });
})();

/* IntersectionObserver reveal - shows elements when they enter the viewport,
   hides them again when they leave (works on scroll down and up). */
(function () {
  const els = document.querySelectorAll('.reveal-up');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(el => el.classList.add('is-visible-mobility'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible-mobility');
      } else {
        entry.target.classList.remove('is-visible-mobility');
      }
    });
  }, { threshold: 0.18 });

  els.forEach(el => io.observe(el));
})();


document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.-gemini-tab');
  const contents = document.querySelectorAll('.-gemini-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      // Add active class to the clicked tab
      tab.classList.add('active');

      // Find the corresponding content using the data-tab attribute
      const tabId = tab.getAttribute('data-tab');
      const content = document.getElementById(`${tabId}-content`);

      // Add active class to the content
      if (content) {
        content.classList.add('active');
      }
    });
  });

  // Set the default active tab and content on page load
  const defaultTab = document.querySelector('.-gemini-tab[data-tab="mission"]');
  const defaultContent = document.getElementById('mission-content');

  if (defaultTab && defaultContent) {
    defaultTab.classList.add('active');
    defaultContent.classList.add('active');
  }
});

(function () {
  const grid = document.getElementById('grid-neplan-card-with-animation');
  if (!grid) return;
  const cards = grid.querySelectorAll('.card-neplan-card-with-animation');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('show-neplan-card-with-animation');
      } else {
        // remove so it replays when scrolling back (LIFO feel)
        e.target.classList.remove('show-neplan-card-with-animation');
      }
    });
  }, { threshold: 0.18 });

  cards.forEach(c => io.observe(c));
})();


(() => {
  const SELECTOR = '.reveal-left, .reveal-right, .reveal-up, .reveal-down';

  // Apply per-element delay from data attribute if provided
  document.querySelectorAll(SELECTOR).forEach(el => {
    const d = el.getAttribute('data-reveal-delay');
    if (d) el.style.setProperty('--reveal-delay', /^\d+$/.test(d) ? `${d}ms` : d);
  });

  // Auto-stagger children inside a .reveal-group
  document.querySelectorAll('.reveal-group[data-reveal-stagger]').forEach(group => {
    const step = parseInt(group.dataset.revealStagger, 10) || 120; // ms
    let i = 0;
    group.querySelectorAll(SELECTOR).forEach(el => {
      el.style.setProperty('--reveal-delay', `${i * step}ms`);
      i++;
    });
  });

  // Observe and toggle visibility (replays when scrolling back unless .reveal-once)
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) target.classList.add('is-visible');
      else if (!target.classList.contains('reveal-once'))
        target.classList.remove('is-visible');
    });
  }, { threshold: 0.18 });

  document.querySelectorAll(SELECTOR).forEach(el => io.observe(el));
})();

/* Simple reveal on scroll */
(() => {
  const els = document.querySelectorAll('.reveal-container-solution-panel-');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in-container-solution-panel-');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.2 });

  els.forEach(el => io.observe(el));
})();

// Reveal on scroll for the About section
(() => {
  const items = document.querySelectorAll('.reveal-container-solution-about-');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in-container-solution-about-');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });

  items.forEach(el => io.observe(el));
})();
(() => {
  const els = document.querySelectorAll(
    '.reveal-left-container-solution-services, .reveal-right-container-solution-services, .reveal-up-container-solution-services'
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in-container-solution-services');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });

  els.forEach(el => io.observe(el));
})();
(() => {
  const els = document.querySelectorAll(
    '.reveal-left-container-solution-services, .reveal-right-container-solution-services, .reveal-up-container-solution-services'
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in-container-solution-services');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });
  els.forEach(el => io.observe(el));
})();
(() => {
  const els = document.querySelectorAll(
    '.reveal-left-container-solution-services, .reveal-right-container-solution-services, .reveal-up-container-solution-services'
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in-container-solution-services');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });
  els.forEach(el => io.observe(el));
})();
// Simple reveal on scroll for the process section
(() => {
  const els = document.querySelectorAll(
    '.reveal-left-container-solution-process, .reveal-right-container-solution-process'
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in-container-solution-process');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });

  els.forEach(el => io.observe(el));
})();
// Reveal-on-scroll for the Why Choose Us section (trigger on every scroll)

// Reveal-on-scroll for the Why Choose Us section – always trigger on scroll up and down
(() => {
  const targets = document.querySelectorAll(
    '.reveal-left-container-solution-why-us, .reveal-right-container-solution-why-us, .reveal-top-container-solution-why-us, .reveal-bottom-container-solution-why-us'
  );

  const revealOnScroll = () => {
    targets.forEach(target => {
      const rect = target.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.85 && rect.bottom > window.innerHeight * 0.15;

      if (inView) {
        target.classList.add('reveal-in-container-solution-why-us');
      } else {
        target.classList.remove('reveal-in-container-solution-why-us');
      }
    });
  };

  // Run on scroll and on page load
  window.addEventListener('scroll', revealOnScroll);
  window.addEventListener('resize', revealOnScroll);
  window.addEventListener('load', revealOnScroll);
})();


document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('servicesGrid');
  const detail = document.getElementById('svcDetail');
  const exploreBtn = document.getElementById('exploreServicesBtn'); // header button if present

  if (!grid || !detail) return;

  // --- DETAILS CONTENT MAP ---
  const detailsMap = {

Accommodation: {
  title: 'Accommodation & Utility Containers',
  body: `
    <p>
      Containerised solutions designed for temporary or semi-permanent accommodation and essential support facilities,
      including containerized houses and portable houses.
    </p>

    <h4>Key Features</h4>
    <p>
      Accommodation and utility containers are engineered for rapid deployment and long-term usability. Interiors are
      comfort-focused and incorporate HVAC, lighting, plumbing, and essential safety provisions. Modular construction
      enables flexible layouts, easy relocation, and future expansion, making these solutions suitable for both short-term
      projects and semi-permanent installations in remote or challenging environments.
    </p>

    <h4>Typical Applications</h4>
    <ul>
      <li>Staff accommodation units</li>
      <li>Utility and support rooms</li>
      <li>Remote project site facilities</li>
      <li>Containerized and portable housing solutions</li>
    </ul>
  `,
  image: { src: '../static/images/types/type1.avif', alt: 'Accommodation and utility container units' }
},

Site: {
  title: 'Site Office & Operational Containers',
  body: `
    <p>
      Functional and durable containers designed to support on-site operations and project teams, providing efficient and
      professional working environments.
    </p>

    <h4>Key Features</h4>
    <p>
      These containers are designed for immediate operational readiness and can be pre-wired for computer LAN, telephone,
      and UPS connectivity. Ergonomic internal layouts enhance productivity, while integrated HVAC, lighting, and safety
      systems ensure a comfortable and compliant workspace. Units are factory-assembled and tested for rapid deployment
      with minimal on-site work.
    </p>

    <h4>Typical Applications</h4>
    <ul>
      <li>Site offices and control cabins</li>
      <li>Project management offices</li>
      <li>Technical workshops and utility rooms</li>
    </ul>
  `,
  image: { src: '../static/images/types/type2.avif', alt: 'Site office and operational container' }
},

Electrical: {
  title: 'Electrical & Control Room Containers',
  body: `
    <p>
      Custom-engineered containers designed to house electrical and automation systems in a secure, safe, and controlled
      environment.
    </p>

    <h4>Key Features</h4>
    <p>
      Engineered layouts are developed based on client drawings and system requirements to ensure optimal space utilisation
      and safe access. These containers integrate switchgear, MCCs, PLCs, SCADA systems, and protection and control panels
      as required. HVAC, lighting, fire detection, and safety systems are incorporated to maintain reliable operating
      conditions. Each unit is designed for harsh and remote site environments and is factory-assembled, tested, and
      supplied as a ready-to-deploy solution.
    </p>

    <h4>Typical Applications</h4>
    <ul>
      <li>MCC and switchgear rooms</li>
      <li>PLC &amp; SCADA control rooms</li>
      <li>Substation auxiliary rooms</li>
      <li>Electrical distribution cabins</li>
    </ul>
  `,
  image: { src: '../static/images/types/type3.avif', alt: 'Electrical and control room container' }
},

Containerised: {
  title: 'Containerised Data & IT Infrastructure',
  body: `
    <p>
      Modular container solutions developed for IT, networking, data processing, and remote monitoring applications.
    </p>

    <h4>Key Features</h4>
    <p>
      These solutions provide secure and scalable container infrastructure with engineered power distribution, UPS, and
      cooling systems tailored to project needs. Designs allow seamless integration with existing IT and OT systems,
      ensuring reliable and continuous operation. Factory-assembled and tested units enable rapid deployment while reducing
      on-site installation time.
    </p>

    <h4>Typical Applications</h4>
    <ul>
      <li>Edge data centres</li>
      <li>Remote IT and communication rooms</li>
      <li>Monitoring and telemetry shelters</li>
    </ul>
  `,
  image: { src: '../static/images/types/type4.avif', alt: 'Containerised data and IT infrastructure unit' }
},



  };

  // --- RENDER DETAILS (single function) ---
  function openDetails(key) {
    const data = detailsMap[key];
    if (!data) return;

    const imgHTML = data.image
      ? `<figure class="svc-detail-figure"><img class="svc-detail-img" src="${data.image.src}" alt="${data.image.alt || ''}"></figure>`
      : '';

    detail.innerHTML = `
      <div class="svc-detail-layout">
        ${imgHTML}
        <div class="svc-detail-copy">
          <h3>${data.title}</h3>
          ${data.body || ''}
        </div>
      </div>
    `;
    detail.style.display = 'block';
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeDetails() {
    detail.style.display = 'none';
    detail.innerHTML = '';
  }

  // --- CLICK HANDLER (delegated) ---
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.svc-cta-container-solution-services');
    if (!btn) return;
    const key = btn.getAttribute('data-detail');
    const currentTitle = detail.querySelector('h3')?.textContent || '';
    if (detail.style.display === 'block' && currentTitle === (detailsMap[key]?.title || '')) {
      closeDetails();
    } else {
      openDetails(key);
    }
  });

  // --- EXPLORE / VIEW LESS toggle (uses .is-hidden on extra cards) ---
  if (exploreBtn) {
    const allCards = Array.from(grid.querySelectorAll('.svc-item-container-solution-services'));
    const extraCards = allCards.slice(3); // cards 4..7
    let expanded = false;

    function setExpanded(state) {
      expanded = state;
      if (expanded) {
        extraCards.forEach(el => el.classList.remove('is-hidden'));
        exploreBtn.textContent = 'View Less';
        exploreBtn.setAttribute('aria-expanded', 'true');
        
      } else {
        extraCards.forEach(el => el.classList.add('is-hidden'));
        closeDetails();
        exploreBtn.textContent = 'Explore Types';
        exploreBtn.setAttribute('aria-expanded', 'false');
        
      }
      // retrigger reveal animations if you use them
      extraCards.forEach(el => {
        el.classList.remove('reveal-in-container-solution-services');
        void el.offsetWidth;
      });
    }

    // init collapsed
    setExpanded(false);

    exploreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      setExpanded(!expanded);
    });
  }

  // --- SCROLL REVEAL (bi-directional) ---
  const revealEls = document.querySelectorAll(
    '.reveal-left-container-solution-services, .reveal-right-container-solution-services, .reveal-up-container-solution-services'
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-in-container-solution-services');
      } else {
        entry.target.classList.remove('reveal-in-container-solution-services');
      }
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
  revealEls.forEach(el => io.observe(el));
});
(() => {
  const modal = document.getElementById('csc-modal');
  const form  = document.getElementById('csc-form');
  const close = modal.querySelector('.modal-close-csc-container-solution-csc-products');
  const successPane  = document.getElementById('csc-success');
  const docNameInput = document.getElementById('csc-doc-name');

  function openModal() {
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    successPane.hidden = true;
    form.hidden = false;
    form.reset();
    setTimeout(() => document.getElementById('csc-name')?.focus(), 50);
  }
  function closeModal() {
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  // Open from each "Request Download" button
  document.querySelectorAll('.request-download-csc-container-solution-csc-products').forEach(btn => {
    btn.addEventListener('click', () => {
      docNameInput.value = btn.dataset.doc || '';
      openModal();
    });
  });

  // Close handlers
  close.addEventListener('click', closeModal);
  modal.querySelector('.modal-backdrop-csc-container-solution-csc-products')
       .addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
})();

/* ===== Scroll reveal + count-up when visible ===== */
(() => {
  const els = document.querySelectorAll('.reveal-container-solution-get-in-touch');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.delay || '0', 10);
      setTimeout(() => el.classList.add('in-view'), delay);

      // If this block contains counters, animate them once
      el.querySelectorAll?.('.stat-num-container-solution-get-in-touch').forEach(counter => {
        if (counter.dataset.done) return;
        counter.dataset.done = '1';
        const end = parseInt(counter.dataset.count || '0', 10);
        const hasPlus = end >= 20; // to match mock (25+, 500+, 20+)
        const suffix = hasPlus ? '+' : (end === 98 ? '%' : '');
        let start = 0, duration = 900, startTs;
        const step = (ts) => {
          if (!startTs) startTs = ts;
          const p = Math.min((ts - startTs) / duration, 1);
          const val = Math.floor(start + (end - start) * p);
          counter.textContent = val;
          counter.setAttribute('data-suffix', suffix);
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });

      io.unobserve(el);
    });
  }, { threshold: 0.15 });

  els.forEach(el => io.observe(el));
})();

