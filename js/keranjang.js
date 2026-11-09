const content = document.getElementById("cartContent");
document.getElementById("steps").innerHTML = renderSteps(1);

const renderCart = () => {
  const items = cartDetails();

  if (!items.length) {
    content.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x display-1 text-muted"></i>
        <h5 class="mt-3">Keranjang Anda masih kosong</h5>
        <p class="text-muted">Yuk, pilih produk favorit Anda terlebih dahulu.</p>
        <a href="index.html" class="btn btn-primary">Mulai Belanja</a>
      </div>`;
    return;
  }

  const subtotal = cartSubtotal();
  const discount = cartDiscount();
  const voucher = getVoucher();
  const total = subtotal - discount;

  const rows = items
    .map(
      (item) => `
      <div class="card cart-item shadow-sm mb-3">
        <div class="card-body">
          <div class="row g-3 align-items-center cart-item-layout">
            <div class="col-auto cart-item-image">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="col cart-item-info">
              <a class="product-link fw-semibold" href="produk.html?id=${item.id}">${item.name}</a>
              <div class="text-muted small">${item.category}</div>
              <div class="product-price">${formatRupiah(item.price)}</div>
            </div>
            <div class="col-12 col-md-auto d-flex align-items-center justify-content-between gap-3 cart-item-actions">
              <div class="qty-control">
                <button type="button" data-action="minus" data-id="${item.id}" aria-label="Kurangi jumlah">-</button>
                <span>${item.qty}</span>
                <button type="button" data-action="plus" data-id="${item.id}" aria-label="Tambah jumlah">+</button>
              </div>
              <div class="fw-bold text-end cart-item-total">${formatRupiah(item.price * item.qty)}</div>
              <button class="btn btn-outline-danger btn-sm" type="button" data-action="remove" data-id="${item.id}" aria-label="Hapus ${item.name}">
                <i class="bi bi-trash3"></i>
              </button>
            </div>
          </div>
        </div>
      </div>`
    )
    .join("");

  const voucherInfo = voucher
    ? `<div class="alert alert-success py-2 d-flex justify-content-between align-items-center mb-3">
         <span><i class="bi bi-tag-fill me-1"></i>${voucher} dipakai</span>
         <button type="button" class="btn btn-sm btn-link text-danger p-0" data-action="removeVoucher">Lepas</button>
       </div>`
    : `<form id="voucherForm" class="input-group mb-3">
         <input type="text" class="form-control" id="voucherInput" placeholder="Kode voucher" aria-label="Kode voucher">
         <button class="btn btn-outline-primary" type="submit">Pakai</button>
       </form>`;

  content.innerHTML = `
    <div class="row g-4">
      <div class="col-lg-8">${rows}</div>
      <div class="col-lg-4 cart-summary-column">
        <div class="card border-0 shadow-sm sticky-summary cart-summary-card">
          <div class="card-body">
            <h6 class="fw-bold mb-3">Ringkasan Belanja</h6>
            ${voucherInfo}
            <div class="d-flex justify-content-between mb-2">
              <span>Subtotal</span><span>${formatRupiah(subtotal)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2 text-success">
              <span>Diskon</span><span>- ${formatRupiah(discount)}</span>
            </div>
            <div class="d-flex justify-content-between mb-2 text-muted small">
              <span>Ongkos kirim</span><span>Dihitung di checkout</span>
            </div>
            <hr>
            <div class="d-flex justify-content-between fw-bold fs-5 mb-3">
              <span>Total</span><span class="text-brand">${formatRupiah(total)}</span>
            </div>
            <a href="checkout.html" class="btn btn-primary w-100 btn-lg">Lanjut ke Checkout</a>
            <a href="index.html" class="btn btn-link w-100 mt-2">Lanjut Belanja</a>
          </div>
        </div>
      </div>
    </div>`;
};

content.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const entry = getCart().find((item) => item.id === id);

  if (action === "plus" && entry) {
    const product = findProduct(id);
    if (entry.qty >= product.stock) {
      showToast(`Stok ${product.name} hanya tersisa ${product.stock}`, "danger");
      return;
    }
    setQty(id, entry.qty + 1);
  }

  if (action === "minus" && entry) {
    if (entry.qty === 1) {
      removeItem(id);
      showToast("Produk dihapus dari keranjang");
    } else {
      setQty(id, entry.qty - 1);
    }
  }

  if (action === "remove") {
    removeItem(id);
    showToast("Produk dihapus dari keranjang");
  }

  if (action === "removeVoucher") {
    removeVoucher();
    showToast("Voucher dilepas");
  }

  renderCart();
});

content.addEventListener("submit", (event) => {
  if (event.target.id !== "voucherForm") return;
  event.preventDefault();
  const code = document.getElementById("voucherInput").value;
  if (applyVoucher(code)) {
    showToast("Voucher berhasil dipakai");
    renderCart();
  } else {
    showToast("Kode voucher tidak valid", "danger");
  }
});

renderCart();