/* ═══════════════════════════════════════════════
   මල්කා — PRODUCT PAGE FEATURES
   Shared script for all product pages:
   - Image gallery with thumbnails
   - Related products
   - Stock urgency messaging
   - Size/dimension info
   - Wishlist toggle
   - Recently viewed tracking
   ═══════════════════════════════════════════════ */

(function () {
    'use strict';

    // Detect if we're in /products/ subdirectory
    const isSubDir = window.location.pathname.includes('/products/');
    const basePath = isSubDir ? '../' : '';

    // Extract product ID from URL
    function getProductId() {
        const path = window.location.pathname;
        const match = path.match(/products\/([^/.]+)\.html/);
        if (match) return match[1];
        // Fallback: check query param
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    const productId = getProductId();
    if (!productId) return;

    // Load products data
    fetch(basePath + 'products.json')
        .then(r => r.json())
        .then(products => {
            const product = products.find(p => p.id === productId);
            if (!product) return;

            initImageGallery(product);
            initStockUrgency(product);
            initSizeInfo(product);
            initSizeCompare(product);
            initRelatedProducts(product, products);
            initProductWishlist(product);
            trackRecentlyViewed(product);
            initRecentlyViewedSection(products);
            initDeliveryLink(product);
        })
        .catch(() => { });

    /* ─── IMAGE GALLERY ─── */
    function initImageGallery(product) {
        if (!product.images || product.images.length <= 1) return;

        const imgWrap = document.querySelector('.pd-img-wrap');
        const mainImg = imgWrap ? imgWrap.querySelector('img') : null;
        if (!imgWrap || !mainImg) return;

        // Create thumbnails container
        const thumbsDiv = document.createElement('div');
        thumbsDiv.className = 'pd-thumbs';

        product.images.forEach((src, i) => {
            const thumb = document.createElement('div');
            thumb.className = 'pd-thumb' + (i === 0 ? ' active' : '');
            const img = document.createElement('img');
            img.src = basePath + src;
            img.alt = product.name + ' view ' + (i + 1);
            img.loading = 'lazy';
            thumb.appendChild(img);

            thumb.addEventListener('click', () => {
                mainImg.src = basePath + src;
                mainImg.alt = product.name + ' view ' + (i + 1);
                thumbsDiv.querySelectorAll('.pd-thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });

            thumbsDiv.appendChild(thumb);
        });

        // Insert after the image wrap
        const gallery = imgWrap.closest('.pd-gallery');
        if (gallery) {
            gallery.appendChild(thumbsDiv);
        } else {
            imgWrap.parentNode.insertBefore(thumbsDiv, imgWrap.nextSibling);
        }
    }

    /* ─── STOCK URGENCY ─── */
    function initStockUrgency(product) {
        if (!product.stock || product.stock > 5) return;

        const details = document.querySelector('.pd-details');
        if (!details) return;

        const row = document.createElement('div');
        row.className = 'pd-detail-row';
        row.innerHTML = `
      <span class="pd-detail-label">Availability</span>
      <span class="pd-detail-value">
        <span class="stock-urgency">Only ${product.stock} left — order soon!</span>
      </span>
    `;

        // Replace existing availability row
        const existingAvail = details.querySelector('.pd-avail');
        if (existingAvail) {
            existingAvail.closest('.pd-detail-row').replaceWith(row);
        } else {
            details.appendChild(row);
        }
    }

    /* ─── SIZE/DIMENSION INFO ─── */
    function initSizeInfo(product) {
        const details = document.querySelector('.pd-details');
        if (!details) return;

        if (product.height) {
            const row = document.createElement('div');
            row.className = 'pd-detail-row';
            row.innerHTML = `
        <span class="pd-detail-label">Plant Height</span>
        <span class="pd-detail-value">${product.height}</span>
      `;
            details.appendChild(row);
        }

        if (product.potDiameter) {
            const row = document.createElement('div');
            row.className = 'pd-detail-row';
            row.innerHTML = `
        <span class="pd-detail-label">Pot Diameter</span>
        <span class="pd-detail-value">${product.potDiameter}</span>
      `;
            details.appendChild(row);
        }
    }

    /* ─── SIZE COMPARISON VISUAL ─── */
    function initSizeCompare(product) {
        if (!product.height) return;
        // Parse height in cm
        const match = product.height.match(/(\d+)/);
        if (!match) return;
        const cm = parseInt(match[1], 10);
        if (isNaN(cm) || cm <= 0) return;

        const gallery = document.querySelector('.pd-gallery');
        if (!gallery) return;

        // Reference objects (cm)
        const refs = [
            { name: 'Coffee mug', icon: '\u2615', h: 10 },
            { name: 'A4 paper', icon: '\uD83D\uDCC4', h: 30 },
            { name: 'Desk lamp', icon: '\uD83D\uDCA1', h: 45 }
        ];
        // Pick best reference (closest without being identical)
        let best = refs[0];
        let bestDiff = Infinity;
        refs.forEach(r => {
            const diff = Math.abs(r.h - cm);
            if (diff < bestDiff && r.h !== cm) { bestDiff = diff; best = r; }
        });

        const maxH = Math.max(cm, best.h);
        const scale = 120; // max bar height in px
        const plantBarH = Math.round((cm / maxH) * scale);
        const refBarH = Math.round((best.h / maxH) * scale);

        const div = document.createElement('div');
        div.className = 'size-compare';
        div.innerHTML = `
            <div class="size-compare-title">Size comparison</div>
            <div class="size-compare-visual">
                <div class="size-ref">
                    <div class="size-bar" style="height:${refBarH}px;">
                        <span class="size-bar-label">${best.h} cm</span>
                    </div>
                    <span class="size-ref-icon">${best.icon}</span>
                    <span class="size-ref-name">${best.name}</span>
                </div>
                <div class="size-plant">
                    <div class="size-bar" style="height:${plantBarH}px;">
                        <span class="size-bar-label">${cm} cm</span>
                    </div>
                    <span class="size-ref-icon">\uD83C\uDF31</span>
                    <span class="size-plant-name">This plant</span>
                </div>
            </div>
        `;
        gallery.appendChild(div);
    }

    /* ─── RELATED PRODUCTS ─── */
    function initRelatedProducts(product, products) {
        const container = document.querySelector('.pd');
        if (!container) return;

        // Get products of same type, excluding current
        let related = products.filter(p => p.type === product.type && p.id !== product.id);

        // Shuffle and pick 4
        related = shuffleArray(related).slice(0, 4);
        if (related.length === 0) return;

        const section = document.createElement('div');
        section.className = 'related-section';
        section.innerHTML = `
      <div class="container">
        <h3 class="related-title">You may also like</h3>
        <div class="related-grid">
          ${related.map(p => `
            <a class="related-card" href="${basePath}products/${p.id}.html">
              <img class="related-card-img" src="${basePath}${p.img}" alt="${p.name}" loading="lazy">
              <div class="related-card-info">
                <div class="related-card-name">${p.name}</div>
                <div class="related-card-price">${p.price}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;

        // Insert before footer
        const footer = document.querySelector('.foot');
        if (footer) {
            footer.parentNode.insertBefore(section, footer);
        } else {
            container.appendChild(section);
        }
    }

    /* ─── PRODUCT PAGE WISHLIST ─── */
    function initProductWishlist(product) {
        const STORAGE_KEY = 'malka_wishlist';
        let wishlist = safeParseJSON(localStorage.getItem(STORAGE_KEY), []);

        const actions = document.querySelector('.pd-actions');
        if (!actions) return;

        const btn = document.createElement('button');
        btn.className = 'btn-ghost pd-wishlist-btn';
        btn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${wishlist.includes(product.id) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      ${wishlist.includes(product.id) ? 'Saved to Wishlist' : 'Save for Later'}
    `;
        btn.style.cssText = wishlist.includes(product.id) ? 'color: #e74c3c; border-color: #e74c3c;' : '';

        btn.addEventListener('click', () => {
            wishlist = safeParseJSON(localStorage.getItem(STORAGE_KEY), []);
            if (wishlist.includes(product.id)) {
                wishlist = wishlist.filter(x => x !== product.id);
                btn.querySelector('svg').setAttribute('fill', 'none');
                btn.innerHTML = btn.innerHTML.replace('Saved to Wishlist', 'Save for Later');
                btn.style.cssText = '';
            } else {
                wishlist.push(product.id);
                btn.querySelector('svg').setAttribute('fill', 'currentColor');
                btn.innerHTML = btn.innerHTML.replace('Save for Later', 'Saved to Wishlist');
                btn.style.cssText = 'color: #e74c3c; border-color: #e74c3c;';
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
        });

        actions.appendChild(btn);
    }

    /* ─── TRACK RECENTLY VIEWED ─── */
    function trackRecentlyViewed(product) {
        const RV_KEY = 'malka_recently_viewed';
        let viewed = safeParseJSON(localStorage.getItem(RV_KEY), []);

        // Remove if already exists, then add to front
        viewed = viewed.filter(id => id !== product.id);
        viewed.unshift(product.id);

        // Keep max 10
        viewed = viewed.slice(0, 10);

        localStorage.setItem(RV_KEY, JSON.stringify(viewed));
    }

    /* ─── RECENTLY VIEWED SECTION ON PRODUCT PAGE ─── */
    function initRecentlyViewedSection(products) {
        const RV_KEY = 'malka_recently_viewed';
        const viewed = safeParseJSON(localStorage.getItem(RV_KEY), [])
            .filter(id => id !== productId); // Exclude current product

        if (viewed.length === 0) return;

        const items = viewed
            .map(id => products.find(p => p.id === id))
            .filter(Boolean)
            .slice(0, 6);

        if (items.length === 0) return;

        const section = document.createElement('section');
        section.className = 'recently-viewed';
        section.innerHTML = `
      <div class="container">
        <h3 class="rv-title">Recently Viewed</h3>
        <div class="rv-scroll">
          ${items.map(p => `
            <a class="rv-card" href="${basePath}products/${p.id}.html">
              <img class="rv-card-img" src="${basePath}${p.img}" alt="${p.name}" loading="lazy">
              <div class="rv-card-info">
                <div class="rv-card-name">${p.name}</div>
                <div class="rv-card-price">${p.price}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;

        const footer = document.querySelector('.foot');
        if (footer) {
            footer.parentNode.insertBefore(section, footer);
        }
    }

    /* ─── DELIVERY INFO LINK ─── */
    function initDeliveryLink(product) {
        const promise = document.querySelector('.pd-promise');
        if (!promise) return;

        // Add delivery link after promises
        const link = document.createElement('a');
        link.href = basePath + 'delivery.html';
        link.className = 'pd-delivery-link';
        link.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>';
        link.innerHTML += product.priceNum >= 3000
            ? ' <strong>Free delivery</strong> on this order — <span>view delivery info →</span>'
            : ' Free delivery over Rs. 3,000 — <span>view delivery info →</span>';

        promise.parentNode.insertBefore(link, promise.nextSibling);
    }

    /* ─── UTILITIES ─── */
    function safeParseJSON(str, fallback) {
        try { return JSON.parse(str); } catch (e) { return fallback; }
    }

    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

})();
