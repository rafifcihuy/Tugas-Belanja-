const STORAGE_CART = "tokoku_cart";
const STORAGE_VOUCHER = "tokoku_voucher";
const STORAGE_ORDER = "tokoku_last_order";
const VOUCHERS = { HEMAT10: 0.1, PROMO5: 0.05 };
const SHIPPING = { reguler: 15000, express: 30000 };
const FREE_SHIPPING_MIN = 500000;

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

const escapeHTML = (text) =>
  String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

const writeJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const findProduct = (id) => products.find((item) => item.id === Number(id));

const getCart = () => readJSON(STORAGE_CART, []);

const cartCount = () => getCart().reduce((sum, item) => sum + item.qty, 0);

const cartDetails = () =>
  getCart()
    .map((item) => ({ ...findProduct(item.id), qty: item.qty }))
    .filter((item) => item.id);

const cartSubtotal = () => cartDetails().reduce((sum, item) => sum + item.price * item.qty, 0);

const getVoucher = () => readJSON(STORAGE_VOUCHER, null);

const applyVoucher = (code) => {
  const key = code.trim().toUpperCase();
  if (!VOUCHERS[key]) return false;
  writeJSON(STORAGE_VOUCHER, key);
  return true;
};

const removeVoucher = () => localStorage.removeItem(STORAGE_VOUCHER);

const cartDiscount = () => {
  const voucher = getVoucher();
  return voucher && VOUCHERS[voucher] ? Math.round(cartSubtotal() * VOUCHERS[voucher]) : 0;
};

const shippingCost = (type, subtotal) => (type === "reguler" && subtotal >= FREE_SHIPPING_MIN ? 0 : SHIPPING[type]);

let badgeLocked = false;

const updateBadge = (animate = true) => {
  if (badgeLocked) return;
  const total = cartCount();
  document.querySelectorAll(".cart-badge").forEach((badge) => {
    badge.textContent = total;
    if (animate) {
      badge.classList.remove("badge-bump");
      void badge.offsetWidth;
      badge.classList.add("badge-bump");
    }
  });
};

const flySourceFor = (trigger) => {
  const card = trigger ? trigger.closest(".product-card") : null;
  if (card) return card.querySelector("img");
  return document.querySelector(".detail-img");
};

const cartTarget = () => {
  const candidates = [...document.querySelectorAll(".bottom-nav .bn-icon, .app-navbar a[href='keranjang.html']")];
  return candidates.find((element) => element.getClientRects().length > 0) || null;
};

const flyTo = (sourceEl, targetEl, imageSrc, options = {}) => {
  const { delay = 0, bump = 1.25 } = options;

  if (!sourceEl || !targetEl || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return Promise.resolve();
  }

  const from = sourceEl.getBoundingClientRect();
  const to = targetEl.getBoundingClientRect();
  const width = from.width;
  const height = from.height;
  const biggest = Math.max(width, height);

  const startX = from.left;
  const startY = from.top;
  const endX = to.left + to.width / 2 - width / 2;
  const endY = to.top + to.height / 2 - height / 2;
  const midX = (startX + endX) / 2;
  const midY = Math.max(16, Math.min(startY, endY) - 60);
  const endScale = 28 / biggest;
  const midScale = Math.min(1, Math.max(endScale, 96 / biggest));

  const ghost = document.createElement("img");
  ghost.src = imageSrc;
  ghost.alt = "";
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText = `position:fixed;left:0;top:0;width:${width}px;height:${height}px;object-fit:cover;border-radius:18px;z-index:2000;pointer-events:none;box-shadow:0 12px 28px rgba(0,0,0,0.35);`;
  document.body.appendChild(ghost);

  const animation = ghost.animate(
    [
      { transform: `translate(${startX}px, ${startY}px) scale(1)`, opacity: 1, offset: 0 },
      { transform: `translate(${midX}px, ${midY}px) scale(${midScale})`, opacity: 1, offset: 0.55 },
      { transform: `translate(${endX}px, ${endY}px) scale(${endScale})`, opacity: 0.35, offset: 1 }
    ],
    { duration: 800, delay, easing: "cubic-bezier(0.45, 0, 0.55, 1)", fill: "both" }
  );

  return animation.finished
    .then(() => {
      ghost.remove();
      targetEl.animate(
        [{ transform: "scale(1)" }, { transform: `scale(${bump})` }, { transform: "scale(1)" }],
        { duration: 320, easing: "ease-out" }
      );
    })
    .catch(() => ghost.remove());
};

