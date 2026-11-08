const detailContent = document.getElementById("detailContent");
const relatedSection = document.getElementById("relatedSection");
const relatedGrid = document.getElementById("relatedGrid");

const productId = new URLSearchParams(window.location.search).get("id");
const product = findProduct(productId);

if (!product) {
  detailContent.innerHTML = `
    <div class="text-center py-5">
      <i class="bi bi-search display-3 text-muted"></i>
      <h5 class="mt-3">Produk tidak ditemukan</h5>
      <p class="text-muted">Produk yang Anda cari mungkin sudah tidak tersedia.</p>
      <a href="index.html" class="btn btn-primary">Kembali ke Beranda</a>
    </div>`;
} else {
  document.title = `${product.name} - TokoKu`;
  let qty = 1;

  detailContent.innerHTML = `
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><a href="index.html">Beranda</a></li>
        <li class="breadcrumb-item">${product.category}</li>
        <li class="breadcrumb-item active" aria-current="page">${product.name}</li>
      </ol>
    </nav>
    <div class="row g-4">
      <div class="col-md-6">
        <img src="${product.image}" class="detail-img shadow-sm" alt="${product.name}">
      </div>
      <div class="col-md-6">
        <span class="badge category-badge mb-2">${product.category}</span>
        <h3 class="fw-bold">${product.name}</h3>
        <div class="rating-stars mb-2">
          ${renderStars(product.rating)}
          <small class="text-muted ms-1">${product.rating} | ${product.sold.toLocaleString("id-ID")} terjual</small>
        </div>
        <p class="detail-price mb-3">${formatRupiah(product.price)}</p>
        <p class="text-muted">${product.desc}</p>
        <p class="mb-3">
          <i class="bi bi-box-seam me-1 text-brand"></i>Stok tersedia: <strong id="stockText">${product.stock}</strong>
        </p>
        <div class="d-flex align-items-center gap-3 mb-4">
          <span>Jumlah</span>
          <div class="qty-control">
            <button type="button" id="qtyMinus" aria-label="Kurangi jumlah">-</button>
            <span id="qtyValue">1</span>
            <button type="button" id="qtyPlus" aria-label="Tambah jumlah">+</button>
          </div>
        </div>
        <div class="d-flex flex-column flex-sm-row gap-2">
          <button class="btn btn-outline-primary btn-lg flex-fill" type="button" id="addButton">
            <i class="bi bi-cart-plus me-1"></i>Tambah ke Keranjang
          </button>
          <button class="btn btn-primary btn-lg flex-fill" type="button" id="buyButton">Beli Sekarang</button>
        </div>
      </div>
    </div>`;

  const qtyValue = document.getElementById("qtyValue");

  document.getElementById("qtyMinus").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    qtyValue.textContent = qty;
  });

  document.getElementById("qtyPlus").addEventListener("click", () => {
    if (qty >= product.stock) {
      showToast(`Stok maksimal ${product.stock} buah`, "danger");
      return;
    }
    qty += 1;
    qtyValue.textContent = qty;
  });

  document.getElementById("addButton").addEventListener("click", () => {
    const result = addToCart(product.id, qty);
    showToast(result.message, result.ok ? "success" : "danger");
  });

  document.getElementById("buyButton").addEventListener("click", () => {
    const result = addToCart(product.id, qty);
    if (result.ok) {
      window.location.href = "keranjang.html";
    } else {
      showToast(result.message, "danger");
    }
  });

  const related = products.filter((item) => item.category === product.category && item.id !== product.id).slice(0, 4);

  if (related.length) {
    relatedSection.classList.remove("d-none");
    relatedGrid.innerHTML = related
      .map(
        (item) => `
        <div class="col-6 col-md-3">
          <div class="card product-card h-100 shadow-sm">
            <a href="produk.html?id=${item.id}">
              <img src="${item.image}" class="card-img-top" alt="${item.name}" loading="lazy">
            </a>
            <div class="card-body">
              <h6 class="card-title">
                <a class="product-link" href="produk.html?id=${item.id}">${item.name}</a>
              </h6>
              <p class="product-price mb-0">${formatRupiah(item.price)}</p>
            </div>
          </div>
        </div>`
      )
      .join("");
  }
}