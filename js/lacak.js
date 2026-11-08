syncLastOrder();

const params = new URLSearchParams(window.location.search);
let activeId = params.get("id");

const orderList = document.getElementById("orderList");
const trackDetail = document.getElementById("trackDetail");
const trackForm = document.getElementById("trackForm");
const trackInput = document.getElementById("trackInput");

const formatDateTime = (value) =>
  new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

const statusBadge = (index) => {
  if (index === TRACK_STAGES.length - 1) return '<span class="badge bg-success">Selesai</span>';
  if (index >= KURIR_STAGE_INDEX) return '<span class="badge bg-primary">Dalam pengiriman</span>';
  return '<span class="badge bg-warning text-dark">Diproses</span>';
};

const listItemHTML = (order) => `
  <button type="button" class="order-item ${order.id === activeId ? "active" : ""}" data-action="select" data-id="${order.id}">
    <div class="d-flex justify-content-between align-items-center mb-1">
      <strong>${order.id}</strong>
      ${statusBadge(currentStageIndex(order))}
    </div>
    <small class="text-muted d-block">${formatDateTime(order.date)}</small>
    <small class="fw-semibold">${formatRupiah(order.total)}</small>
  </button>`;

const detailHTML = (order) => {
  const index = currentStageIndex(order);
  const lastIndex = TRACK_STAGES.length - 1;
  const finished = index === lastIndex;
  const withCourier = index >= KURIR_STAGE_INDEX;
  const percent = Math.round((index / lastIndex) * 100);
  const express = order.shippingLabel.startsWith("Express");
  const eta = new Date(new Date(order.date).getTime() + (express ? 2 : 5) * 86400000).toLocaleDateString("id-ID", { dateStyle: "long" });
  const resi = withCourier ? `TKR${order.id.slice(2)}` : "Belum tersedia";

  const banner = withCourier
    ? `<div class="track-status sudah mb-4">
         <i class="bi bi-check-circle-fill"></i>
         <div>
           <strong>${finished ? "Paket sudah tiba di tujuan" : "Paket sudah diserahkan ke kurir"}</strong>
           <div class="small">${finished ? "Pesanan selesai." : "Pesanan sedang dalam pengiriman menuju alamat Anda."}</div>
         </div>
       </div>`
    : `<div class="track-status belum mb-4">
         <i class="bi bi-hourglass-split"></i>
         <div>
           <strong>Belum diserahkan ke kurir</strong>
           <div class="small">Pesanan masih diproses penjual. Nomor resi terbit setelah paket diserahkan ke kurir.</div>
         </div>
       </div>`;

  const timeline = TRACK_STAGES.map((stage, i) => {
    const state = i < index || finished ? "done" : i === index ? "current" : "pending";
    const icon = state === "done" ? "bi-check-lg" : stage.icon;
    const time = i <= index ? `<small class="text-muted d-block">${formatDateTime(stageTime(order, i))}</small>` : "";
    return `
      <li class="track-item ${state}">
        <span class="track-icon"><i class="bi ${icon}"></i></span>
        <div class="track-title fw-semibold">${stage.title}</div>
        <div class="small text-muted">${stage.desc}</div>
        ${time}
      </li>`;
  }).join("");

  const items = order.items
    .map((item) => `<div class="d-flex justify-content-between small mb-1"><span>${escapeHTML(item.name)} x ${item.qty}</span><span>${formatRupiah(item.price * item.qty)}</span></div>`)
    .join("");

  return `
    ${banner}
    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
          <div>
            <h6 class="fw-bold mb-0">Pesanan ${order.id}</h6>
            <small class="text-muted">${formatDateTime(order.date)}</small>
          </div>
          ${statusBadge(index)}
        </div>
        <div class="progress mb-3" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100" style="height: 8px;">
          <div class="progress-bar bg-success" style="width: ${percent}%; background-color: var(--brand-main) !important;"></div>
        </div>
        <div class="row g-2 small">
          <div class="col-sm-6"><span class="text-muted">Nomor resi:</span> <strong>${resi}</strong></div>
          <div class="col-sm-6"><span class="text-muted">Layanan:</span> <strong>${order.shippingLabel}</strong></div>
          <div class="col-sm-6"><span class="text-muted">Estimasi tiba:</span> <strong>${eta}</strong></div>
          <div class="col-sm-6"><span class="text-muted">Pembayaran:</span> <strong>${escapeHTML(order.payment)}</strong></div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm mb-4">
      <div class="card-body">
        <h6 class="fw-bold mb-3">Riwayat Status</h6>
        <ol class="track-timeline">${timeline}</ol>
      </div>
    </div>

    <div class="row g-4 mb-4">
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="fw-bold mb-2"><i class="bi bi-geo-alt-fill me-2 text-brand"></i>Alamat Tujuan</h6>
            <p class="mb-1 fw-semibold small">${escapeHTML(order.customer.nama)} | ${escapeHTML(order.customer.telepon)}</p>
            <p class="mb-0 small">${escapeHTML(order.customer.alamat)}, ${escapeHTML(order.customer.kota)} ${escapeHTML(order.customer.kodepos)}</p>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card border-0 shadow-sm h-100">
          <div class="card-body">
            <h6 class="fw-bold mb-2"><i class="bi bi-receipt me-2 text-brand"></i>Barang Dipesan</h6>
            ${items}
            <hr class="my-2">
            <div class="d-flex justify-content-between fw-bold"><span>Total</span><span class="text-brand">${formatRupiah(order.total)}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div class="card border-0 shadow-sm">
      <div class="card-body">
        <h6 class="fw-bold mb-1">Mode Demo</h6>
        <p class="small text-muted mb-3">Waktu asli antar tahap 1 sampai 15 menit. Gunakan tombol ini untuk mempercepat saat presentasi.</p>
        <div class="d-flex flex-wrap gap-2">
          ${finished ? "" : `<button type="button" class="btn btn-primary" data-action="skip" data-id="${order.id}"><i class="bi bi-skip-forward-fill me-1"></i>Simulasikan Langkah Berikutnya</button>`}
          <button type="button" class="btn btn-outline-secondary" data-action="reset" data-id="${order.id}"><i class="bi bi-arrow-counterclockwise me-1"></i>Ulangi dari Awal</button>
        </div>
      </div>
    </div>`;
};