const addToCartWithEffect = (id, qty, trigger) => {
  const image = flySourceFor(trigger);

  badgeLocked = true;
  const result = addToCart(id, qty);

  if (!result.ok) {
    badgeLocked = false;
    updateBadge(false);
    showToast(result.message, "danger");
    return Promise.resolve(result);
  }

  return flyTo(image, cartTarget(), image ? image.src : "").then(() => {
    badgeLocked = false;
    updateBadge(true);
    showToast(result.message);
    return result;
  });
};

const saveCart = (cart) => {
  writeJSON(STORAGE_CART, cart);
  updateBadge();
};

const addToCart = (id, qty = 1) => {
  const product = findProduct(id);
  if (!product) return { ok: false, message: "Produk tidak ditemukan" };
  const cart = getCart();
  const item = cart.find((entry) => entry.id === product.id);
  const current = item ? item.qty : 0;
  if (current + qty > product.stock) {
    return { ok: false, message: `Stok ${product.name} hanya tersisa ${product.stock}` };
  }
  if (item) {
    item.qty += qty;
  } else {
    cart.push({ id: product.id, qty });
  }
  saveCart(cart);
  return { ok: true, message: `${product.name} berhasil ditambahkan ke keranjang` };
};

const setQty = (id, qty) => {
  const product = findProduct(id);
  const cart = getCart();
  const item = cart.find((entry) => entry.id === Number(id));
  if (!item || !product) return;
  item.qty = Math.max(1, Math.min(qty, product.stock));
  saveCart(cart);
};

const removeItem = (id) => saveCart(getCart().filter((entry) => entry.id !== Number(id)));

const clearCart = () => {
  localStorage.removeItem(STORAGE_CART);
  removeVoucher();
  updateBadge(false);
};

const renderStars = (rating) => {
  let html = "";
  for (let i = 1; i <= 5; i += 1) {
    if (rating >= i) html += '<i class="bi bi-star-fill"></i>';
    else if (rating >= i - 0.5) html += '<i class="bi bi-star-half"></i>';
    else html += '<i class="bi bi-star"></i>';
  }
  return html;
};

const renderSteps = (active) => {
  const labels = ["Keranjang", "Pengiriman dan Pembayaran", "Selesai"];
  const items = labels
    .map((label, index) => {
      const number = index + 1;
      const state = number < active ? "done" : number === active ? "active" : "";
      const dot = number < active ? '<i class="bi bi-check-lg"></i>' : number;
      return `<li class="step-item ${state}"><span class="step-dot">${dot}</span><span class="step-label">${label}</span></li>`;
    })
    .join("");
  return `<ol class="step-list" aria-label="Progress checkout">${items}</ol>`;
};

const showToast = (message, type = "success") => {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    document.body.appendChild(container);
  }
  const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
  const element = document.createElement("div");
  element.className = `toast align-items-center text-bg-${type} border-0`;
  element.setAttribute("role", "status");
  element.setAttribute("aria-live", "polite");
  element.setAttribute("aria-atomic", "true");
  element.innerHTML = `<div class="d-flex"><div class="toast-body"><i class="bi ${icon} me-2"></i>${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Tutup"></button></div>`;
  container.appendChild(element);
  element.addEventListener("hidden.bs.toast", () => element.remove());
  new bootstrap.Toast(element, { delay: 2500 }).show();
};

const STORAGE_THEME = "tokoku_theme";

const currentTheme = () => document.documentElement.getAttribute("data-bs-theme") || "light";

const syncThemeIcons = () => {
  const dark = currentTheme() === "dark";
  document.querySelectorAll(".theme-toggle i").forEach((icon) => {
    icon.className = dark ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
  });
  document.querySelectorAll(".theme-toggle .theme-label").forEach((label) => {
    label.textContent = dark ? "Terang" : "Gelap";
  });
};

const applyTheme = (mode) => {
  document.documentElement.setAttribute("data-bs-theme", mode);
  try {
    localStorage.setItem(STORAGE_THEME, mode);
  } catch (error) {
    return;
  } finally {
    syncThemeIcons();
  }
};

