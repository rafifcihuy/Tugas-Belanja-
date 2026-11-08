const items = cartDetails();

if (!items.length) {
  window.location.replace("keranjang.html");
} else {
  document.getElementById("steps").innerHTML = renderSteps(2);

  const form = document.getElementById("checkoutForm");
  const orderItems = document.getElementById("orderItems");
  const orderSummary = document.getElementById("orderSummary");
  const submitButton = document.getElementById("submitButton");
  const submitSpinner = document.getElementById("submitSpinner");
  const submitText = document.getElementById("submitText");

  const subtotal = cartSubtotal();
  const discount = cartDiscount();

  const selectedShipping = () => form.querySelector('input[name="shipping"]:checked').value;

  const priceLabel = (type) => {
    const cost = shippingCost(type, subtotal);
    return cost === 0 ? '<span class="text-success fw-semibold">Gratis</span>' : formatRupiah(cost);
  };

  document.getElementById("priceReguler").innerHTML = priceLabel("reguler");
  document.getElementById("priceExpress").innerHTML = priceLabel("express");

  orderItems.innerHTML = items
    .map(
      (item) => `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="d-flex align-items-center gap-2">
          <img src="${item.image}" alt="${item.name}" width="48" height="48" class="rounded" style="object-fit: cover;">
          <div>
            <div class="small fw-semibold">${item.name}</div>
            <div class="small text-muted">${item.qty} x ${formatRupiah(item.price)}</div>
          </div>
        </div>
        <div class="small fw-semibold">${formatRupiah(item.price * item.qty)}</div>
      </div>`
    )
    .join("");

  const renderSummary = () => {
    const shipping = shippingCost(selectedShipping(), subtotal);
    const total = subtotal - discount + shipping;
    orderSummary.innerHTML = `
      <div class="d-flex justify-content-between mb-2"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>
      <div class="d-flex justify-content-between mb-2 text-success"><span>Diskon</span><span>- ${formatRupiah(discount)}</span></div>
      <div class="d-flex justify-content-between mb-2"><span>Ongkos kirim</span><span>${shipping === 0 ? "Gratis" : formatRupiah(shipping)}</span></div>
      <hr>
      <div class="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span class="text-brand">${formatRupiah(total)}</span></div>`;
    return { shipping, total };
  };

  form.querySelectorAll('input[name="shipping"]').forEach((radio) => radio.addEventListener("change", renderSummary));

  renderSummary();

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add("was-validated");
      const firstInvalid = form.querySelector(":invalid");
      if (firstInvalid) firstInvalid.focus();
      showToast("Periksa kembali data yang belum sesuai", "danger");
      return;
    }

    submitButton.disabled = true;
    submitSpinner.classList.remove("d-none");
    submitText.textContent = "Memproses pesanan...";

    const { shipping, total } = renderSummary();
    const shippingType = selectedShipping();

    const order = {
      id: `TK${Date.now().toString().slice(-8)}`,
      date: new Date().toISOString(),
      customer: {
        nama: document.getElementById("nama").value.trim(),
        telepon: document.getElementById("telepon").value.trim(),
        alamat: document.getElementById("alamat").value.trim(),
        kota: document.getElementById("kota").value.trim(),
        kodepos: document.getElementById("kodepos").value.trim()
      },
      shippingLabel: shippingType === "reguler" ? "Reguler (3 sampai 5 hari)" : "Express (1 sampai 2 hari)",
      payment: document.getElementById("pembayaran").value,
      items: items.map((item) => ({ name: item.name, qty: item.qty, price: item.price })),
      subtotal,
      discount,
      shipping,
      total
    };

    setTimeout(() => {
      writeJSON(STORAGE_ORDER, order);
      clearCart();
      window.location.href = "sukses.html";
    }, 1200);
  });
}