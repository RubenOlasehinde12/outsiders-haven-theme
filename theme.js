(function () {
  'use strict';

  var money = function (cents) {
    return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
  };

  /* ---------- header height + solid-on-scroll ---------- */
  function headerSetup() {
    var group = document.querySelector('.shopify-section-group-header-group');
    var header = document.querySelector('.oh-header');
    if (!group) return;
    var measure = function () {
      var h = header ? header.offsetHeight : 64;
      document.documentElement.style.setProperty('--oh-headerh', h + 'px');
    };
    measure();
    window.addEventListener('resize', measure);
    if (!header) return;
    var onScroll = function () {
      var solid = window.scrollY > 20;
      header.classList.toggle('is-solid', solid);
      group.classList.toggle('is-solid', solid);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- drawers ---------- */
  var scrim = null;
  function getScrim() {
    if (!scrim) scrim = document.querySelector('[data-scrim]');
    return scrim;
  }
  function openDrawer(el) {
    if (!el) return;
    var s = getScrim();
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    if (s) { s.hidden = false; requestAnimationFrame(function () { s.classList.add('is-open'); }); }
    document.body.classList.add('oh-locked');
  }
  function closeDrawers() {
    var s = getScrim();
    document.querySelectorAll('.oh-drawer.is-open').forEach(function (d) {
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
    });
    if (s) { s.classList.remove('is-open'); setTimeout(function () { s.hidden = true; }, 250); }
    document.body.classList.remove('oh-locked');
  }

  /* ---------- cart ---------- */
  function renderCart(cart) {
    document.querySelectorAll('[data-cart-count]').forEach(function (n) {
      n.textContent = cart.item_count;
    });
    var body = document.querySelector('[data-cart-items]');
    var total = document.querySelector('[data-cart-total]');
    var foot = document.querySelector('[data-cart-foot]');
    if (total) total.textContent = money(cart.total_price);
    if (!body) return;

    if (!cart.items.length) {
      body.innerHTML = '<p class="oh-note oh-empty">YOUR CART IS EMPTY</p>';
      if (foot) foot.style.display = 'none';
      return;
    }
    if (foot) foot.style.display = '';

    var html = '';
    cart.items.forEach(function (item, i) {
      var img = item.image
        ? '<img src="' + item.image.replace(/(\.[a-z]+)(\?|$)/i, '_200x$1$2') + '" alt="">'
        : '<div style="width:72px;height:88px;background:#eee;flex:none"></div>';
      html += '<div class="oh-line">' + img +
        '<div style="flex:1">' +
          '<div class="oh-line-name">' + item.product_title.toUpperCase() + '</div>' +
          '<div class="oh-line-var">' + (item.variant_title ? item.variant_title.toUpperCase() : '') + '</div>' +
          '<div style="margin-top:8px"><div class="oh-stepper">' +
            '<button type="button" data-qty="' + (i + 1) + '" data-to="' + (item.quantity - 1) + '" aria-label="Decrease">&minus;</button>' +
            '<span>' + item.quantity + '</span>' +
            '<button type="button" data-qty="' + (i + 1) + '" data-to="' + (item.quantity + 1) + '" aria-label="Increase">+</button>' +
          '</div></div>' +
          '<button class="oh-remove" type="button" data-qty="' + (i + 1) + '" data-to="0">REMOVE</button>' +
        '</div>' +
        '<div class="oh-line-name">' + money(item.final_line_price) + '</div>' +
      '</div>';
    });
    body.innerHTML = html;
  }

  function fetchCart() {
    return fetch(window.Shopify.routes.root + 'cart.js')
      .then(function (r) { return r.json(); })
      .then(renderCart);
  }

  function changeLine(line, qty) {
    return fetch(window.Shopify.routes.root + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line: line, quantity: qty })
    }).then(function (r) { return r.json(); }).then(renderCart);
  }

  function addToCart(id, qty, btn) {
    var label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'ADDING…'; }
    return fetch(window.Shopify.routes.root + 'cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ id: id, quantity: qty || 1 }] })
    })
      .then(function (r) { return r.json(); })
      .then(function () { return fetchCart(); })
      .then(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        openDrawer(document.querySelector('[data-cart-drawer]'));
      })
      .catch(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
      });
  }

  /* ---------- predictive search ---------- */
  var searchTimer = null;
  function runSearch(term) {
    var out = document.querySelector('[data-search-results]');
    if (!out) return;
    if (!term.trim()) { out.innerHTML = ''; return; }
    fetch(window.Shopify.routes.root + 'search/suggest.json?q=' + encodeURIComponent(term) + '&resources[type]=product&resources[limit]=8')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = (data.resources.results.products || []);
        if (!items.length) { out.innerHTML = '<p class="oh-note" style="padding:18px 0">NO RESULTS</p>'; return; }
        out.innerHTML = items.map(function (p) {
          var img = p.featured_image && p.featured_image.url
            ? '<img src="' + p.featured_image.url + '" alt="">' : '';
          return '<a class="oh-sr" href="' + p.url + '">' + img +
            '<span style="flex:1"><span class="oh-sr-name">' + p.title.toUpperCase() + '</span></span>' +
            '<span class="oh-price">' + p.price + '</span></a>';
        }).join('');
      })
      .catch(function () {
        out.innerHTML = '<p class="oh-note" style="padding:18px 0">SEARCH RUNS ON THE LIVE STORE</p>';
      });
  }

  /* ---------- product size picker ---------- */
  function productSetup() {
    var root = document.querySelector('[data-product]');
    if (!root) return;
    var input = root.querySelector('[data-variant-id]');
    var priceEl = root.querySelector('[data-price]');
    var addBtn = root.querySelector('[data-add]');
    var err = root.querySelector('[data-err]');

    root.querySelectorAll('[data-variant]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('is-soldout')) return;
        root.querySelectorAll('[data-variant]').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        if (input) input.value = btn.getAttribute('data-variant');
        if (priceEl && btn.getAttribute('data-price')) priceEl.textContent = btn.getAttribute('data-price');
        if (err) err.hidden = true;
      });
    });

    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (!input || !input.value) {
          if (err) err.hidden = false;
          return;
        }
        addToCart(input.value, 1, addBtn);
      });
    }

    var stickyAdd = document.querySelector('[data-sticky-add]');
    if (stickyAdd && addBtn) {
      stickyAdd.addEventListener('click', function () {
        if (!input || !input.value) {
          var sizes = root.querySelector('.oh-sizes');
          if (sizes) sizes.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (err) err.hidden = false;
          return;
        }
        addBtn.click();
      });
    }
  }

  /* ---------- boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.Shopify) window.Shopify = {};
    if (!window.Shopify.routes) window.Shopify.routes = { root: '/' };

    headerSetup();
    productSetup();

    document.addEventListener('click', function (e) {
      var open = e.target.closest('[data-open]');
      if (open) {
        e.preventDefault();
        openDrawer(document.querySelector('[data-' + open.getAttribute('data-open') + ']'));
        if (open.getAttribute('data-open') === 'search-drawer') {
          var i = document.querySelector('[data-search-input]');
          if (i) setTimeout(function () { i.focus(); }, 260);
        }
        return;
      }
      if (e.target.closest('[data-close]') || e.target.closest('[data-scrim]')) {
        closeDrawers();
        return;
      }
      var qty = e.target.closest('[data-qty]');
      if (qty) {
        changeLine(parseInt(qty.getAttribute('data-qty'), 10), parseInt(qty.getAttribute('data-to'), 10));
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawers();
    });

    var si = document.querySelector('[data-search-input]');
    if (si) {
      si.addEventListener('input', function () {
        clearTimeout(searchTimer);
        var v = si.value;
        searchTimer = setTimeout(function () { runSearch(v); }, 250);
      });
    }

    document.querySelectorAll('[data-quick-add]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        addToCart(btn.getAttribute('data-quick-add'), 1, btn);
      });
    });
  });
})();

/* ---------- slideshow ---------- */
(function () {
  'use strict';
  function initSlideshow(root) {
    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
    if (slides.length < 2) return;
    var dots = Array.prototype.slice.call(root.querySelectorAll('[data-dot]'));
    var i = 0, timer = null;
    var interval = parseInt(root.getAttribute('data-interval'), 10) || 6000;
    var auto = root.getAttribute('data-autoplay') === 'true';

    function show(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
    }
    function start() { if (auto) { stop(); timer = setInterval(function () { show(i + 1); }, interval); } }
    function stop() { if (timer) clearInterval(timer); }

    var prev = root.querySelector('[data-prev]');
    var next = root.querySelector('[data-next]');
    if (prev) prev.addEventListener('click', function () { show(i - 1); start(); });
    if (next) next.addEventListener('click', function () { show(i + 1); start(); });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { show(parseInt(d.getAttribute('data-dot'), 10)); start(); });
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
      start();
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) auto = false;
    start();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-slideshow]').forEach(initSlideshow);
  });
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-submenu-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var group = btn.closest('[data-submenu]');
        var panel = group.querySelector('[data-submenu-panel]');
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        group.classList.toggle('is-open', !open);
        if (panel) panel.hidden = open;
      });
    });
  });

  /* ---------- product gallery slider (one image at a time) ---------- */
  function initGallery(root) {
    var track = root.querySelector('[data-gallery-track]');
    var slides = root.querySelectorAll('.oh-gallery-slide');
    if (!track || slides.length < 2) return;
    var dots = root.querySelectorAll('[data-gallery-dot]');
    var i = 0;
    var count = slides.length;

    function show(n) {
      i = (n + count) % count;
      track.style.transform = 'translateX(' + (-i * 100) + '%)';
      dots.forEach(function (d, idx) { d.classList.toggle('is-active', idx === i); });
    }

    var prev = root.querySelector('[data-gallery-prev]');
    var next = root.querySelector('[data-gallery-next]');
    if (prev) prev.addEventListener('click', function () { show(i - 1); });
    if (next) next.addEventListener('click', function () { show(i + 1); });
    dots.forEach(function (d, idx) {
      d.addEventListener('click', function () { show(idx); });
    });

    /* keyboard arrows when gallery focused/hovered */
    root.setAttribute('tabindex', '0');
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(i - 1); }
      else if (e.key === 'ArrowRight') { show(i + 1); }
    });

    /* swipe */
    var x0 = null;
    var vp = root.querySelector('[data-gallery-viewport]') || root;
    vp.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    vp.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(dx < 0 ? i + 1 : i - 1);
      x0 = null;
    });

    show(0);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-gallery]').forEach(initGallery);
  });
  document.addEventListener('shopify:section:load', function (e) {
    var g = e.target.querySelector('[data-gallery]');
    if (g) initGallery(g);
  });
})();
