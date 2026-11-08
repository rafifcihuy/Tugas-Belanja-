const successContent = document.getElementById("successContent");
const order = readJSON(STORAGE_ORDER, null);

if (!order) {
  window.location.replace("index.html");
} else {
  simpanRiwayat(order);
  document.getElementById("steps").innerHTML = renderSteps(4);

  const dateText = new Date(order.date).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

  const rows = order.items
    .map(
      (item) => `
      <div class="d-flex justify-content-between mb-2">
        <span>${escapeHTML(item.name)} <small class="text-muted">x ${item.qty}</small></span>
        <span>${formatRupiah(item.price * item.qty)}</span>
      </div>`
    )
    .join("");

  successContent.innerHTML = `
    <div class="text-center mb-4">
      <i class="bi bi-check-circle-fill success-icon"></i>
      <h3 class="fw-bold mt-2">Pesanan Berhasil Dibuat</h3>
      <p class="text-muted mb-0">Terima kasih, ${escapeHTML(order.customer.nama)}. Nomor pesanan Anda <strong>${order.id}</strong></p>
      <small class="text-muted">${dateText}</small>
    </div>

    <div class="row g-4 justify-content-center">
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="fw-bold mb-3"><i class="bi bi-geo-alt-fill me-2 text-brand"></i>Pengiriman</h6>
            <p class="mb-1 fw-semibold">${escapeHTML(order.customer.nama)} | ${escapeHTML(order.customer.telepon)}</p>
            <p class="mb-1">${escapeHTML(order.customer.alamat)}</p>
            <p class="mb-3">${escapeHTML(order.customer.kota)} ${escapeHTML(order.customer.kodepos)}</p>
            <p class="mb-1"><span class="text-muted">Kurir:</span> ${order.shippingLabel}</p>
            <p class="mb-0"><span class="text-muted">Pembayaran:</span> ${escapeHTML(order.payment)}</p>
          </div>
        </div>
      </div>
      <div class="col-lg-5">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="fw-bold mb-3"><i class="bi bi-receipt me-2 text-brand"></i>Rincian Pesanan</h6>
            ${rows}
            <hr>
            <div class="d-flex justify-content-between mb-1"><span>Subtotal</span><span>${formatRupiah(order.subtotal)}</span></div>
            <div class="d-flex justify-content-between mb-1 text-success"><span>Diskon</span><span>- ${formatRupiah(order.discount)}</span></div>
            <div class="d-flex justify-content-between mb-2"><span>Ongkos kirim</span><span>${order.shipping === 0 ? "Gratis" : formatRupiah(order.shipping)}</span></div>
            <div class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span class="text-brand">${formatRupiah(order.total)}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="text-center mt-4">
            <a href="lacak.html?id=${order.id}" class="btn btn-primary btn-lg me-2"><i class="bi bi-truck me-1"></i>Lacak Pesanan</a>
      <a href="index.html" class="btn btn-outline-primary btn-lg">Kembali Belanja</a>
    </div>`;
}