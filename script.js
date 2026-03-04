/* ═══════════════════════════════════════════════
   මල්කා — INTERACTIONS + UX FEATURES
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── BANDWIDTH / SAVE-DATA DETECTION ─── */
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSlow = conn && (conn.saveData || /2g|slow-2g/.test(conn.effectiveType));
  const isMedium = conn && conn.effectiveType === '3g';
  const isLowBandwidth = isSlow || isMedium;
  const isMobileDevice = window.innerWidth < 768 || matchMedia('(pointer: coarse)').matches;

  if (isSlow) document.body.classList.add('save-data');
  if (conn) {
    conn.addEventListener('change', () => {
      document.body.classList.toggle('save-data', conn.saveData || /2g|slow-2g/.test(conn.effectiveType));
    });
  }

  /* ─── WEBP FALLBACK ─── */
  function supportsWebP(callback) {
    const img = new Image();
    img.onload = img.onerror = () => callback(img.height === 1);
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAkA4JZQCdAEO/gHOAAD++OZgAA==';
  }
  supportsWebP(supported => {
    if (supported) return;
    document.querySelectorAll('img[src$=".webp"]').forEach(img => {
      img.src = img.src.replace(/\.webp$/, '.jpg');
    });
  });

  /* ─── PRODUCTS DATA (loaded for search/sort/filter/wishlist) ─── */
  let productsData = [];
  function loadProductsData() {
    return fetch('products.json')
      .then(r => r.json())
      .then(data => { productsData = data; return data; })
      .catch(() => []);
  }

  /* ─── PRELOADER ─── */
  function initPreloader() {
    const loader = document.getElementById('loader');
    if (!loader) return;
    if (isSlow) { loader.classList.add('done'); return; }
    const delay = isMedium ? 800 : 2000;
    window.addEventListener('load', () => setTimeout(() => loader.classList.add('done'), delay));
    if (document.readyState === 'complete') setTimeout(() => loader.classList.add('done'), delay);
  }

  /* ─── CUSTOM CURSOR ─── */
  function initCursor() {
    const cursor = document.getElementById('cursor');
    const dot = document.getElementById('cursor-dot');
    if (!cursor || !dot) return;
    if (matchMedia('(pointer: coarse)').matches) return;
    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
    (function tick() {
      cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12;
      cursor.style.left = cx + 'px'; cursor.style.top = cy + 'px';
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      requestAnimationFrame(tick);
    })();
    const hoverEls = document.querySelectorAll('a, button, .mosaic-item, .card, input, textarea, select, .pd-thumb');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
  }

  /* ─── PETAL CANVAS ─── */
  function initPetals() {
    const canvas = document.getElementById('petal-canvas');
    if (!canvas) return;
    if (isLowBandwidth || isSlow) { canvas.style.display = 'none'; return; }
    const ctx = canvas.getContext('2d');
    let w, h;
    const colors = ['#C4713B', '#E8A838', '#D4A34A', '#3D6B35', '#5A8A52'];
    const count = isMobileDevice ? 8 : 20;
    function resize() { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    class Petal {
      constructor() { this.reset(true); }
      reset(init) {
        this.x = Math.random() * w; this.y = init ? Math.random() * h : -30;
        this.size = 6 + Math.random() * 10; this.speedY = 0.3 + Math.random() * 0.8;
        this.speedX = Math.random() * 0.5 - 0.25; this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.02;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.opacity = 0.25 + Math.random() * 0.35;
        this.wobble = Math.random() * Math.PI * 2; this.wobbleSpeed = 0.01 + Math.random() * 0.02;
      }
      update() {
        this.y += this.speedY; this.wobble += this.wobbleSpeed;
        this.x += this.speedX + Math.sin(this.wobble) * 0.3;
        this.rotation += this.rotSpeed;
        if (this.y > h + 30) this.reset(false);
      }
      draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
        ctx.globalAlpha = this.opacity; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.ellipse(0, 0, this.size * 0.5, this.size, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      }
    }
    const petals = Array.from({ length: count }, () => new Petal());
    function animate() {
      ctx.clearRect(0, 0, w, h);
      petals.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }
    animate();
  }

  /* ─── NAVBAR ─── */
  function initNavbar() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    const links = document.querySelectorAll('.nav-links a[href^="#"]');
    const sections = [];
    links.forEach(l => {
      const id = l.getAttribute('href').substring(1);
      const sec = document.getElementById(id);
      if (sec) sections.push({ el: sec, link: l });
    });
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        nav.classList.toggle('scrolled', sy > 60);
        const scrollY = sy + 200;
        sections.forEach(s => {
          const top = s.el.offsetTop;
          const bot = top + s.el.offsetHeight;
          s.link.classList.toggle('active', scrollY >= top && scrollY < bot);
        });
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── MOBILE MENU ─── */
  function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('mob-menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      menu.classList.toggle('open');
      document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
    });
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('open'); menu.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ─── SCROLL REVEAL ─── */
  function initReveal() {
    const els = document.querySelectorAll('.anim-up, .anim-fade, .reveal-el');
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => observer.observe(el));
  }

  /* ─── SEARCH ─── */
  function initSearch() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');
    if (!input) return;

    const allCards = document.querySelectorAll('.card[data-cat], .creations-grid .card, .plants-extra .card, .creations-extra .card');

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      clearBtn.classList.toggle('visible', q.length > 0);

      if (!q) {
        allCards.forEach(c => c.classList.remove('search-hidden'));
        return;
      }

      let hasHiddenPlantMatch = false;
      let hasHiddenCreationMatch = false;

      allCards.forEach(card => {
        const name = (card.querySelector('h3')?.textContent || '').toLowerCase();
        const desc = (card.querySelector('.card-body p')?.textContent || '').toLowerCase();
        const match = name.includes(q) || desc.includes(q);
        card.classList.toggle('search-hidden', !match);

        // Check if match is in a hidden section
        if (match) {
          if (card.closest('.plants-extra')) hasHiddenPlantMatch = true;
          if (card.closest('.creations-extra')) hasHiddenCreationMatch = true;
        }
      });

      // Auto-reveal hidden sections if they contain matching results
      if (hasHiddenPlantMatch) {
        const extra = document.querySelector('.plants-extra');
        const btn = document.querySelector('.plants-load-more');
        if (extra && !extra.classList.contains('visible')) {
          extra.classList.add('visible');
          if (btn) btn.classList.add('loaded');
          setTimeout(() => {
            extra.querySelectorAll('.card').forEach(el => el.classList.add('visible'));
            initWishlistForNewCards(extra);
          }, 100);
        }
      }
      if (hasHiddenCreationMatch) {
        const extra = document.querySelector('.creations-extra');
        const btn = document.querySelector('.creations-load-more');
        if (extra && !extra.classList.contains('visible')) {
          extra.classList.add('visible');
          if (btn) btn.classList.add('loaded');
          setTimeout(() => {
            extra.querySelectorAll('.card').forEach(el => el.classList.add('visible'));
            initWishlistForNewCards(extra);
          }, 100);
        }
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        clearBtn.classList.remove('visible');
        allCards.forEach(c => c.classList.remove('search-hidden'));
        input.focus();
      });
    }
  }

  /* ─── PRODUCT FILTERS (with search-hidden awareness) ─── */
  function initFilters() {
    const plantsSection = document.getElementById('plants');
    if (!plantsSection) return;
    const buttons = plantsSection.querySelectorAll('.filter');
    const cards = plantsSection.querySelectorAll('.card[data-cat]');
    if (!buttons.length || !cards.length) return;

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        cards.forEach(card => {
          if (cat === 'all' || card.dataset.cat === cat) {
            card.classList.remove('filtered-out');
          } else {
            card.classList.add('filtered-out');
          }
        });
      });
    });
  }

  /* ─── SORT ─── */
  function initSort() {
    const select = document.getElementById('sort-select');
    if (!select) return;

    select.addEventListener('change', () => {
      const val = select.value;
      if (val === 'default') return;

      // Sort both the main grid and the extra (hidden) grid
      const mainGrid = document.getElementById('plants-grid');
      const extraGrid = document.querySelector('.plants-extra');
      const grids = [mainGrid, extraGrid].filter(Boolean);

      grids.forEach(grid => {
        const cards = Array.from(grid.querySelectorAll('.card'));
        const getPriceNum = card => {
          const priceText = card.querySelector('.price')?.textContent || '0';
          return parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
        };

        // Match cards to product data for popularity/date sorting
        const getProductData = card => {
          const name = card.querySelector('h3')?.textContent || '';
          return productsData.find(p => p.name === name) || {};
        };

        cards.sort((a, b) => {
          switch (val) {
            case 'price-asc': return getPriceNum(a) - getPriceNum(b);
            case 'price-desc': return getPriceNum(b) - getPriceNum(a);
            case 'popular': {
              const pa = getProductData(a).popularity || 0;
              const pb = getProductData(b).popularity || 0;
              return pb - pa;
            }
            case 'newest': {
              const da = new Date(getProductData(a).dateAdded || '2000-01-01');
              const db = new Date(getProductData(b).dateAdded || '2000-01-01');
              return db - da;
            }
            default: return 0;
          }
        });

        cards.forEach(card => grid.appendChild(card));
      });

      // Auto-expand hidden section when sorting so user sees all results in order
      const extraSection = document.querySelector('.plants-extra');
      const loadBtn = document.querySelector('.plants-load-more');
      if (extraSection && !extraSection.classList.contains('visible')) {
        extraSection.classList.add('visible');
        if (loadBtn) loadBtn.classList.add('loaded');
        setTimeout(() => {
          extraSection.querySelectorAll('.card').forEach(el => el.classList.add('visible'));
          initWishlistForNewCards(extraSection);
        }, 100);
      }
    });
  }

  /* ─── PRICE RANGE SLIDER ─── */
  function initPriceFilter() {
    const minInput = document.getElementById('price-min');
    const maxInput = document.getElementById('price-max');
    const minVal = document.getElementById('price-min-val');
    const maxVal = document.getElementById('price-max-val');
    const track = document.getElementById('price-slider-track');
    if (!minInput || !maxInput) return;

    const allCards = document.querySelectorAll('.card[data-cat]');

    function formatPrice(n) {
      return 'Rs. ' + n.toLocaleString('en-IN');
    }

    function updateSlider() {
      let min = parseInt(minInput.value);
      let max = parseInt(maxInput.value);
      if (min > max) { [minInput.value, maxInput.value] = [max, min]; min = parseInt(minInput.value); max = parseInt(maxInput.value); }

      minVal.textContent = formatPrice(min);
      maxVal.textContent = formatPrice(max);

      // Track position
      const range = 3500 - 1000;
      const left = ((min - 1000) / range) * 100;
      const right = ((max - 1000) / range) * 100;
      track.style.left = left + '%';
      track.style.width = (right - left) + '%';

      // Filter cards
      allCards.forEach(card => {
        const priceText = card.querySelector('.price')?.textContent || '0';
        const price = parseInt(priceText.replace(/[^\d]/g, ''), 10) || 0;
        if (price === 0) { // "Price on request" — always show
          card.classList.remove('price-hidden');
        } else {
          card.classList.toggle('price-hidden', price < min || price > max);
        }
      });
    }

    minInput.addEventListener('input', updateSlider);
    maxInput.addEventListener('input', updateSlider);
    updateSlider();
  }

  /* ─── SAFE JSON PARSE ─── */
  function safeParseJSON(str, fallback) {
    try { return JSON.parse(str); } catch (e) { return fallback; }
  }

  /* ─── WISHLIST ─── */
  function initWishlist() {
    const STORAGE_KEY = 'malka_wishlist';
    let wishlist = safeParseJSON(localStorage.getItem(STORAGE_KEY), []);

    const countEl = document.getElementById('wishlist-count');
    const navBtn = document.getElementById('wishlist-nav-btn');
    const drawer = document.getElementById('wishlist-drawer');
    const drawerBody = document.getElementById('wishlist-drawer-body');
    const drawerClose = document.getElementById('wishlist-drawer-close');
    const overlay = document.getElementById('wishlist-overlay');

    function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist)); }

    function updateCount() {
      if (!countEl) return;
      countEl.textContent = wishlist.length;
      countEl.classList.toggle('visible', wishlist.length > 0);
    }

    function isWishlisted(id) { return wishlist.includes(id); }

    function toggle(id) {
      if (isWishlisted(id)) {
        wishlist = wishlist.filter(x => x !== id);
      } else {
        wishlist.push(id);
      }
      save();
      updateCount();
      updateHearts();
      renderDrawer();
    }

    // Add hearts to all cards
    function addHeartsToCards() {
      document.querySelectorAll('.card').forEach(card => {
        const link = card.querySelector('.card-link');
        if (!link) return;
        const href = link.getAttribute('href') || '';
        const match = href.match(/products\/([^.]+)\.html/);
        if (!match) return;
        const id = match[1];
        card.dataset.productId = id;

        const media = card.querySelector('.card-media');
        if (!media || media.querySelector('.card-wishlist-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'card-wishlist-btn' + (isWishlisted(id) ? ' active' : '');
        btn.setAttribute('aria-label', 'Add to wishlist');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
        btn.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();
          toggle(id);
        });
        media.appendChild(btn);
      });
    }

    function updateHearts() {
      document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
        const card = btn.closest('.card');
        if (!card) return;
        const id = card.dataset.productId;
        btn.classList.toggle('active', isWishlisted(id));
      });
    }

    function renderDrawer() {
      if (!drawerBody) return;
      if (wishlist.length === 0) {
        drawerBody.innerHTML = '<p class="wishlist-empty">No items saved yet. Click the heart on any product to save it for later.</p>';
        return;
      }
      drawerBody.innerHTML = wishlist.map(id => {
        const p = productsData.find(x => x.id === id);
        if (!p) return '';
        const href = 'products/' + id + '.html';
        return `<div class="wishlist-item">
          <a href="${href}"><img class="wishlist-item-img" src="${p.img}" alt="${p.name}"></a>
          <div class="wishlist-item-info">
            <a href="${href}" class="wishlist-item-name">${p.name}</a>
            <div class="wishlist-item-price">${p.price}</div>
          </div>
          <button class="wishlist-item-remove" data-id="${id}" aria-label="Remove">&times;</button>
        </div>`;
      }).join('');

      drawerBody.querySelectorAll('.wishlist-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          toggle(btn.dataset.id);
        });
      });
    }

    function openDrawer() {
      if (drawer) drawer.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      renderDrawer();
    }

    function closeDrawer() {
      if (drawer) drawer.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (navBtn) navBtn.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    addHeartsToCards();
    updateCount();
  }

  /* ─── RECENTLY VIEWED ─── */
  function initRecentlyViewed() {
    const RV_KEY = 'malka_recently_viewed';
    const section = document.getElementById('recently-viewed');
    const scroll = document.getElementById('rv-scroll');
    if (!section || !scroll) return;

    const viewed = safeParseJSON(localStorage.getItem(RV_KEY), []);
    if (viewed.length === 0) return;

    // Find product data for viewed IDs
    const items = viewed
      .map(id => productsData.find(p => p.id === id))
      .filter(Boolean)
      .slice(0, 6);

    if (items.length === 0) return;

    scroll.innerHTML = items.map(p => {
      const href = 'products/' + p.id + '.html';
      return `<a class="rv-card" href="${href}">
        <img class="rv-card-img" src="${p.img}" alt="${p.name}" loading="lazy">
        <div class="rv-card-info">
          <div class="rv-card-name">${p.name}</div>
          <div class="rv-card-price">${p.price}</div>
        </div>
      </a>`;
    }).join('');

    section.style.display = '';
  }

  /* ─── LOAD MORE ─── */
  function initLoadMore() {
    document.querySelectorAll('.btn-load').forEach(btn => {
      const section = btn.closest('.collection');
      const extra = section ? section.querySelector('.grid-extra') : null;
      if (!extra) return;
      btn.addEventListener('click', () => {
        extra.classList.add('visible');
        btn.classList.add('loaded');
        setTimeout(() => {
          extra.querySelectorAll('.card').forEach(el => el.classList.add('visible'));
          // Add wishlist hearts to newly visible cards
          initWishlistForNewCards(extra);
        }, 100);
      });
    });
  }

  function initWishlistForNewCards(container) {
    const STORAGE_KEY = 'malka_wishlist';
    const wishlist = safeParseJSON(localStorage.getItem(STORAGE_KEY), []);

    container.querySelectorAll('.card').forEach(card => {
      const link = card.querySelector('.card-link');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const match = href.match(/products\/([^.]+)\.html/);
      if (!match) return;
      const id = match[1];
      card.dataset.productId = id;

      const media = card.querySelector('.card-media');
      if (!media || media.querySelector('.card-wishlist-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'card-wishlist-btn' + (wishlist.includes(id) ? ' active' : '');
      btn.setAttribute('aria-label', 'Add to wishlist');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        let wl = safeParseJSON(localStorage.getItem(STORAGE_KEY), []);
        if (wl.includes(id)) { wl = wl.filter(x => x !== id); }
        else { wl.push(id); }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wl));
        btn.classList.toggle('active');
        const countEl = document.getElementById('wishlist-count');
        if (countEl) { countEl.textContent = wl.length; countEl.classList.toggle('visible', wl.length > 0); }
      });
      media.appendChild(btn);
    });
  }

  /* ─── LIGHTBOX ─── */
  function initLightbox() {
    const lb = document.getElementById('lb');
    const lbImg = document.getElementById('lb-img');
    const lbClose = document.getElementById('lb-close');
    if (!lb || !lbImg) return;
    document.querySelectorAll('[data-lb]').forEach(item => {
      item.addEventListener('click', () => {
        const img = item.querySelector('img');
        if (!img) return;
        lbImg.src = img.src; lbImg.alt = img.alt;
        lb.classList.add('open'); document.body.style.overflow = 'hidden';
      });
    });
    function closeLb() { lb.classList.remove('open'); document.body.style.overflow = ''; }
    if (lbClose) lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  }

  /* ─── BACK TO TOP ─── */
  function initBackToTop() {
    const btn = document.getElementById('btt');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 600), { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ─── SMOOTH SCROLL ─── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const y = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  /* ─── CONTACT FORM ─── */
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = fd.get('name') || '';
      const phone = fd.get('phone') || '';
      const email = fd.get('email') || '';
      const subject = fd.get('subject') || '';
      const msg = fd.get('message') || '';
      let text = `Hi! I'm ${name}.`;
      if (subject) text += ` Regarding: ${subject}.`;
      text += ` ${msg}`;
      if (email) text += ` | Email: ${email}`;
      if (phone) text += ` | Phone: ${phone}`;
      window.open(`https://wa.me/94705845678?text=${encodeURIComponent(text)}`, '_blank');
      form.reset();
      showToast('Message sent! We\'ll reply on WhatsApp shortly.');
    });
  }

  /* ─── TOAST NOTIFICATION ─── */
  function showToast(msg) {
    let t = document.getElementById('malka-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'malka-toast';
      t.className = 'malka-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.remove('visible');
    void t.offsetWidth;
    t.classList.add('visible');
    setTimeout(() => t.classList.remove('visible'), 4000);
  }

  /* ─── COUNTER ANIMATION ─── */
  function initCounters() {
    const nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        const duration = 1800;
        const start = performance.now();
        function tick(now) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - (1 - progress) * (1 - progress);
          el.textContent = Math.floor(eased * target) + '+';
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        observer.unobserve(el);
      });
    }, { threshold: 0.5 });
    nums.forEach(n => observer.observe(n));
  }

  /* ─── LAZY IMAGES ─── */
  function initLazyImages() {
    document.querySelectorAll('img:not([loading])').forEach(img => {
      img.loading = 'lazy'; img.decoding = 'async';
    });
  }

  /* ─── COOKIE CONSENT ─── */
  function initCookieConsent() {
    const COOKIE_KEY = 'malka_cookie_consent';
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    if (localStorage.getItem(COOKIE_KEY)) return;

    setTimeout(() => banner.classList.add('visible'), 2500);

    const accept = document.getElementById('cookie-accept');
    const dismiss = document.getElementById('cookie-dismiss');

    function hide() {
      banner.classList.remove('visible');
      localStorage.setItem(COOKIE_KEY, 'accepted');
    }
    if (accept) accept.addEventListener('click', hide);
    if (dismiss) dismiss.addEventListener('click', hide);
  }

  /* ─── AUTO "NEW" BADGE ─── */
  function initAutoBadges() {
    if (!productsData.length) return;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    document.querySelectorAll('.card').forEach(card => {
      const link = card.querySelector('.card-link');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const match = href.match(/products\/([^.]+)\.html/);
      if (!match) return;
      const id = match[1];
      const product = productsData.find(p => p.id === id);
      if (!product || !product.dateAdded) return;

      const addedDate = new Date(product.dateAdded);
      if (addedDate >= thirtyDaysAgo) {
        const media = card.querySelector('.card-media');
        if (!media) return;
        // Only add auto-badge if no existing badge
        const existingBadge = media.querySelector('.card-badge');
        if (existingBadge && existingBadge.classList.contains('badge-new')) return; // already has "New"
        if (!existingBadge) {
          const badge = document.createElement('span');
          badge.className = 'card-badge badge-auto-new';
          badge.textContent = 'New';
          media.appendChild(badge);
        }
      }
    });
  }

  /* ─── STAR RATINGS ON CARDS ─── */
  function initStarRatings() {
    document.querySelectorAll('.card').forEach(card => {
      const foot = card.querySelector('.card-foot');
      if (!foot || foot.querySelector('.card-rating')) return;
      const rating = document.createElement('span');
      rating.className = 'card-rating';
      rating.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="var(--saffron)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg> 4.9';
      foot.appendChild(rating);
    });
  }

  /* ─── SEARCH HIDDEN CSS ─── */
  // Add dynamic style for search-hidden and price-hidden
  const style = document.createElement('style');
  style.textContent = '.search-hidden, .price-hidden { display: none !important; }';
  document.head.appendChild(style);

  /* ─── DARK MODE ─── */
  function initDarkMode() {
    const toggle = document.getElementById('dark-toggle');
    if (!toggle) return;
    // Restore saved preference
    const saved = localStorage.getItem('malka-theme');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('malka-theme', 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('malka-theme', 'dark');
      }
    });
  }


  /* ─── HERO VIDEO ─── */
  function initHeroVideo() {
    const video = document.querySelector('.hero-video');
    if (!video) return;
    if (isLowBandwidth) { video.remove(); return; }
    // Try loading the video; if it loads, show it
    video.addEventListener('canplaythrough', () => video.classList.add('loaded'), { once: true });
    // Trigger load after DOM is ready
    video.preload = 'auto';
    video.load();
    // If video fails to load (no file), do nothing — stills remain visible
    video.addEventListener('error', () => video.remove());
  }

  /* ─── MICRO-ANIMATIONS: HEART BOUNCE ─── */
  function initHeartBounce() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('.card-wishlist-btn');
      if (!btn) return;
      btn.classList.remove('bounce');
      // Force reflow
      void btn.offsetWidth;
      btn.classList.add('bounce');
      btn.addEventListener('animationend', () => btn.classList.remove('bounce'), { once: true });
    });
  }

  /* ─── GLOBAL SEARCH ─── */
  function initGlobalSearch() {
    const btn = document.getElementById('nav-search-btn');
    const overlay = document.getElementById('global-search-overlay');
    const input = document.getElementById('gs-input');
    const results = document.getElementById('gs-results');
    const closeBtn = document.getElementById('gs-close');
    if (!btn || !overlay || !input) return;

    function open() {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => input.focus(), 100);
    }
    function close() {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      input.value = '';
      results.innerHTML = '<div class="gs-hint">Type to search plants & creations\u2026</div>';
    }

    btn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close();
      // Ctrl/Cmd + K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); open(); }
    });

    // Determine base path for product links
    const isSubDir = window.location.pathname.includes('/products/');
    const linkBase = isSubDir ? '' : 'products/';
    const imgBase = isSubDir ? '../' : '';

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      if (!q) {
        results.innerHTML = '<div class="gs-hint">Type to search plants & creations\u2026</div>';
        return;
      }
      const matches = productsData.filter(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.desc || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return name.includes(q) || desc.includes(q) || cat.includes(q);
      }).slice(0, 8);

      if (matches.length === 0) {
        results.innerHTML = '<div class="gs-empty">No results for &ldquo;' + q.replace(/[<>"'&]/g, '') + '&rdquo;</div>';
        return;
      }
      results.innerHTML = matches.map(p => {
        const href = linkBase + p.id + '.html';
        return '<a class="gs-result-item" href="' + href + '">' +
          '<img class="gs-result-img" src="' + imgBase + p.img + '" alt="' + p.name + '" loading="lazy">' +
          '<div class="gs-result-info">' +
            '<div class="gs-result-name">' + p.name + '</div>' +
            '<div class="gs-result-meta"><span>' + (p.price || '') + '</span><span>' + (p.category || '') + '</span></div>' +
          '</div></a>';
      }).join('');
    });
  }

  /* ─── NEWSLETTER ─── */
  function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;
      if (!email) return;
      // Store subscription locally (replace with real email service in production)
      const subs = safeParseJSON(localStorage.getItem('malka_newsletter'), []);
      if (subs.includes(email)) {
        showNewsletterMsg(form, 'You\'re already subscribed!', 'success');
        return;
      }
      subs.push(email);
      localStorage.setItem('malka_newsletter', JSON.stringify(subs));
      form.reset();
      showNewsletterMsg(form, 'Thank you! You\'re now subscribed.', 'success');
    });
  }

  function showNewsletterMsg(form, msg, type) {
    let el = form.parentElement.querySelector('.newsletter-msg');
    if (!el) {
      el = document.createElement('p');
      el.className = 'newsletter-msg';
      form.parentElement.appendChild(el);
    }
    el.className = 'newsletter-msg newsletter-msg--' + type;
    el.textContent = msg;
    setTimeout(() => { el.textContent = ''; }, 5000);
  }

  /* ─── INIT ALL ─── */
  document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initPreloader();
    initLazyImages();
    initCursor();
    initPetals();
    initNavbar();
    initMobileMenu();
    initReveal();
    initHeroVideo();
    initHeartBounce();

    // Load products data, then init features that depend on it
    loadProductsData().then(() => {
      initSearch();
      initFilters();
      initSort();
      initPriceFilter();
      initWishlist();
      initRecentlyViewed();
      initAutoBadges();
      initStarRatings();
      initGlobalSearch();
    });

    initLoadMore();
    initLightbox();
    initBackToTop();
    initSmoothScroll();
    initContactForm();
    initCounters();
    initCookieConsent();
    initNewsletter();
  });

})();
