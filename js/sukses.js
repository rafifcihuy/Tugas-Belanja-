const successContent = document.getElementById("successContent");
const order = readJSON(STORAGE_ORDER, null);

const playConfetti = () => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.className = "confetti-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const colors = ["#0c8377", "#2dd4bf", "#ff9f1c", "#f472b6", "#facc15"];
  const particles = Array.from({ length: 120 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 7;
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 5 + Math.random() * 6,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  });

  let width = 0;
  let height = 0;
  const resizeCanvas = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const startedAt = performance.now();
  const duration = 5000;
  const animate = (now) => {
    context.clearRect(0, 0, width, height);

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.06;
      particle.vx *= 0.995;
      particle.rotation += particle.spin;

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.65);
      context.restore();
    });

    if (now - startedAt < duration) {
      requestAnimationFrame(animate);
      return;
    }

    window.removeEventListener("resize", resizeCanvas);
    canvas.remove();
  };

  requestAnimationFrame(animate);
};

if (!order) {
  window.location.replace("index.html");
} else {
  simpanRiwayat(order);
  document.getElementById("steps").innerHTML = renderSteps(4);

  const dateText = new Date(order.date).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

  const rows = order.items
    .map((item) => {
      const product = products.find((candidate) => candidate.id === Number(item.id) || candidate.name === item.name);
      const image = product ? product.image : "img/logo-ikon.svg";
      return `
        <div class="d-flex align-items-center gap-2 mb-2">
          <img src="${image}" alt="" width="52" height="52" class="rounded flex-shrink-0" style="object-fit: cover;">
          <span class="flex-grow-1">${escapeHTML(item.name)} <small class="text-muted">x ${item.qty}</small></span>
          <span>${formatRupiah(item.price * item.qty)}</span>
        </div>`;
    })
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

    <div class="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mt-4">
      <a href="lacak.html?id=${order.id}" class="btn btn-primary btn-lg"><i class="bi bi-truck me-1"></i>Lacak Pesanan</a>
      <a href="index.html" class="btn btn-outline-primary btn-lg">Kembali Belanja</a>
    </div>`;

  playConfetti();
}