const render = () => {
  const orders = getOrders();

  if (!orders.length) {
    orderList.innerHTML = "";
    trackDetail.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-box-seam display-1 text-muted"></i>
        <h5 class="mt-3">Belum ada pesanan</h5>
        <p class="text-muted">Pesanan yang sudah Anda checkout akan muncul di sini.</p>
        <a href="index.html" class="btn btn-primary">Mulai Belanja</a>
      </div>`;
    return;
  }

  if (!orders.some((item) => item.id === activeId)) activeId = orders[0].id;

  orderList.innerHTML = `<h6 class="fw-bold mb-3">Pesanan Saya</h6>${orders.map(listItemHTML).join("")}`;
  trackDetail.innerHTML = detailHTML(orders.find((item) => item.id === activeId));
};

document.addEventListener("click", (event) => {
  const element = event.target.closest("[data-action]");
  if (!element) return;

  const action = element.dataset.action;
  const id = element.dataset.id;

  if (action === "select") activeId = id;

  if (action === "skip") {
    skipStage(id);
    showToast("Status pesanan diperbarui");
  }

  if (action === "reset") {
    resetStage(id);
    showToast("Simulasi diulang dari awal");
  }

  render();
});

trackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = trackInput.value.trim().toUpperCase();
  const found = getOrders().find((item) => item.id === code);
  if (!found) {
    showToast("Nomor pesanan tidak ditemukan di perangkat ini", "danger");
    return;
  }
  activeId = found.id;
  render();
});

setInterval(render, 5000);

render();