const renderBottomNav = () => {
  const old = document.getElementById("bottomNav");
  if (old) old.remove();

  const page = document.body.dataset.page;
  const groups = {
    home: ["home", "produk"],
    cari: ["cari"],
    lacak: ["lacak"],
    keranjang: ["keranjang", "checkout"],
    akun: ["akun"]
  };
  const isActive = (key) => (groups[key].includes(page) ? "active" : "");

  const nav = document.createElement("nav");
  nav.id = "bottomNav";
  nav.className = "bottom-nav";
  nav.setAttribute("aria-label", "Navigasi utama");
  nav.innerHTML = `
    <a class="bn-item ${isActive("home")}" href="index.html">
      <i class="bi bi-house-door-fill"></i><span>Beranda</span>
    </a>
    <a class="bn-item ${isActive("cari")}" href="cari.html">
      <i class="bi bi-search"></i><span>Cari</span>
    </a>
    <a class="bn-item ${isActive("lacak")}" href="lacak.html">
      <i class="bi bi-truck"></i><span>Lacak</span>
    </a>
    <a class="bn-item ${isActive("keranjang")}" href="keranjang.html">
      <span class="bn-icon">
        <i class="bi bi-cart3"></i>
        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger cart-badge">0</span>
      </span>
      <span>Keranjang</span>
    </a>
    <a class="bn-item ${isActive("akun")}" href="akun.html">
      <i class="bi bi-person-circle"></i><span>Akun</span>
    </a>`;
  document.body.appendChild(nav);
};

const renderNavbar = () => {
  const target = document.getElementById("navbar");
  if (!target) return;
  target.innerHTML = `
    <nav class="navbar navbar-expand-lg sticky-top app-navbar">
      <div class="container">
        <a class="navbar-brand fw-bold text-white d-flex align-items-center" href="index.html">
          <img src="img/logo-navbar.svg" alt="" width="36" height="36" class="me-2">
          <span class="brand-text">TokoKu</span>
        </a>
        <form class="flex-grow-1 mx-lg-4 my-2 my-lg-0 order-3 order-lg-2" id="searchForm" role="search">
          <div class="input-group">
            <span class="input-group-text bg-white border-0"><i class="bi bi-search"></i></span>
            <input type="search" class="form-control border-0" id="searchInput" placeholder="Cari produk, misalnya sepatu atau tas" aria-label="Cari produk">
            <button class="btn btn-warning fw-semibold" type="submit">Cari</button>
          </div>
        </form>
        <div class="d-none d-lg-flex gap-2 order-2 order-lg-3">
          <a class="btn btn-outline-light" href="akun.html" aria-label="Akun saya">
            <i class="bi bi-person-circle"></i><span class="ms-1">Akun</span>
          </a>
          <a class="btn btn-outline-light" href="lacak.html" aria-label="Lacak pesanan">
            <i class="bi bi-truck"></i><span class="ms-1">Lacak</span>
          </a>
          <a class="btn btn-light position-relative" href="keranjang.html" aria-label="Keranjang belanja">
            <i class="bi bi-cart3 fs-5"></i>
            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger cart-badge">0</span>
          </a>
        </div>
      </div>
    </nav>`;

  renderBottomNav();

  const form = document.getElementById("searchForm");
  const input = document.getElementById("searchInput");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const keyword = input.value.trim();
    if (typeof window.onSearch === "function") {
      window.onSearch(keyword);
    } else {
      window.location.href = `cari.html?q=${encodeURIComponent(keyword)}`;
    }
  });

  input.addEventListener("input", () => {
    if (typeof window.onSearch === "function") window.onSearch(input.value.trim());
  });

  updateBadge(false);
};

const renderFooter = () => {
  const target = document.getElementById("footer");
  if (!target) return;
  target.innerHTML = `
    <footer class="app-footer text-white py-4 mt-5">
      <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2">
        <span class="fw-semibold"><i class="bi bi-bag-heart-fill me-2"></i>TokoKu</span>
        <small>&copy; 2026 TokoKu.</small>
      </div>
    </footer>`;
};

renderNavbar();
renderFooter();